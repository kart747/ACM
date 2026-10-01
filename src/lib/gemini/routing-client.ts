import { z } from 'zod';

export const REQUIRED_GEMINI_MODEL = 'gemini-3.8-flash';
const ROUTING_BASE_URL = 'https://api.routing.run/v1';
const REQUEST_TIMEOUT_MS = 45_000;

type GeminiRequestErrorCode = 'not_configured' | 'configuration_error' | 'request_failed' | 'invalid_response';

const errorMessages: Record<GeminiRequestErrorCode, string> = {
  not_configured: 'GEMINI_API_KEY is not configured.',
  configuration_error: 'Gemini requires gemini-3.8-flash at https://api.routing.run/v1; alternate models and providers are not authorized.',
  request_failed: 'The Routing.run request failed or was cancelled.',
  invalid_response: 'Routing.run returned an invalid JSON response or a model other than gemini-3.8-flash.',
};

export class GeminiRequestError extends Error {
  constructor(public readonly code: GeminiRequestErrorCode, public readonly attemptedCalls: 0 | 1) {
    super(errorMessages[code]);
    this.name = 'GeminiRequestError';
  }
}

function getConfiguration(): { apiKey: string; baseUrl: string } {
  if (typeof window !== 'undefined') throw new GeminiRequestError('configuration_error', 0);

  const model = process.env.GEMINI_MODEL?.trim();
  const baseUrl = process.env.GEMINI_BASE_URL?.trim() || ROUTING_BASE_URL;
  if ((model && model !== REQUIRED_GEMINI_MODEL) || ![ROUTING_BASE_URL, `${ROUTING_BASE_URL}/`].includes(baseUrl)) {
    throw new GeminiRequestError('configuration_error', 0);
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey.startsWith('your-gemini')) throw new GeminiRequestError('not_configured', 0);
  return { apiKey, baseUrl: ROUTING_BASE_URL };
}

export function isGeminiConfigured(): boolean {
  try {
    getConfiguration();
    return true;
  } catch {
    return false;
  }
}

export interface GeminiJsonRequest {
  system?: string;
  prompt: string;
  imageDataUrl?: string;
  signal?: AbortSignal;
}

const completionSchema = z.object({
  model: z.literal(REQUIRED_GEMINI_MODEL),
  choices: z.array(z.object({
    finish_reason: z.literal('stop'),
    message: z.object({
      role: z.literal('assistant'),
      content: z.string().trim().min(1),
      refusal: z.string().nullable().optional(),
      tool_calls: z.array(z.unknown()).max(0).optional(),
    }),
  })).length(1),
});

export async function requestGeminiJson({ system, prompt, imageDataUrl, signal }: GeminiJsonRequest): Promise<unknown> {
  const { apiKey, baseUrl } = getConfiguration();
  if (typeof prompt !== 'string' || !prompt.trim() || (system !== undefined && typeof system !== 'string')) {
    throw new GeminiRequestError('request_failed', 0);
  }
  if (imageDataUrl !== undefined && !/^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(imageDataUrl)) {
    throw new GeminiRequestError('request_failed', 0);
  }
  if (signal?.aborted) throw new GeminiRequestError('request_failed', 0);

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timeout = setTimeout(abort, REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      // Redirects must never forward the provider key to another endpoint.
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({
        model: REQUIRED_GEMINI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          ...(system ? [{ role: 'system', content: system }] : []),
          {
            role: 'user',
            content: imageDataUrl ? [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ] : prompt,
          },
        ],
      }),
    });
    if (!response.ok) throw new GeminiRequestError('request_failed', 1);

    let envelope: unknown;
    try {
      envelope = await response.json();
    } catch {
      throw new GeminiRequestError('invalid_response', 1);
    }
    const completion = completionSchema.safeParse(envelope);
    if (!completion.success || completion.data.choices[0].message.refusal) {
      throw new GeminiRequestError('invalid_response', 1);
    }

    let content: unknown;
    try {
      content = JSON.parse(completion.data.choices[0].message.content);
    } catch {
      throw new GeminiRequestError('invalid_response', 1);
    }
    if (!content || typeof content !== 'object' || Array.isArray(content)) {
      throw new GeminiRequestError('invalid_response', 1);
    }
    if (controller.signal.aborted) throw new GeminiRequestError('request_failed', 1);
    return content;
  } catch (error) {
    if (!controller.signal.aborted && error instanceof GeminiRequestError) throw error;
    // Never expose provider bodies, fetch errors, prompts, or abort reasons.
    throw new GeminiRequestError('request_failed', 1);
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
}
