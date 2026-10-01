import { describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { AGREEMENT_RUNS, type CreativeDnaRelationship } from '@/lib/creative-dna/schema';
import { applyCreativeDna } from '@/lib/creative-dna/merge';
import { contextFromArtworks, validateCreativeDna } from '@/lib/creative-dna/validate';
import { AGREEMENT_TEMPERATURE, formatAgreement, scoreAgreement, type RunOutcome } from '@/lib/gemini/agreement';
import { runAgreement, runPipeline } from '@/lib/gemini/generate';
import type { ModelRequest } from '@/lib/gemini/client';
import { fakeImage, fixtureDna, mockGemini, parseLabel, relationshipResponse } from './fixtures/gemini';

const ctx = contextFromArtworks(curatedArtworks);

/** The Hokusai boats → Homer sailor edge: the first hop of the demo journey. */
const EDGE = 'C great-wave/the-boats → gulf-stream/sailor-and-boat';
const onEdge = (r: ModelRequest) => r.label.startsWith(EDGE);
const runOf = (r: ModelRequest) => parseLabel(r.label).run!;
const supported = relationshipResponse('the-boats', 'sailor-and-boat');
const unsupported = { ...supported, supported: false, confidence: 0.2 };
const ok = (supported: boolean): RunOutcome => ({ ok: true, response: { ...relationshipResponse('a', 'b'), supported } });
const failed: RunOutcome = { ok: false, error: 'boom' };

async function runGreatWave(override: (r: ModelRequest) => string | undefined) {
  const call = mockGemini({ override: (r) => (onEdge(r) ? override(r) : undefined) });
  const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
  const rel = result.accepted[0]?.relationships.find(
    (r) => r.source_element_id === 'the-boats' && r.target_element_id === 'sailor-and-boat',
  );
  return { call, result, rel, notes: result.notes['great-wave'].join('\n') };
}

describe('scoreAgreement', () => {
  it('5/5: every run supports the relationship', () => {
    const r = scoreAgreement(Array(5).fill(ok(true)));
    expect(r.agreement).toEqual({ runs: 5, agreeing: 5, failed: 0 });
    expect(r.accepted).toBe(true);
    expect(formatAgreement(r.agreement)).toBe('5/5 runs agree');
  });

  it('4/5: one run disagrees', () => {
    const r = scoreAgreement([ok(true), ok(false), ok(true), ok(true), ok(true)]);
    expect(r.agreement).toEqual({ runs: 5, agreeing: 4, failed: 0 });
    expect(r.accepted).toBe(true);
  });

  it('3/5 is the smallest accepted majority; 2/5 is disagreement', () => {
    expect(scoreAgreement([ok(true), ok(true), ok(true), ok(false), ok(false)]).accepted).toBe(true);
    const r = scoreAgreement([ok(true), ok(true), ok(false), ok(false), ok(false)]);
    expect(r.agreement.agreeing).toBe(2);
    expect(r.accepted).toBe(false);
    expect(r.representative).toBeUndefined();
  });

  it('failed runs count against agreement: the denominator is always the runs attempted', () => {
    const r = scoreAgreement([ok(true), failed, ok(true), failed, ok(true)]);
    expect(r.agreement).toEqual({ runs: 5, agreeing: 3, failed: 2 });
    expect(r.accepted).toBe(true);
    expect(formatAgreement(r.agreement)).toBe('3/5 runs agree, 2 failed');
    expect(scoreAgreement([ok(true), ok(true), failed, failed, failed]).accepted).toBe(false);
  });

  it('never accepts from fewer runs than required', () => {
    expect(scoreAgreement([ok(true), ok(true), ok(true)]).accepted).toBe(false);
  });

  it('stores the first agreeing run as the representative text', () => {
    const first = { ...relationshipResponse('a', 'b'), explanation: 'FIXTURE second run text.' };
    const r = scoreAgreement([ok(false), { ok: true, response: first }, ok(true), ok(true), ok(true)]);
    expect(r.representative?.explanation).toBe('FIXTURE second run text.');
  });

  it('does not use the self-reported confidence to decide agreement', () => {
    const low = { ok: true as const, response: { ...relationshipResponse('a', 'b'), confidence: 0.01 } };
    const r = scoreAgreement([low, low, low, low, low]);
    expect(r.agreement.agreeing).toBe(5);
    expect(r.representative?.confidence).toBe(0.01);
  });
});

describe('runAgreement: independent runs', () => {
  it('sends the identical request five times, with no run seeing another', async () => {
    const call = mockGemini();
    const parts = [{ inlineData: { mimeType: 'image/jpeg', data: 'A' } }, { text: 'the prompt' }];
    const r = await runAgreement(call, { label: EDGE, system: 'sys', parts });
    expect(r.agreement).toEqual({ runs: AGREEMENT_RUNS, agreeing: 5, failed: 0 });
    expect(call.calls).toHaveLength(AGREEMENT_RUNS);
    expect(call.calls.map(runOf).sort()).toEqual([1, 2, 3, 4, 5]);
    for (const c of call.calls) {
      expect(c.parts).toEqual(parts);
      expect(c.system).toBe('sys');
      expect(c.temperature).toBe(AGREEMENT_TEMPERATURE);
    }
  });
});

describe('runPipeline with multi-run agreement', () => {
  it('5/5: stores the agreement with the relationship', async () => {
    const { call, rel, result } = await runGreatWave(() => undefined);
    expect(rel?.agreement).toEqual({ runs: 5, agreeing: 5, failed: 0 });
    expect(call.calls.filter(onEdge)).toHaveLength(5);
    // Every stored relationship carries an agreement and passes validation.
    for (const r of result.accepted[0].relationships) expect(r.agreement?.runs).toBe(5);
    expect(validateCreativeDna(result.accepted[0], ctx).errors).toEqual([]);
  });

  it('4/5: one dissenting run is recorded, the relationship is kept', async () => {
    const { rel } = await runGreatWave((r) => (runOf(r) === 2 ? JSON.stringify(unsupported) : undefined));
    expect(rel?.agreement).toEqual({ runs: 5, agreeing: 4, failed: 0 });
    expect(rel?.explanation).toBe(supported.explanation);
  });

  it('disagreement: without a majority the curated relationship is kept', async () => {
    const { rel, result, notes } = await runGreatWave((r) => (runOf(r) <= 3 ? JSON.stringify(unsupported) : undefined));
    expect(rel).toBeUndefined();
    expect(result.accepted).toHaveLength(1);
    expect(notes).toMatch(/could not see this relationship consistently \(2\/5 runs agree\); curated text kept/);
    const { artworks } = applyCreativeDna(curatedArtworks, result.accepted);
    const boats = artworks[0].motifs.find((m) => m.id === 'the-boats')!;
    const c = boats.connections.find((x) => x.targetMotifId === 'sailor-and-boat')!;
    expect(c.claim.origin).toBe('curated');
    expect(c.claim.agreement).toBeUndefined();
  });

  it('failed run: an API error counts as a failed run, not a retry', async () => {
    const { call, rel, notes } = await runGreatWave((r) => {
      if (runOf(r) === 4) throw Object.assign(new Error('503 unavailable'), { status: 503 });
      return undefined;
    });
    expect(rel?.agreement).toEqual({ runs: 5, agreeing: 4, failed: 1 });
    expect(call.calls.filter(onEdge)).toHaveLength(5);
    expect(notes).toMatch(/failed run — 503 unavailable/);
  });

  it('invalid response: unparseable or off-schema output is a failed run, with no feedback retry', async () => {
    const { call, rel, notes } = await runGreatWave((r) =>
      runOf(r) === 1 ? 'Sure! {' : runOf(r) === 5 ? JSON.stringify({ ...supported, confidence: 7 }) : undefined,
    );
    expect(rel?.agreement).toEqual({ runs: 5, agreeing: 3, failed: 2 });
    const edgeCalls = call.calls.filter(onEdge);
    expect(edgeCalls).toHaveLength(5);
    // No run was sent another response, or its own error, as feedback.
    for (const c of edgeCalls) expect(c.parts.map((p) => ('text' in p ? p.text : '')).join()).not.toMatch(/previous response/);
    expect(notes).toMatch(/not valid JSON/);
    expect(notes).toMatch(/confidence/);
  });

  it('every run failing falls back to curated text and still accepts the artwork', async () => {
    const { rel, result, notes } = await runGreatWave(() => 'not json');
    expect(rel).toBeUndefined();
    expect(result.failures).toEqual([]);
    expect(notes).toMatch(/0\/5 runs agree, 5 failed/);
  });
});

describe('validation of stored agreement', () => {
  const withAgreement = (agreement: unknown) => {
    const doc = fixtureDna('great-wave');
    (doc.relationships[0] as { agreement?: unknown }).agreement = agreement;
    return doc;
  };

  it('accepts 5/5, 4/5 and 3/5', () => {
    for (const agreeing of [5, 4, 3]) {
      const r = validateCreativeDna(withAgreement({ runs: 5, agreeing, failed: 5 - agreeing }), ctx);
      expect(r.errors, `${agreeing}/5`).toEqual([]);
    }
  });

  it('rejects the document for structurally malformed agreement', () => {
    for (const bad of [
      { runs: 5, agreeing: 6, failed: 0 },
      { runs: 5, agreeing: 4, failed: 2 },
      { runs: 5, agreeing: 4.5, failed: 0 },
      { runs: 5, agreeing: -1, failed: 0 },
      { runs: 0, agreeing: 0, failed: 0 },
      { runs: 5, agreeing: 4 },
      '4/5',
      0.8,
    ]) {
      const r = validateCreativeDna(withAgreement(bad), ctx);
      expect(r.ok, JSON.stringify(bad)).toBe(false);
      expect(r.errors.join(), JSON.stringify(bad)).toMatch(/relationships\.0\.agreement/);
    }
  });

  it('drops a relationship with no agreement, the wrong run count, or no majority', () => {
    const cases: [unknown, RegExp][] = [
      [undefined, /missing multi-run agreement/],
      [{ runs: 3, agreeing: 3, failed: 0 }, /agreement from 3 runs \(expected 5\)/],
      [{ runs: 7, agreeing: 7, failed: 0 }, /agreement from 7 runs/],
      [{ runs: 5, agreeing: 2, failed: 0 }, /only 2\/5 runs agree \(need 3\)/],
    ];
    for (const [agreement, message] of cases) {
      const doc = withAgreement(agreement);
      if (agreement === undefined) delete (doc.relationships[0] as Partial<CreativeDnaRelationship>).agreement;
      const r = validateCreativeDna(doc, ctx);
      expect(r.ok).toBe(true);
      expect(r.errors.join('\n')).toMatch(message);
      expect(r.dna!.relationships).toHaveLength(doc.relationships.length - 1);
    }
  });
});

describe('fallback and display of agreement in the app data', () => {
  it('carries measured agreement next to, not instead of, the self-reported confidence', () => {
    const doc = withRun(fixtureDna('great-wave'), { runs: 5, agreeing: 4, failed: 1 });
    const { artworks } = applyCreativeDna(curatedArtworks, [doc]);
    const claim = artworks[0].motifs.find((m) => m.id === 'the-boats')!.connections[0].claim;
    expect(claim).toMatchObject({ origin: 'gemini', agreement: { agreeing: 4, runs: 5 }, confidence: 0.72 });
  });

  it('a relationship with malformed-but-parseable agreement falls back to curated text', () => {
    const doc = withRun(fixtureDna('great-wave'), { runs: 5, agreeing: 1, failed: 0 });
    const { artworks } = applyCreativeDna(curatedArtworks, [doc]);
    expect(artworks[0].dataSource).toBe('gemini');
    const c = artworks[0].motifs.find((m) => m.id === 'the-boats')!.connections[0];
    expect(c.claim.text).toBe(curatedArtworks[0].motifs[0].connections[0].claim.text);
    expect(c.claim.origin).toBe('curated');
  });

  it('a document with structurally malformed agreement falls back entirely', () => {
    const doc = withRun(fixtureDna('great-wave'), { runs: 5, agreeing: 9, failed: 0 });
    const { artworks, report } = applyCreativeDna(curatedArtworks, [doc]);
    expect(artworks[0].dataSource).toBe('curated');
    expect(report[0].errors.join()).toMatch(/agreement/);
  });

  function withRun(doc: ReturnType<typeof fixtureDna>, agreement: CreativeDnaRelationship['agreement']) {
    const rel = doc.relationships.find((r) => r.source_element_id === 'the-boats')!;
    rel.agreement = agreement;
    return doc;
  }
});
