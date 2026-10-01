import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ModelCall, ModelRequest } from './client';

/**
 * Node-only, build-time response cache for the generation CLI. Wraps a
 * ModelCall: a request whose inputs were answered before is served from
 * `<dir>/<hash>.json` without an HTTP request, so a multi-day free-tier run
 * does not repeat finished work. Only successful raw responses are stored;
 * errors are never cached. The app never imports this module.
 */
if (typeof window !== 'undefined') {
  throw new Error('src/lib/gemini/cache.ts must not be bundled into the browser.');
}

export interface CacheStats {
  hits: number;
  misses: number;
}

/**
 * Hash of everything that can change the response: model, system prompt, parts
 * (text and base64 image data), response schema, temperature, and the label,
 * which carries the agreement run id ("(run 2/5)") so runs never share an entry.
 * API keys are not part of a request and are never hashed or stored.
 */
export function cacheKey(model: string, request: ModelRequest): string {
  const canonical = JSON.stringify({
    model,
    label: request.label,
    system: request.system,
    parts: request.parts,
    schema: request.responseJsonSchema,
    temperature: request.temperature ?? null,
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export function withCache(call: ModelCall, model: string, dir: string, stats: CacheStats = { hits: 0, misses: 0 }) {
  const cached: ModelCall = async (request) => {
    const file = path.join(dir, `${cacheKey(model, request)}.json`);
    try {
      const entry = JSON.parse(await readFile(file, 'utf8')) as { response?: unknown };
      if (typeof entry.response === 'string' && entry.response) {
        stats.hits++;
        return entry.response;
      }
    } catch {
      // Missing or unreadable entry: treated as a miss.
    }
    stats.misses++;
    const response = await call(request);
    await mkdir(dir, { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(tmp, `${JSON.stringify({ model, label: request.label, cachedAt: new Date().toISOString(), response })}\n`);
    await rename(tmp, file);
    return response;
  };
  return { call: cached, stats };
}
