import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { cacheKey, withCache } from '@/lib/gemini/cache';
import { createGeminiCall, type ModelCall, type ModelRequest } from '@/lib/gemini/client';
import { runAgreement, runPipeline } from '@/lib/gemini/generate';
import { AGREEMENT_RUNS } from '@/lib/creative-dna/schema';
import { fakeImage, mockGemini, relationshipResponse } from './fixtures/gemini';

const REQUEST: ModelRequest = {
  label: 'A test',
  system: 'system',
  parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'AAAA' } }, { text: 'prompt' }],
  responseJsonSchema: { type: 'object' },
  temperature: 0.2,
};

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), 'artscape-cache-'));
});
afterEach(() => rm(dir, { recursive: true, force: true }));

const counting = (respond: (r: ModelRequest) => string = () => 'response-text') => {
  const seen: ModelRequest[] = [];
  const call: ModelCall = async (r) => {
    seen.push(r);
    return respond(r);
  };
  return { call, seen };
};

describe('cacheKey', () => {
  it('is stable for identical requests and changes with every input', () => {
    const base = cacheKey('m', REQUEST);
    expect(cacheKey('m', structuredClone(REQUEST))).toBe(base);
    const variants: [string, string][] = [
      ['model', cacheKey('m2', REQUEST)],
      ['system', cacheKey('m', { ...REQUEST, system: 'other' })],
      ['text part', cacheKey('m', { ...REQUEST, parts: [REQUEST.parts[0], { text: 'other' }] })],
      ['image', cacheKey('m', { ...REQUEST, parts: [{ inlineData: { mimeType: 'image/jpeg', data: 'BBBB' } }, REQUEST.parts[1]] })],
      ['schema', cacheKey('m', { ...REQUEST, responseJsonSchema: { type: 'array' } })],
      ['temperature', cacheKey('m', { ...REQUEST, temperature: 1 })],
      ['label', cacheKey('m', { ...REQUEST, label: 'B test' })],
    ];
    for (const [, key] of variants) expect(key).not.toBe(base);
    expect(new Set(variants.map(([, k]) => k)).size).toBe(variants.length);
  });
});

describe('withCache', () => {
  it('serves an identical request from the cache without calling Gemini', async () => {
    const { call, seen } = counting();
    const cached = withCache(call, 'm', dir);
    expect(await cached.call(REQUEST)).toBe('response-text');
    expect(await cached.call(REQUEST)).toBe('response-text');
    expect(seen).toHaveLength(1);
    expect(cached.stats).toEqual({ hits: 1, misses: 1 });

    // A fresh wrapper (a later run) reads the same files.
    const later = withCache(counting().call, 'm', dir);
    expect(await later.call(REQUEST)).toBe('response-text');
    expect(later.stats).toEqual({ hits: 1, misses: 0 });
  });

  it('calls Gemini again when any input changes', async () => {
    const { call, seen } = counting();
    const cached = withCache(call, 'm', dir);
    await cached.call(REQUEST);
    await cached.call({ ...REQUEST, system: 'other' });
    await cached.call({ ...REQUEST, temperature: 1 });
    expect(seen).toHaveLength(3);
    expect(cached.stats).toEqual({ hits: 0, misses: 3 });
  });

  it('never caches a failed call', async () => {
    let fail = true;
    const { call, seen } = counting(() => {
      if (fail) throw new Error('HTTP 503');
      return 'ok';
    });
    const cached = withCache(call, 'm', dir);
    await expect(cached.call(REQUEST)).rejects.toThrow('HTTP 503');
    expect(await readdir(dir).catch(() => [])).toEqual([]);
    fail = false;
    expect(await cached.call(REQUEST)).toBe('ok');
    expect(seen).toHaveLength(2);
  });

  it('treats a corrupt entry as a miss and overwrites it', async () => {
    const { call, seen } = counting();
    const cached = withCache(call, 'm', dir);
    await cached.call(REQUEST);
    const [file] = await readdir(dir);
    const { writeFile } = await import('node:fs/promises');
    await writeFile(path.join(dir, file), '{not json');
    expect(await cached.call(REQUEST)).toBe('response-text');
    expect(seen).toHaveLength(2);
  });

  it('keeps agreement runs independent', async () => {
    const body = JSON.stringify(relationshipResponse('a', 'b'));
    const { call, seen } = counting(() => body);
    const cached = withCache(call, 'm', dir);
    const request = { label: 'C test', system: 's', parts: [{ text: 'x' }] };

    await runAgreement(cached.call, request);
    expect(seen).toHaveLength(AGREEMENT_RUNS);
    expect(await readdir(dir)).toHaveLength(AGREEMENT_RUNS);
    expect(cached.stats).toEqual({ hits: 0, misses: AGREEMENT_RUNS });

    await runAgreement(cached.call, request);
    expect(seen).toHaveLength(AGREEMENT_RUNS);
    expect(cached.stats).toEqual({ hits: AGREEMENT_RUNS, misses: AGREEMENT_RUNS });

    // One run's entry is never reused for another run.
    const labels = seen.map((r) => r.label);
    expect(new Set(labels).size).toBe(AGREEMENT_RUNS);
  });

  it('never writes an API key into the cache, even when errors mention it', async () => {
    const secret = 'AIza-super-secret-key';
    const clientFor = (apiKey: string) => async () => {
      if (apiKey === secret) throw Object.assign(new Error(`bad key ${apiKey}`), { status: 400 });
      return { text: 'ok' };
    };
    const slots = [
      { label: 'key-1', apiKey: secret },
      { label: 'key-2', apiKey: 'AIza-second-secret' },
    ];
    const cached = withCache(createGeminiCall(slots, 'm', { clientFor }), 'm', dir);
    await expect(cached.call(REQUEST)).rejects.toThrow('<key-1>');
    expect(await readdir(dir).catch(() => [])).toEqual([]);

    const ok = withCache(createGeminiCall([slots[1], slots[0]], 'm', { clientFor }), 'm', dir);
    expect(await ok.call(REQUEST)).toBe('ok');
    for (const f of await readdir(dir)) {
      const text = await readFile(path.join(dir, f), 'utf8');
      expect(text).not.toContain(secret);
      expect(text).not.toContain('AIza-second-secret');
    }
  });
});

describe('cache in the pipeline', () => {
  const opts = { model: 'mock', collection: curatedArtworks, only: ['self-portrait'], relationships: [], loadImage: fakeImage };

  it('leaves generation unchanged when the cache is empty', async () => {
    const plain = mockGemini();
    const expected = await runPipeline({ ...opts, call: plain, now: () => new Date(0) });

    const inner = mockGemini();
    const cached = withCache(inner, 'mock', dir);
    const actual = await runPipeline({ ...opts, call: cached.call, now: () => new Date(0) });

    expect(actual).toEqual(expected);
    expect(inner.calls.map((c) => c.label)).toEqual(plain.calls.map((c) => c.label));
    expect(cached.stats.hits).toBe(0);
  });

  it('a second identical run makes no model calls', async () => {
    const first = withCache(mockGemini(), 'mock', dir);
    const a = await runPipeline({ ...opts, call: first.call, now: () => new Date(0) });

    const inner = mockGemini();
    const second = withCache(inner, 'mock', dir);
    const b = await runPipeline({ ...opts, call: second.call, now: () => new Date(0) });

    expect(inner.calls).toHaveLength(0);
    expect(second.stats.misses).toBe(0);
    expect(second.stats.hits).toBe(first.stats.misses);
    expect(b).toEqual(a);
  });
});
