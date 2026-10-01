import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { analyzeArtworkWithGemini, verifyRelationshipWithGemini } from '@/lib/gemini/server-service';
import { REQUIRED_GEMINI_MODEL } from '@/lib/gemini/routing-client';

const fetchMock = vi.fn();

function completion(content: unknown, model: string = REQUIRED_GEMINI_MODEL) {
  return new Response(JSON.stringify({
    model,
    choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: JSON.stringify(content) } }],
  }));
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GEMINI_API_KEY', 'test-key');
  vi.stubEnv('GEMINI_MODEL', '');
  vi.stubEnv('GEMINI_BASE_URL', '');
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('V2 text-only assessments', () => {
  it('reports a single assessment without promoting it to historical verification', async () => {
    fetchMock.mockResolvedValue(completion({ supported: true, explanation: 'The supplied text describes similar details.', confidence: 0 }));
    const result = await verifyRelationshipWithGemini('rel_001');
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ model: REQUIRED_GEMINI_MODEL, verificationRuns: 1, attemptedCalls: 1, status: 'candidate', agreement: '', inputMode: 'text_only', assessment: { confidence: 0 } });
    expect(result?.consensusScore).toBeUndefined();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe(REQUIRED_GEMINI_MODEL);
    expect(typeof body.messages[0].content).toBe('string');
    expect(body.messages[0].content).toContain('No images are provided');
  });

  it('rejects truthy strings instead of treating them as supported', async () => {
    fetchMock.mockResolvedValue(completion({ supported: 'false', explanation: 'Unsupported.' }));
    expect(await verifyRelationshipWithGemini('rel_001')).toMatchObject({ verificationRuns: 0, attemptedCalls: 1, assessmentStatus: 'curated_fallback', fallbackReason: 'invalid_response' });
  });

  it('does not claim successful verification after a failed request', async () => {
    fetchMock.mockRejectedValue(new Error('network failure containing test-key'));
    const result = await verifyRelationshipWithGemini('rel_001');
    expect(result).toMatchObject({ verificationRuns: 0, attemptedCalls: 1, status: 'candidate', agreement: '', fallbackReason: 'request_failed' });
    expect(JSON.stringify(result)).not.toContain('test-key');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('makes no model call without a key', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('GEMINI_API_KEY_1', 'unused-test-key');
    expect(await verifyRelationshipWithGemini('rel_001')).toMatchObject({ verificationRuns: 0, attemptedCalls: 0, assessmentStatus: 'curated_fallback', fallbackReason: 'not_configured' });
    expect(await analyzeArtworkWithGemini('art_001')).toMatchObject({ assessmentRuns: 0, attemptedCalls: 0, fallbackReason: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('allows text insights without fabricating a confidence score', async () => {
    fetchMock.mockResolvedValue(completion({ traditionContext: 'A description of the supplied record.' }));
    const result = await analyzeArtworkWithGemini('art_001');
    expect(result).toMatchObject({ status: 'complete', assessmentRuns: 1, attemptedCalls: 1, inputMode: 'text_only', model: REQUIRED_GEMINI_MODEL });
    expect(result.aiInsights?.confidence).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('falls back to the correct artwork when analysis JSON is malformed', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      model: REQUIRED_GEMINI_MODEL,
      choices: [{ finish_reason: 'stop', message: { role: 'assistant', content: '{invalid' } }],
    })));
    const result = await analyzeArtworkWithGemini('art_003');
    expect(result).toMatchObject({ status: 'curated_fallback', assessmentRuns: 0, attemptedCalls: 1, fallbackReason: 'invalid_response', artwork: { id: 'art_003' } });
    expect(result.aiInsights).toBeUndefined();
  });

  it('rejects alternate configured models without substituting or making requests', async () => {
    vi.stubEnv('GEMINI_MODEL', 'gemini-2.5-flash');
    expect(await analyzeArtworkWithGemini('art_001')).toMatchObject({ model: REQUIRED_GEMINI_MODEL, assessmentRuns: 0, attemptedCalls: 0, fallbackReason: 'configuration_error' });
    expect(await verifyRelationshipWithGemini('rel_001')).toMatchObject({ model: REQUIRED_GEMINI_MODEL, verificationRuns: 0, attemptedCalls: 0, fallbackReason: 'configuration_error' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects alternate providers before sending a request', async () => {
    vi.stubEnv('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1');
    expect(await analyzeArtworkWithGemini('art_001')).toMatchObject({ attemptedCalls: 0, fallbackReason: 'configuration_error' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a response from an unauthorized model without retrying', async () => {
    fetchMock.mockResolvedValue(completion({ traditionContext: 'Do not use this assessment.' }, 'gemini-2.5-flash'));
    const result = await analyzeArtworkWithGemini('art_001');
    expect(result).toMatchObject({ assessmentRuns: 0, attemptedCalls: 1, fallbackReason: 'invalid_response' });
    expect(result.aiInsights).toBeUndefined();
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('makes no model call for missing records', async () => {
    expect(await analyzeArtworkWithGemini('missing')).toMatchObject({ artwork: null, attemptedCalls: 0, fallbackReason: 'record_not_found' });
    expect(await verifyRelationshipWithGemini('missing')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
