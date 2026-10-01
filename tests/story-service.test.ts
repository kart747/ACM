import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V2_ARTWORKS, V2_ELEMENTS } from '@/data/artworks-v2';
import { prepareStory } from '@/lib/story/prepared';

const transport = vi.hoisted(() => ({ request: vi.fn(), configured: vi.fn() }));
vi.mock('@/lib/gemini/routing-client', () => ({
  requestGeminiJson: transport.request,
  isGeminiConfigured: transport.configured,
  REQUIRED_GEMINI_MODEL: 'gemini-3.8-flash',
}));
import { createStoryRuntime, createStoryService, STORY_PROMPT_VERSION } from '@/lib/story/service';

let cacheDir: string;
let timestamp: number;
let runtime: ReturnType<typeof createStoryRuntime>;
let service: ReturnType<typeof createStoryService>;
function output(id = 'art_001') {
  const artwork = V2_ARTWORKS.find(item => item.id === id)!;
  const story = prepareStory(artwork, V2_ELEMENTS[id]);
  story.intro = 'Follow the visible details.';
  story.beats.forEach(beat => { beat.explanation = 'Look at the outlines and nearby areas of color.'; });
  return story;
}

beforeEach(async () => {
  vi.stubEnv('GEMINI_MODEL', '');
  vi.stubEnv('GEMINI_BASE_URL', '');
  cacheDir = await mkdtemp(path.join(os.tmpdir(), 'artscape-story-'));
  timestamp = Date.parse('2026-10-01T00:00:00.000Z');
  runtime = createStoryRuntime();
  service = createStoryService({ cacheDir, now: () => timestamp, runtime });
  transport.configured.mockReset().mockReturnValue(true);
  transport.request.mockReset().mockResolvedValue(output());
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(cacheDir, { recursive: true, force: true });
});

describe('story service', () => {
  it('GET remains offline and POST without configuration gives an honest prepared result', async () => {
    for (const artwork of V2_ARTWORKS) {
      const result = await service.get(artwork.id);
      expect(result).toMatchObject({ artworkId: artwork.id, source: 'prepared', model: null });
      expect(result?.reason).toBeUndefined();
    }
    transport.configured.mockReturnValue(false);
    for (const artwork of V2_ARTWORKS) {
      expect(await service.generate(artwork.id)).toMatchObject({ artworkId: artwork.id, source: 'prepared', model: null, reason: 'not_configured' });
    }
    expect(transport.request).not.toHaveBeenCalled();
    expect(await service.get('../unknown')).toBeNull();
  });

  it('distinguishes incompatible configuration without attempting generation', async () => {
    transport.configured.mockReturnValue(false);
    vi.stubEnv('GEMINI_BASE_URL', 'https://unapproved.example/v1');
    expect(await service.generate('art_001')).toMatchObject({ source: 'prepared', reason: 'configuration_error', model: null });
    expect(transport.request).not.toHaveBeenCalled();
  });

  it('sends the exact local image, catalog and curated regions, then reuses validated disk cache', async () => {
    const first = await service.generate('art_001');
    expect(first).toMatchObject({ source: 'gemini', model: 'gemini-3.8-flash', generatedAt: new Date(timestamp).toISOString() });
    const request = transport.request.mock.calls[0][0];
    const bytes = await readFile(path.join(process.cwd(), 'public', V2_ARTWORKS[0].image));
    expect(request.imageDataUrl).toBe(`data:image/jpeg;base64,${bytes.toString('base64')}`);
    const expectedKey = createHash('sha256').update(JSON.stringify({
      artwork: V2_ARTWORKS[0], elements: V2_ELEMENTS.art_001,
      promptVersion: STORY_PROMPT_VERSION, model: 'gemini-3.8-flash',
    })).update(bytes).digest('hex');
    expect(await readdir(cacheDir)).toEqual([`${expectedKey}.json`]);
    expect(request.prompt).toContain(V2_ARTWORKS[0].sourceUrl);
    expect(request.prompt).toContain(V2_ELEMENTS.art_001[0].id);
    expect(request.prompt).toContain('geometry');
    const restarted = createStoryService({ cacheDir, runtime: createStoryRuntime() });
    expect(await restarted.get('art_001')).toMatchObject({ source: 'cache', story: first?.story });
    expect(await restarted.generate('art_001')).toMatchObject({ source: 'cache' });
    expect(transport.request).toHaveBeenCalledOnce();
  });

  it('uses an existing classic museum image for a newly added artwork', async () => {
    const artwork = V2_ARTWORKS.find(item => item.id === 'art_006')!;
    transport.request.mockResolvedValue(output(artwork.id));
    expect(await service.generate(artwork.id)).toMatchObject({ source: 'gemini', artworkId: artwork.id });
    const bytes = await readFile(path.join(process.cwd(), 'public', artwork.image.replace(/^\//, '')));
    expect(transport.request.mock.calls[0][0].imageDataUrl).toBe(`data:image/jpeg;base64,${bytes.toString('base64')}`);
    expect(await service.get(artwork.id)).toMatchObject({ source: 'cache', artworkId: artwork.id });
  });

  it.each(['../.env.local', 'https://example.com/image.jpg', '/artworks/../../.env.local'])('rejects a corpus path outside the artwork directories: %s', async image => {
    const original = V2_ARTWORKS[0].image;
    try {
      V2_ARTWORKS[0].image = image;
      expect(await service.generate('art_001')).toMatchObject({ source: 'prepared', reason: 'configuration_error' });
      expect(transport.request).not.toHaveBeenCalled();
    } finally {
      V2_ARTWORKS[0].image = original;
    }
  });

  it('revalidates cached provenance, evidence, model, and malformed JSON before use', async () => {
    await service.generate('art_001');
    const file = path.join(cacheDir, (await readdir(cacheDir))[0]);
    const original = JSON.parse(await readFile(file, 'utf8'));
    const invalidValues = [
      { ...original, story: { ...original.story, beats: original.story.beats.map((beat: object) => ({ ...beat, source_type: 'externally_verified' })) } },
      { ...original, key: '0'.repeat(64) },
      { ...original, model: null },
      { ...original, story: { ...original.story, intro: 'The artist declared this is divine.' } },
    ];
    for (const invalid of invalidValues) {
      await writeFile(file, JSON.stringify(invalid));
      expect(await service.get('art_001')).toMatchObject({ source: 'prepared', model: null });
    }
    await writeFile(file, '{broken');
    expect(await service.get('art_001')).toMatchObject({ source: 'prepared' });
    await writeFile(file, ' '.repeat(65 * 1024));
    expect(await service.get('art_001')).toMatchObject({ source: 'prepared' });
    expect(transport.request).toHaveBeenCalledOnce();
  });

  it('hashes catalog metadata and curated regions into the cache identity', async () => {
    await service.generate('art_001');
    const original = V2_ARTWORKS[0].year;
    const coordinate = V2_ELEMENTS.art_001[0].geometry.points[0][0];
    try {
      V2_ARTWORKS[0].year = `${original} revised`;
      expect(await service.get('art_001')).toMatchObject({ source: 'prepared' });
      V2_ARTWORKS[0].year = original;
      V2_ELEMENTS.art_001[0].geometry.points[0][0] = coordinate + 0.001;
      expect(await service.get('art_001')).toMatchObject({ source: 'prepared' });
    } finally {
      V2_ARTWORKS[0].year = original;
      V2_ELEMENTS.art_001[0].geometry.points[0][0] = coordinate;
    }
    expect(await service.get('art_001')).toMatchObject({ source: 'cache' });
  });

  it('coalesces concurrent requests for the same artwork', async () => {
    let release!: (value: unknown) => void;
    transport.request.mockImplementation(() => new Promise(resolve => { release = resolve; }));
    const requests = Array.from({ length: 8 }, () => service.generate('art_001'));
    await vi.waitFor(() => expect(transport.request).toHaveBeenCalledOnce());
    release(output());
    const results = await Promise.all(requests);
    expect(results.every(result => result?.source === 'gemini' || result?.source === 'cache')).toBe(true);
    expect(transport.request).toHaveBeenCalledOnce();
  });

  it('rejects invalid generation and applies a per-artwork 60-second failure cooldown', async () => {
    transport.request.mockResolvedValue({ wrong: 'shape' });
    expect(await service.generate('art_001')).toMatchObject({ source: 'prepared', reason: 'invalid_response', model: null });
    expect(await service.generate('art_001')).toMatchObject({ reason: 'invalid_response' });
    expect(transport.request).toHaveBeenCalledOnce();
    timestamp += 60_001;
    transport.request.mockResolvedValue(output());
    expect(await service.generate('art_001')).toMatchObject({ source: 'gemini' });
    expect(transport.request).toHaveBeenCalledTimes(2);
  });

  it('enforces a shared six-attempt rolling minute without charging cache reads', async () => {
    runtime.attempts = Array.from({ length: 6 }, () => timestamp - 1);
    expect(await service.generate('art_001')).toMatchObject({ source: 'prepared', reason: 'rate_limited' });
    expect(transport.request).not.toHaveBeenCalled();
    timestamp += 60_001;
    expect(await service.generate('art_001')).toMatchObject({ source: 'gemini' });
    runtime.attempts = Array.from({ length: 6 }, () => timestamp);
    expect(await service.generate('art_001')).toMatchObject({ source: 'cache' });
    expect(transport.request).toHaveBeenCalledOnce();
  });

  it.each([
    [{ code: 'configuration_error', message: 'private prompt' }, 'configuration_error'],
    [{ code: 'invalid_response', message: 'private response' }, 'invalid_response'],
    [{ status: 429, message: 'private provider error' }, 'rate_limited'],
    [new Error('private provider error'), 'generation_failed'],
  ])('returns safe fallback reasons without provider details', async (error, reason) => {
    transport.request.mockRejectedValue(error);
    const result = await service.generate('art_001');
    expect(result).toMatchObject({ source: 'prepared', reason, model: null });
    expect(JSON.stringify(result)).not.toContain('private');
    expect(await readdir(cacheDir)).toEqual([]);
  });
});
