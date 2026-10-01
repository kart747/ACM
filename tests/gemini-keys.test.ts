import { describe, expect, it } from 'vitest';
import { createGeminiCall, GeminiUnavailableError, isRateLimitError, readGeminiConfig, type ModelRequest } from '@/lib/gemini/client';
import { runAgreement } from '@/lib/gemini/generate';
import { AGREEMENT_RUNS } from '@/lib/creative-dna/schema';
import { relationshipResponse } from './fixtures/gemini';

const REQUEST: ModelRequest = { label: 'test', system: 's', parts: [{ text: 'hi' }], responseJsonSchema: {} };
const SLOTS = [
  { label: 'key-1', apiKey: 'secret-one' },
  { label: 'key-2', apiKey: 'secret-two' },
  { label: 'key-3', apiKey: 'secret-three' },
];

const apiError = (status: number, message = `HTTP ${status}`) => Object.assign(new Error(message), { status });

/**
 * A fake per-key client. `behaviour(apiKey, n)` returns the response text or throws;
 * `n` counts calls to that key. Every call is recorded as the key used.
 */
function fakeClients(behaviour: (apiKey: string, n: number) => string) {
  const calls: string[] = [];
  const clientFor = (apiKey: string) => async () => {
    calls.push(apiKey);
    return { text: behaviour(apiKey, calls.filter((k) => k === apiKey).length) };
  };
  return { calls, clientFor };
}

function setup(behaviour: (apiKey: string, n: number) => string, slots = SLOTS) {
  const fake = fakeClients(behaviour);
  const logs: string[] = [];
  const sleeps: number[] = [];
  const call = createGeminiCall(slots, 'mock', {
    clientFor: fake.clientFor,
    log: (l) => logs.push(l),
    sleep: async (ms) => void sleeps.push(ms),
  });
  return { call, calls: fake.calls, logs, sleeps };
}

describe('readGeminiConfig', () => {
  it('keeps single-key GEMINI_API_KEY working', () => {
    const config = readGeminiConfig({ GEMINI_API_KEY: 'solo' });
    expect(config.apiKey).toBe('solo');
    expect(config.keys).toEqual([{ label: 'key-default', apiKey: 'solo' }]);
    expect(config.model).toBe('gemini-3.8-flash');
  });

  it('orders numbered keys numerically, then the plain key, skipping blanks, placeholders and duplicates', () => {
    const config = readGeminiConfig({
      GEMINI_API_KEY_10: 'k10',
      GEMINI_API_KEY_2: 'k2',
      GEMINI_API_KEY_1: 'k1',
      GEMINI_API_KEY_3: '  ',
      GEMINI_API_KEY_4: 'your-gemini-api-key',
      GEMINI_API_KEY: 'k1',
      GEMINI_MODEL: 'm',
    });
    expect(config.keys.map((k) => k.label)).toEqual(['key-1', 'key-2', 'key-10']);
    expect(config.apiKey).toBe('k1');
    expect(config.model).toBe('m');
  });

  it('reports a missing key without echoing any value', () => {
    expect(() => readGeminiConfig({ GEMINI_API_KEY: 'your-gemini-api-key' })).toThrow(GeminiUnavailableError);
  });
});

describe('isRateLimitError', () => {
  it('is true only for 429 / RESOURCE_EXHAUSTED', () => {
    expect(isRateLimitError(apiError(429))).toBe(true);
    expect(isRateLimitError(new Error('{"error":{"status":"RESOURCE_EXHAUSTED"}}'))).toBe(true);
    expect(isRateLimitError(apiError(400))).toBe(false);
    expect(isRateLimitError(apiError(503))).toBe(false);
    expect(isRateLimitError(new Error('response is not valid JSON'))).toBe(false);
  });
});

describe('createGeminiCall key rotation', () => {
  it('uses the first key and makes exactly one request when it succeeds', async () => {
    const { call, calls, logs } = setup(() => 'ok');
    expect(await call(REQUEST)).toBe('ok');
    expect(calls).toEqual(['secret-one']);
    expect(logs).toEqual([]);
  });

  it('moves to the next key on a rate limit, without backoff, and stays there', async () => {
    const { call, calls, logs, sleeps } = setup((k) => {
      if (k === 'secret-one') throw apiError(429);
      return 'ok';
    });
    expect(await call(REQUEST)).toBe('ok');
    expect(await call(REQUEST)).toBe('ok');
    expect(calls).toEqual(['secret-one', 'secret-two', 'secret-two']);
    expect(sleeps).toEqual([]);
    expect(logs).toEqual(['Gemini key-1 rate-limited; switching to key-2']);
  });

  it('does not switch keys on a bad request', async () => {
    const { call, calls } = setup(() => {
      throw apiError(400, 'invalid argument');
    });
    await expect(call(REQUEST)).rejects.toThrow('invalid argument');
    expect(calls).toEqual(['secret-one']);
  });

  it('does not switch keys on an empty response (not an API quota error)', async () => {
    const { call, calls } = setup(() => '');
    await expect(call(REQUEST)).rejects.toThrow('empty response');
    expect(calls).toEqual(['secret-one']);
  });

  it('retries 5xx on the same key with backoff', async () => {
    const { call, calls, sleeps } = setup((_, n) => {
      if (n === 1) throw apiError(503);
      return 'ok';
    });
    expect(await call(REQUEST)).toBe('ok');
    expect(calls).toEqual(['secret-one', 'secret-one']);
    expect(sleeps).toEqual([1000]);
  });

  it('tries each key once, then backs off on the active key when all are limited', async () => {
    const { call, calls, sleeps } = setup(() => {
      throw apiError(429);
    });
    await expect(call(REQUEST)).rejects.toThrow('HTTP 429');
    // 3 keys, then maxRetries (3) backoff retries on the last active key.
    expect(calls).toEqual(['secret-one', 'secret-two', 'secret-three', 'secret-three', 'secret-three', 'secret-three']);
    expect(sleeps).toEqual([1000, 2000, 4000]);
  });

  it('never retries a daily-quota 429 and sends nothing once every key is exhausted', async () => {
    const daily = () =>
      apiError(429, '{"quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","retryDelay":"46s"}');
    const { call, calls, sleeps, logs } = setup(() => {
      throw daily();
    });
    await expect(call(REQUEST)).rejects.toThrow('PerDay');
    expect(calls).toEqual(['secret-one', 'secret-two', 'secret-three']);
    expect(sleeps).toEqual([]);
    await expect(call(REQUEST)).rejects.toThrow('no request sent');
    expect(calls).toHaveLength(3);
    expect(logs).toContain('Gemini key-1 hit its daily quota; not used again this run');
  });

  it('waits at least the server retry delay before a rate-limit retry', async () => {
    const { call, sleeps } = setup((_, n) => {
      if (n === 1) throw apiError(429, '{"retryDelay":"12.5s"}');
      return 'ok';
    }, SLOTS.slice(0, 1));
    expect(await call(REQUEST)).toBe('ok');
    expect(sleeps).toEqual([12500]);
  });

  it('calls beforeRequest per HTTP request, and a throw there sends nothing', async () => {
    const fake = fakeClients(() => 'ok');
    const seen: string[] = [];
    const call = createGeminiCall(SLOTS, 'mock', {
      clientFor: fake.clientFor,
      beforeRequest: (slot) => {
        if (seen.length >= 1) throw new Error('budget reached');
        seen.push(slot);
      },
    });
    expect(await call(REQUEST)).toBe('ok');
    await expect(call(REQUEST)).rejects.toThrow('budget reached');
    expect(seen).toEqual(['key-1']);
    expect(fake.calls).toHaveLength(1);
  });

  it('wraps around to earlier keys', async () => {
    const { call, calls } = setup((k, n) => {
      if (k === 'secret-three' || (k === 'secret-one' && n === 1)) throw apiError(429);
      if (k === 'secret-two' && n === 1) return 'ok';
      if (k === 'secret-two') throw apiError(429);
      return 'ok';
    });
    expect(await call(REQUEST)).toBe('ok'); // key-1 limited → key-2
    expect(await call(REQUEST)).toBe('ok'); // key-2 limited → key-3 limited → key-1
    expect(calls).toEqual(['secret-one', 'secret-two', 'secret-two', 'secret-three', 'secret-one']);
  });

  it('never puts a key in an error message', async () => {
    const { call } = setup(() => {
      throw apiError(403, 'API key secret-one is not valid');
    });
    const error = await call(REQUEST).catch((e: Error) => e);
    expect((error as Error).message).toBe('API key <key-1> is not valid');
  });

  it('accepts a single key string, as before', async () => {
    const fake = fakeClients(() => 'ok');
    const call = createGeminiCall('solo', 'mock', { clientFor: fake.clientFor });
    expect(await call(REQUEST)).toBe('ok');
    expect(fake.calls).toEqual(['solo']);
  });
});

describe('agreement runs with key rotation', () => {
  it(`still makes ${AGREEMENT_RUNS} scored runs; concurrent 429s rotate once, not once per run`, async () => {
    const body = JSON.stringify(relationshipResponse('a', 'b'));
    const { call, calls, logs } = setup((k) => {
      if (k === 'secret-one') throw apiError(429);
      return body;
    });
    const result = await runAgreement(call, { label: 'C test', system: 's', parts: [{ text: 'x' }] });
    expect(result.agreement).toEqual({ runs: AGREEMENT_RUNS, agreeing: AGREEMENT_RUNS, failed: 0 });
    expect(calls.filter((k) => k === 'secret-two')).toHaveLength(AGREEMENT_RUNS);
    expect(calls.filter((k) => k === 'secret-three')).toHaveLength(0);
    expect(logs).toEqual(['Gemini key-1 rate-limited; switching to key-2']);
  });
});
