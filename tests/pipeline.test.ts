import { describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { AGREEMENT_RUNS, PromptAResponseSchema } from '@/lib/creative-dna/schema';
import { contextFromArtworks, validateCreativeDna } from '@/lib/creative-dna/validate';
import { callValidated, estimateRequests, parseModelJson, relationshipId, runPipeline } from '@/lib/gemini/generate';
import { artwork, elementsResponse, fakeImage, mockGemini } from './fixtures/gemini';

const approvedEdges = (id: string) => artwork(id).motifs.reduce((n, m) => n + m.connections.length, 0);

describe('Gemini response parsing', () => {
  it('parses plain JSON and fenced JSON', () => {
    expect(parseModelJson('{"a":1}')).toEqual({ a: 1 });
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('reports invalid JSON readably', () => {
    expect(() => parseModelJson('Sure! Here is the JSON: {')).toThrow(/not valid JSON/);
  });

  it('retries once with the validation errors fed back, then succeeds', async () => {
    const good = JSON.stringify(elementsResponse(artwork('great-wave')));
    const call = mockGemini({ override: (_r, attempt) => (attempt === 1 ? '{"elements": [{"id": 3}]}' : good) });
    const out = await callValidated(call, { label: 'A great-wave', system: 's', parts: [{ text: 't' }] }, PromptAResponseSchema);
    expect(out.elements).toHaveLength(4);
    expect(call.calls).toHaveLength(2);
    const retry = call.calls[1].parts.at(-1) as { text: string };
    expect(retry.text).toMatch(/did not match the schema/);
  });

  it('gives up after two invalid responses', async () => {
    const call = mockGemini({ override: () => 'not json' });
    await expect(
      callValidated(call, { label: 'A great-wave', system: 's', parts: [] }, PromptAResponseSchema),
    ).rejects.toThrow(/A great-wave: invalid output after 2 attempts/);
  });
});

describe('runPipeline', () => {
  it('produces a valid CreativeDNA for every artwork, with one relationship per approved edge', async () => {
    const call = mockGemini();
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, loadImage: fakeImage });

    expect(result.failures).toEqual([]);
    expect(result.accepted.map((d) => d.artwork.id).sort()).toEqual(curatedArtworks.map((a) => a.id).sort());
    const ctx = contextFromArtworks(curatedArtworks);
    for (const doc of result.accepted) {
      expect(validateCreativeDna(doc, ctx).errors).toEqual([]);
      expect(doc.relationships).toHaveLength(approvedEdges(doc.artwork.id));
      expect(doc.generation?.model).toBe('mock');
      expect(Object.keys(doc.generation!.prompt_versions).sort()).toEqual(['A', 'B', 'C', 'D', 'H']);
    }
  });

  it('runs Prompt C only for the selected relationships, and the estimate matches the calls made', async () => {
    for (const relationships of [[], ['lit-face:water-pitcher/pitcher-and-basin']]) {
      const call = mockGemini();
      const opts = { collection: curatedArtworks, only: ['self-portrait'], relationships };
      const result = await runPipeline({ ...opts, call, model: 'mock', loadImage: fakeImage });
      expect(result.failures).toEqual([]);
      expect(result.accepted[0].relationships.map((r) => relationshipId(r.source_element_id!, { targetArtworkId: r.target_artwork_id, targetMotifId: r.target_element_id! }))).toEqual(relationships);
      const estimate = estimateRequests(opts);
      expect(estimate.min).toBe(3 + relationships.length * AGREEMENT_RUNS);
      expect(call.calls.length).toBeGreaterThanOrEqual(estimate.min);
      expect(call.calls.length).toBeLessThanOrEqual(estimate.max);
    }
  });

  it('estimates the full collection without calling anything', () => {
    const e = estimateRequests({ collection: curatedArtworks });
    expect(e.relationships).toHaveLength(20);
    expect(e.min).toBe(5 * 3 + 20 * AGREEMENT_RUNS);
  });

  it('sends each prompt the artwork image(s) and only Met-record metadata', async () => {
    const call = mockGemini();
    await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    const a = call.calls.find((c) => c.label === 'A great-wave')!;
    expect(a.parts[0]).toHaveProperty('inlineData');
    const text = (a.parts.at(-1) as { text: string }).text;
    expect(text).toContain('Rogers Fund, 1914');
    expect(text).toContain('id "the-boats"');
    // Curated interpretation text is never shown to the model.
    expect(text).not.toContain('rowers bent forward');
    const c = call.calls.find((x) => x.label.startsWith('C great-wave/the-boats'))!;
    expect(c.parts.filter((p) => 'inlineData' in p)).toHaveLength(2);
    expect(call.calls.map((x) => x.label[0])).toEqual(expect.arrayContaining(['A', 'B', 'C', 'D']));
  });

  it('keeps curated text when Gemini says a relationship is not supported', async () => {
    const call = mockGemini({
      override: (r) =>
        r.label.startsWith('C great-wave/mount-fuji')
          ? JSON.stringify({ supported: false, explanation: 'x', evidence: 'x', caveat: 'x', confidence: 0.1 })
          : undefined,
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    const doc = result.accepted[0];
    expect(doc.relationships.some((r) => r.source_element_id === 'mount-fuji')).toBe(false);
    expect(result.notes['great-wave'].join()).toMatch(/could not see this relationship/);
  });

  it('applies Prompt D: errors remove items, unsupported provenance is downgraded', async () => {
    const call = mockGemini({
      override: (r) =>
        r.label === 'D great-wave'
          ? JSON.stringify({
              issues: [
                { path: 'elements[1]', kind: 'invented_fact', severity: 'error', message: 'adds a date' },
                { path: 'techniques[0]', kind: 'unsupported_verified', severity: 'error', message: 'not in record' },
                { path: 'relationships[0]', kind: 'overconfident', severity: 'error', message: 'too sure' },
                { path: 'elements[0]', kind: 'missing_field', severity: 'warning', message: 'short' },
              ],
            })
          : r.label === 'H great-wave'
            ? JSON.stringify({
                rewrites: [
                  {
                    ref: 'relationships[the-boats>gulf-stream/sailor-and-boat].explanation',
                    action: 'reject',
                    text: '',
                    reason: 'no cautious version',
                  },
                ],
              })
            : undefined,
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    const doc = result.accepted[0];
    expect(doc.elements.map((e) => e.id)).not.toContain('wave-crest');
    expect(doc.techniques[0].source_type).toBe('ai_inferred');
    expect(doc.relationships.some((r) => r.source_element_id === 'the-boats')).toBe(false);
    expect(doc.generation!.notes.join('\n')).toMatch(/Prompt D warning elements\[0\]/);
  });

  it('records an API failure for one artwork and still accepts the others', async () => {
    const call = mockGemini({
      override: (r) => {
        if (r.label === 'A gulf-stream') throw Object.assign(new Error('quota exceeded'), { status: 400 });
        return undefined;
      },
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, loadImage: fakeImage });
    expect(result.failures).toEqual([{ artworkId: 'gulf-stream', stage: 'api', message: 'quota exceeded' }]);
    expect(result.accepted).toHaveLength(4);
  });

  it('rejects the whole document when the tradition is flagged as invented', async () => {
    const call = mockGemini({
      override: (r) =>
        r.label === 'D self-portrait'
          ? JSON.stringify({ issues: [{ path: 'tradition', kind: 'invented_fact', severity: 'error', message: 'made up' }] })
          : undefined,
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['self-portrait'], loadImage: fakeImage });
    expect(result.accepted).toEqual([]);
    expect(result.failures[0]).toMatchObject({ artworkId: 'self-portrait', stage: 'D' });
  });
});
