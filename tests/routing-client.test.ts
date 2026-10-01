import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GeminiRequestError, isGeminiConfigured, REQUIRED_GEMINI_MODEL, requestGeminiJson } from '@/lib/gemini/routing-client';
import { GET as getHealth } from '@/app/api/health/route';

const fetchMock = vi.fn();

function envelope(content = '{"assessment":"Supplied catalog text only."}', model: string = REQUIRED_GEMINI_MODEL) {
  return {
    model,
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content } }],
  };
}

function respond(body: unknown = envelope()) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));
}

async function requestError(request: Promise<unknown>): Promise<GeminiRequestError> {
  try {
    await request;
  } catch (error) {
    expect(error).toBeInstanceOf(GeminiRequestError);
    if (error instanceof GeminiRequestError) return error;
    throw error;
  }
  throw new Error('Expected the request to fail.');
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GEMINI_API_KEY', 'test-routing-key');
  vi.stubEnv('GEMINI_MODEL', '');
  vi.stubEnv('GEMINI_BASE_URL', '');
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Routing.run configuration', () => {
  it('uses only the exact authorized model and provider by default', () => {
    expect(REQUIRED_GEMINI_MODEL).toBe('gemini-3.8-flash');
    expect(isGeminiConfigured()).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['', '   ', 'your-gemini-api-key-here'])('does not accept a missing or placeholder key (%s)', async apiKey => {
    vi.stubEnv('GEMINI_API_KEY', apiKey);
    vi.stubEnv('GEMINI_API_KEY_1', 'unused-numbered-test-key');
    expect(isGeminiConfigured()).toBe(false);
    await expect(requestGeminiJson({ prompt: 'Return JSON.' })).rejects.toMatchObject({ code: 'not_configured', attemptedCalls: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['gemini-2.5-flash', 'gemini-3.8-pro', 'google/gemini-3.8-flash', 'GEMINI-3.8-FLASH'])('rejects the configured model %s', async model => {
    vi.stubEnv('GEMINI_MODEL', model);
    expect(isGeminiConfigured()).toBe(false);
    await expect(requestGeminiJson({ prompt: 'Return JSON.' })).rejects.toMatchObject({ code: 'configuration_error', attemptedCalls: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    'https://generativelanguage.googleapis.com/v1',
    'https://api.routing.run.evil.example/v1',
    'http://api.routing.run/v1',
    'https://api.routing.run:444/v1',
    'https://user:password@api.routing.run/v1',
    'https://api.routing.run/v1?key=test-routing-key',
    'https://api.routing.run/v1#fragment',
    'https://api.routing.run/v2',
    'https://api.routing.run/v1/../other',
    'not-a-url',
  ])('rejects an unauthorized base URL %s', async baseUrl => {
    vi.stubEnv('GEMINI_BASE_URL', baseUrl);
    expect(isGeminiConfigured()).toBe(false);
    const error = await requestError(requestGeminiJson({ prompt: 'Return JSON.' }));
    expect(error).toMatchObject({ code: 'configuration_error', attemptedCalls: 0 });
    expect(error.message).not.toContain('test-routing-key');
    expect(error.message).not.toContain('password');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['https://api.routing.run/v1', 'https://api.routing.run/v1/'])('accepts the exact provider base URL %s', async baseUrl => {
    vi.stubEnv('GEMINI_BASE_URL', baseUrl);
    vi.stubEnv('GEMINI_MODEL', REQUIRED_GEMINI_MODEL);
    respond();
    await requestGeminiJson({ prompt: 'Return JSON.' });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.routing.run/v1/chat/completions');
  });
});

describe('Routing.run JSON transport', () => {
  it('sends one native fetch request with JSON mode and returns parsed content', async () => {
    respond();
    await expect(requestGeminiJson({ system: 'Assess cautiously. Return JSON.', prompt: 'Catalog text.' })).resolves.toEqual({ assessment: 'Supplied catalog text only.' });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('https://api.routing.run/v1/chat/completions', expect.objectContaining({
      method: 'POST',
      redirect: 'error',
      cache: 'no-store',
      headers: { Authorization: 'Bearer test-routing-key', 'Content-Type': 'application/json' },
      signal: expect.any(AbortSignal),
    }));
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      model: REQUIRED_GEMINI_MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Assess cautiously. Return JSON.' },
        { role: 'user', content: 'Catalog text.' },
      ],
    });
  });

  it('supports text and image_url data URL message parts', async () => {
    respond();
    const imageDataUrl = 'data:image/png;base64,aGVsbG8=';
    await requestGeminiJson({ prompt: 'Describe this image as JSON.', imageDataUrl });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).messages).toEqual([{
      role: 'user',
      content: [{ type: 'text', text: 'Describe this image as JSON.' }, { type: 'image_url', image_url: { url: imageDataUrl } }],
    }]);
  });

  it.each(['https://example.com/image.png', 'data:text/plain;base64,aGVsbG8=', 'data:image/png;base64,', ''])('rejects non-image data URLs before sending (%s)', async imageDataUrl => {
    await expect(requestGeminiJson({ prompt: 'Return JSON.', imageDataUrl })).rejects.toMatchObject({ attemptedCalls: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects blank prompts without sending a request', async () => {
    await expect(requestGeminiJson({ prompt: '  ' })).rejects.toMatchObject({ attemptedCalls: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([undefined, 'gemini-2.5-flash', 'google/gemini-3.8-flash', 'gemini-3.8-flash-2026-10'])('rejects a missing or non-exact response model (%s)', async model => {
    respond({ ...envelope(), model });
    await expect(requestGeminiJson({ prompt: 'Return JSON.' })).rejects.toMatchObject({ code: 'invalid_response', attemptedCalls: 1 });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it.each(['', 'not JSON', '```json\n{}\n```', 'null', '[]', '"text"', 'true', '1'])('rejects invalid or non-object JSON content (%s)', async content => {
    respond(envelope(content));
    await expect(requestGeminiJson({ prompt: 'Return JSON.' })).rejects.toMatchObject({ code: 'invalid_response', attemptedCalls: 1 });
  });

  it.each([
    { model: REQUIRED_GEMINI_MODEL, choices: [] },
    { ...envelope(), choices: [...envelope().choices, ...envelope().choices] },
    { ...envelope(), choices: [{ finish_reason: 'length', message: { role: 'assistant', content: '{}' } }] },
    { ...envelope(), choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: '{}', refusal: 'Cannot comply.' } }] },
    { ...envelope(), choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: null } }] },
    { ...envelope(), choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: '{}', tool_calls: [{}] } }] },
  ])('rejects incomplete, refused, or invalid completions (%j)', async body => {
    respond(body);
    await expect(requestGeminiJson({ prompt: 'Return JSON.' })).rejects.toMatchObject({ code: 'invalid_response', attemptedCalls: 1 });
  });

  it('rejects malformed envelope JSON without exposing its contents', async () => {
    fetchMock.mockResolvedValue(new Response('test-routing-key private provider body'));
    const error = await requestError(requestGeminiJson({ prompt: 'Return JSON.' }));
    expect(error).toBeInstanceOf(GeminiRequestError);
    expect(error.code).toBe('invalid_response');
    expect(error.message).not.toContain('test-routing-key');
  });

  it.each([302, 401, 429, 500])('redacts HTTP %s errors without retrying or reading provider errors', async status => {
    const json = vi.fn();
    fetchMock.mockResolvedValue({ ok: false, status, json });
    const error = await requestError(requestGeminiJson({ prompt: 'private prompt' }));
    expect(error).toMatchObject({ code: 'request_failed', attemptedCalls: 1 });
    expect(error.message).not.toContain('test-routing-key');
    expect(error.message).not.toContain('private prompt');
    expect(json).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('redacts raw network errors and their causes', async () => {
    fetchMock.mockRejectedValue(new Error('test-routing-key private prompt', { cause: 'private provider body' }));
    const error = await requestError(requestGeminiJson({ prompt: 'private prompt' }));
    expect(error).toMatchObject({ code: 'request_failed', attemptedCalls: 1 });
    expect(error.message).not.toContain('test-routing-key');
    expect(error.message).not.toContain('private prompt');
    expect(error.cause).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('does not send an already cancelled request', async () => {
    const controller = new AbortController();
    controller.abort('private abort reason');
    await expect(requestGeminiJson({ prompt: 'Return JSON.', signal: controller.signal })).rejects.toMatchObject({ code: 'request_failed', attemptedCalls: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards caller cancellation and removes its listener', async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, 'removeEventListener');
    fetchMock.mockImplementation((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('test-routing-key')), { once: true });
    }));
    const result = requestError(requestGeminiJson({ prompt: 'Return JSON.', signal: controller.signal }));
    controller.abort('private abort reason');
    const error = await result;
    expect(error).toMatchObject({ code: 'request_failed', attemptedCalls: 1 });
    expect(error.message).not.toContain('private abort reason');
    expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
  });

  it('aborts after 45 seconds without retries and clears its timer', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation((_url, { signal }: RequestInit) => new Promise((_resolve, reject) => {
      signal?.addEventListener('abort', () => reject(new Error('test-routing-key')), { once: true });
    }));
    const result = requestError(requestGeminiJson({ prompt: 'Return JSON.' }));
    await vi.advanceTimersByTimeAsync(44_999);
    expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toMatchObject({ code: 'request_failed', attemptedCalls: 1 });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the timeout after success', async () => {
    vi.useFakeTimers();
    respond();
    await requestGeminiJson({ prompt: 'Return JSON.' });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('Routing.run health metadata', () => {
  it('reports the authorized model and availability without making a provider call', async () => {
    const response = await getHealth();
    expect(await response.json()).toMatchObject({ gemini: {
      configured: true,
      model: REQUIRED_GEMINI_MODEL,
      provider: 'https://api.routing.run/v1',
      mode: 'live_available',
    } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not advertise an unauthorized configured model as live', async () => {
    vi.stubEnv('GEMINI_MODEL', 'gemini-2.5-flash');
    const response = await getHealth();
    expect(await response.json()).toMatchObject({ gemini: { configured: false, model: REQUIRED_GEMINI_MODEL, mode: 'curated_fallback' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
