import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';

/**
 * Node-only Gemini access for the build-time pipeline. Nothing in the app
 * imports this module; the key is read from the environment of the process
 * running `npm run generate:artscape` and never reaches the browser.
 */
if (typeof window !== 'undefined') {
  throw new Error('src/lib/gemini/client.ts must not be bundled into the browser.');
}

export const DEFAULT_MODEL = 'gemini-2.5-flash';

export type ContentPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface ModelRequest {
  /** Short name used in logs and error messages, e.g. "A great-wave". */
  label: string;
  system: string;
  parts: ContentPart[];
  /** JSON Schema for structured output (a Gemini-compatible subset). */
  responseJsonSchema: object;
  /** Sampling temperature; defaults to 0.2. */
  temperature?: number;
}

/** One model call returning raw response text. Swappable so tests need no network. */
export type ModelCall = (request: ModelRequest) => Promise<string>;

export class GeminiUnavailableError extends Error {}

/** A configured key and the name it is logged under ("key-2"). The key itself is never logged. */
export interface ApiKeySlot {
  label: string;
  apiKey: string;
}

/**
 * Keys come from GEMINI_API_KEY_1, GEMINI_API_KEY_2, … (in numeric order) and
 * the plain GEMINI_API_KEY (slot "key-default"). Placeholders and duplicate
 * values are skipped. `apiKey` is the first slot's key.
 */
export function readGeminiConfig(env: Record<string, string | undefined> = process.env) {
  const numbered = Object.keys(env)
    .map((name) => name.match(/^GEMINI_API_KEY_(\d+)$/))
    .filter((m): m is RegExpMatchArray => !!m)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((m) => ({ label: `key-${Number(m[1])}`, apiKey: env[m[0]]?.trim() ?? '' }));
  const keys: ApiKeySlot[] = [];
  for (const slot of [...numbered, { label: 'key-default', apiKey: env.GEMINI_API_KEY?.trim() ?? '' }]) {
    if (!slot.apiKey || slot.apiKey.startsWith('your-gemini-api-key')) continue;
    if (keys.some((k) => k.apiKey === slot.apiKey)) continue;
    keys.push(slot);
  }
  if (!keys.length) {
    throw new GeminiUnavailableError(
      'No Gemini key is set. Copy .env.example to .env and set GEMINI_API_KEY (or GEMINI_API_KEY_1, _2, …) from https://aistudio.google.com/apikey.',
    );
  }
  return { apiKey: keys[0].apiKey, keys, model: env.GEMINI_MODEL?.trim() || DEFAULT_MODEL };
}

/** HTTP 429 / RESOURCE_EXHAUSTED: this key's rate limit or quota, the only reason to switch keys. */
export function isRateLimitError(error: unknown): boolean {
  const e = error as { status?: number; message?: string } | undefined;
  return e?.status === 429 || /RESOURCE_EXHAUSTED/.test(e?.message ?? '');
}

/** A 429 against a per-day quota (e.g. the free tier's daily request limit): no retry can succeed today. */
export function isDailyQuotaError(error: unknown): boolean {
  return isRateLimitError(error) && /PerDay/.test((error as { message?: string } | undefined)?.message ?? '');
}

/** The server's RetryInfo delay ("retryDelay":"46s") in ms, if the error carries one. */
export function retryDelayMs(error: unknown): number | undefined {
  const m = ((error as { message?: string } | undefined)?.message ?? '').match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return m ? Math.ceil(Number(m[1]) * 1000) : undefined;
}

type GenerateContent = (params: Parameters<GoogleGenAI['models']['generateContent']>[0]) => Promise<{ text?: string }>;

export interface GeminiCallOptions {
  maxRetries?: number;
  /** Receives key-slot status lines, e.g. "Gemini key-1 rate-limited; switching to key-2". */
  log?: (line: string) => void;
  /**
   * Runs right before every HTTP request (first attempts, retries and key
   * switches alike). The CLI counts requests here and throws to enforce its
   * request budget; a throw sends nothing.
   */
  beforeRequest?: (slotLabel: string) => void;
  /** Test seams. */
  clientFor?: (apiKey: string) => GenerateContent;
  sleep?: (ms: number) => Promise<void>;
}

/**
 * One model call over one or more keys. All calls share the active slot: a
 * rate-limit/quota error moves it to the next key and re-sends the request
 * there at once (the rejected request was not processed). Any other error is
 * handled as before: 5xx retries on the same key with backoff, everything else
 * is thrown. Once every key has rate-limited a request, it backs off on the
 * active key like the single-key client did, waiting at least the server's
 * RetryInfo delay.
 *
 * A per-day quota error is never retried on the same key: that key is marked
 * exhausted for the rest of the run, and once every key is exhausted each
 * further call fails at once without a request.
 */
export function createGeminiCall(
  keys: string | ApiKeySlot[],
  model: string,
  {
    maxRetries = 3,
    log = () => {},
    beforeRequest = () => {},
    clientFor,
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  }: GeminiCallOptions = {},
): ModelCall {
  const slots = typeof keys === 'string' ? [{ label: 'key-default', apiKey: keys }] : keys;
  if (!slots.length) throw new GeminiUnavailableError('createGeminiCall needs at least one API key.');
  const clients = slots.map(({ apiKey }) => {
    if (clientFor) return clientFor(apiKey);
    const ai = new GoogleGenAI({ apiKey });
    return (params: Parameters<GenerateContent>[0]) => ai.models.generateContent(params);
  });
  const redact = (text: string) => slots.reduce((t, s) => t.split(s.apiKey).join(`<${s.label}>`), text);
  let active = 0;
  const exhausted = new Set<number>();

  return async (request) => {
    const limited = new Set<number>(exhausted);
    for (let attempt = 0; ; ) {
      if (exhausted.size === slots.length) {
        throw new GeminiUnavailableError(`${request.label}: daily quota exhausted on every key; no request sent`);
      }
      // Another concurrent call may already have moved `active` past a key this request found limited.
      const slot = limited.has(active) ? (nextSlot(active, limited, slots.length) ?? active) : active;
      beforeRequest(slots[slot].label);
      try {
        const response = await clients[slot]({
          model,
          contents: [{ role: 'user', parts: request.parts }],
          config: {
            systemInstruction: request.system,
            responseMimeType: 'application/json',
            responseJsonSchema: request.responseJsonSchema,
            temperature: request.temperature ?? 0.2,
          },
        });
        const text = response.text;
        if (!text) throw new Error(`${request.label}: empty response from ${model}`);
        return text;
      } catch (error) {
        if (error instanceof Error) error.message = redact(error.message);
        const daily = isDailyQuotaError(error);
        if (daily && !exhausted.has(slot)) {
          exhausted.add(slot);
          log(`Gemini ${slots[slot].label} hit its daily quota; not used again this run`);
        }
        if (isRateLimitError(error)) {
          limited.add(slot);
          const next = nextSlot(slot, limited, slots.length);
          if (next !== undefined) {
            if (active === slot) {
              active = next;
              log(`Gemini ${slots[slot].label} rate-limited; switching to ${slots[next].label}`);
            }
            continue;
          }
        }
        const status = (error as { status?: number }).status;
        const transient = (isRateLimitError(error) && !daily) || (status !== undefined && status >= 500);
        if (!transient || attempt >= maxRetries) throw error;
        await sleep(Math.max(1000 * 2 ** attempt++, retryDelayMs(error) ?? 0));
      }
    }
  };
}

/** The first slot after `from` (wrapping) that is not in `skip`. */
function nextSlot(from: number, skip: Set<number>, count: number): number | undefined {
  for (let i = 1; i < count; i++) {
    const s = (from + i) % count;
    if (!skip.has(s)) return s;
  }
  return undefined;
}

export async function listModels(apiKey: string): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey });
  const names: string[] = [];
  const pager = await ai.models.list();
  for await (const m of pager) {
    if (m.supportedActions?.includes('generateContent') && m.name) names.push(m.name.replace(/^models\//, ''));
  }
  return names.sort();
}

/**
 * Zod → JSON Schema, reduced to the keywords Gemini's structured output
 * accepts. Zod still validates the full constraints (lengths, ranges) after.
 */
export function toGeminiSchema(schema: z.ZodType): object {
  const KEEP = new Set([
    'type',
    'properties',
    'required',
    'items',
    'enum',
    'minimum',
    'maximum',
    'description',
    'anyOf',
    'additionalProperties',
    'minItems',
    'maxItems',
  ]);
  const clean = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(clean);
    if (!node || typeof node !== 'object') return node;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node)) {
      if (!KEEP.has(k)) continue;
      if (k === 'properties' && v && typeof v === 'object') {
        out[k] = Object.fromEntries(Object.entries(v).map(([p, s]) => [p, clean(s)]));
      } else {
        out[k] = clean(v);
      }
    }
    return out;
  };
  return clean(z.toJSONSchema(schema, { io: 'input' })) as object;
}
