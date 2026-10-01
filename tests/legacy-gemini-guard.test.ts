import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { googleConstructor, fetchMock } = vi.hoisted(() => ({
  googleConstructor: vi.fn(),
  fetchMock: vi.fn(),
}));
vi.mock('@google/genai', () => ({ GoogleGenAI: googleConstructor }));

import { createGeminiCall, DEFAULT_MODEL, GeminiUnavailableError, LEGACY_GENERATION_DISABLED_MESSAGE, listModels } from '@/lib/gemini/client';
import { REQUIRED_GEMINI_MODEL } from '@/lib/gemini/routing-client';

beforeEach(() => {
  googleConstructor.mockReset();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('GEMINI_API_KEY', 'rk_test_only');
  vi.stubEnv('GEMINI_BASE_URL', '');
  vi.stubEnv('GEMINI_MODEL', '');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('legacy Google transport is disabled', () => {
  it('shares the only authorized default model', () => {
    expect(DEFAULT_MODEL).toBe(REQUIRED_GEMINI_MODEL);
    expect(DEFAULT_MODEL).toBe('gemini-3.8-flash');
  });

  it.each([
    { apiKey: 'rk_test_only', baseUrl: '', model: REQUIRED_GEMINI_MODEL },
    { apiKey: 'rk_test_only', baseUrl: 'https://api.routing.run/v1', model: REQUIRED_GEMINI_MODEL },
    { apiKey: 'test-key', baseUrl: 'https://api.routing.run/v1', model: REQUIRED_GEMINI_MODEL },
    { apiKey: 'test-key', baseUrl: 'https://api.routing.run/v1/', model: 'gemini-2.5-flash' },
    { apiKey: 'test-key', baseUrl: '', model: 'gemini-2.5-flash' },
    { apiKey: 'test-key', baseUrl: '', model: REQUIRED_GEMINI_MODEL },
    { apiKey: 'test-key', baseUrl: 'https://generativelanguage.googleapis.com/v1', model: REQUIRED_GEMINI_MODEL },
  ])('rejects generation and listing before any SDK or fetch call (%j)', async ({ apiKey, baseUrl, model }) => {
    vi.stubEnv('GEMINI_BASE_URL', baseUrl);
    vi.stubEnv('GEMINI_MODEL', model);
    const beforeRequest = vi.fn();
    expect(() => createGeminiCall(apiKey, model, { beforeRequest })).toThrow(LEGACY_GENERATION_DISABLED_MESSAGE);
    await expect(listModels(apiKey)).rejects.toThrow(LEGACY_GENERATION_DISABLED_MESSAGE);
    expect(beforeRequest).not.toHaveBeenCalled();
    expect(googleConstructor).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('cannot rotate onto a Routing.run key through a later legacy slot', () => {
    expect(() => createGeminiCall([
      { label: 'first', apiKey: 'test-key' },
      { label: 'second', apiKey: 'rk_test_only' },
    ], REQUIRED_GEMINI_MODEL)).toThrow(GeminiUnavailableError);
    expect(googleConstructor).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('retains explicit injected clients for offline tests with arbitrary mock model names', async () => {
    vi.stubEnv('GEMINI_BASE_URL', 'https://api.routing.run/v1');
    const generateContent = vi.fn().mockResolvedValue({ text: '{"offline":true}' });
    const clientFor = vi.fn(() => generateContent);
    const call = createGeminiCall('test-key', 'offline-mock-model', { clientFor });
    await expect(call({ label: 'offline', system: 'Return JSON.', parts: [{ text: 'Test.' }], responseJsonSchema: {} })).resolves.toBe('{"offline":true}');
    expect(generateContent).toHaveBeenCalledOnce();
    expect(googleConstructor).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('legacy CLI safety', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const blockIo = `
    globalThis.fetch = () => { throw new Error('Unexpected network request'); };
    process.loadEnvFile = () => { throw new Error('Unexpected environment file access'); };
  `;

  function runCli(args: string[]) {
    return spawnSync(process.execPath, [
      '--import', 'tsx',
      '--import', `data:text/javascript,${encodeURIComponent(blockIo)}`,
      'scripts/generate-artscape.ts', ...args,
    ], {
      cwd: root,
      encoding: 'utf8',
      timeout: 10_000,
      env: {
        PATH: process.env.PATH,
        ...(process.env.LD_LIBRARY_PATH ? { LD_LIBRARY_PATH: process.env.LD_LIBRARY_PATH } : {}),
        NODE_ENV: 'test',
        GEMINI_API_KEY: 'rk_test_only',
        GEMINI_BASE_URL: 'https://api.routing.run/v1',
        GEMINI_MODEL: REQUIRED_GEMINI_MODEL,
      },
    });
  }

  it.each([
    { args: [] },
    { args: ['--dry-run'] },
    { args: ['--list-models'] },
    { args: ['--model=gemini-2.5-flash', '--overwrite'] },
    { args: ['--estimate', '--list-models'] },
  ])('fails closed with actionable guidance for %j', ({ args }) => {
    const result = runCli(args);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(LEGACY_GENERATION_DISABLED_MESSAGE);
    expect(result.stdout).not.toContain('rk_test_only');
    expect(result.stderr).not.toContain('rk_test_only');
    expect(result.stderr).not.toContain('Unexpected');
  });

  it('keeps estimates available without loading environment files or calling a model', () => {
    const result = runCli(['--estimate', '--only=great-wave', '--relationships=none', '--overwrite']);
    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Gemini requests for 1 artwork(s)');
    expect(result.stdout).toContain('great-wave');
    expect(result.stderr).not.toContain('Unexpected');
    expect(result.stdout).not.toContain('rk_test_only');
  });
});
