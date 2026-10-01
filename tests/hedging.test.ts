import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import type { SourceType } from '@/lib/creative-dna/schema';
import { contextFromArtworks, validateCreativeDna } from '@/lib/creative-dna/validate';
import { runPipeline } from '@/lib/gemini/generate';
import { HedgingRejection, runHedgingLinter, type HedgingRewriter } from '@/lib/hedging/document';
import { lintText, type LintField } from '@/lib/hedging/rules';
import { artwork, elementsResponse, fakeImage, fixtureDna, mockGemini } from './fixtures/gemini';

const ctx = contextFromArtworks(curatedArtworks);
const record = (...ids: string[]) => ids.map((id) => ctx.artworks.find((a) => a.id === id)!.metadataText).join(' ');

function lint(text: string, sourceType: SourceType = 'ai_inferred', field: LintField = 'meaning', recordText = record('gulf-stream')) {
  return lintText(text, { sourceType, field, recordText });
}
const categories = (text: string, sourceType?: SourceType, field?: LintField) =>
  lint(text, sourceType, field).findings.filter((f) => f.action !== 'pass').map((f) => f.category);

/* ------------------------------------------------------------------ */
/* Rule layer                                                           */
/* ------------------------------------------------------------------ */

describe('hedging rules: observation vs interpretation vs unsupported certainty', () => {
  it('passes safe factual observations and classifies them as observation', () => {
    for (const text of [
      'Both artworks contain circular forms.',
      'A long, narrow boat rides low in the trough below the wave.',
      'The sailor lies on the deck of a small boat with no standing mast.',
    ]) {
      const r = lint(text);
      expect(r.action, text).toBe('pass');
      expect(r.sentences.map((s) => s.classification), text).toEqual(['observation']);
    }
  });

  it('passes cautious interpretation and classifies it as interpretation', () => {
    for (const text of [
      'The circular forms may create a framing effect.',
      'Both pictures seem to place one small, calm shape on the far horizon.',
      'The white headcloth may symbolize domestic order.',
      'The raised wave could be read as a threat to the rowers.',
    ]) {
      const r = lint(text);
      expect(r.action, text).toBe('pass');
      expect(r.sentences[0].classification, text).toBe('interpretation');
    }
  });

  it('classifies a mixed text sentence by sentence', () => {
    const r = lint(
      'Both artworks contain circular forms. The circular forms may create a framing effect. The artist intentionally used the circle to symbolize eternity.',
    );
    expect(r.sentences.map((s) => s.classification)).toEqual(['observation', 'interpretation', 'unsupported_certainty']);
    expect(r.action).toBe('rewrite');
  });
});

describe('hedging rules: intent', () => {
  it.each([
    'The artist intended the boat to stand for America.',
    'Homer intended the sharks as a warning.',
    'This was created to warn viewers about the sea.',
    'The painting was meant to evoke loss.',
    'The artist deliberately placed the ship on the horizon.',
    'His purpose was to show human helplessness.',
  ])('asks for a rewrite: %s', (text) => {
    const r = lint(text);
    expect(r.action).toBe('rewrite');
    expect(categories(text)).toContain('intent');
  });

  it('still asks for a rewrite when intent is hedged ("may have intended" still speaks for the artist)', () => {
    expect(lint('Homer may have intended the sharks as a warning.').action).toBe('rewrite');
  });

  it('allows intent when the artist declared it', () => {
    const r = lint('I intended the peacock to represent prosperity.', 'artist_declared');
    expect(r).toMatchObject({ action: 'pass', downgraded: false, sourceType: 'artist_declared' });
  });
});

describe('hedging rules: copying and influence', () => {
  it.each(['Homer copied the wave from Hokusai.', 'Artist B copied the pose.', 'Homer may have copied this composition.', 'The pose was borrowed from David.'])(
    'rejects copying claims, hedged or not: %s',
    (text) => {
      expect(lint(text, 'ai_inferred', 'explanation').action).toBe('reject');
      expect(categories(text, 'ai_inferred', 'explanation')).toContain('copying');
    },
  );

  it('asks for a rewrite of influence claims', () => {
    expect(lint('Homer was influenced by Japanese prints.', 'ai_inferred', 'explanation').action).toBe('rewrite');
    expect(lint('The pose is modeled on the Virgin in David’s panel.', 'ai_inferred', 'explanation').action).toBe('rewrite');
  });

  it('does not accept hedged influence in a relationship, but flags hedged lineage in a tradition', () => {
    expect(lint('Homer may have been inspired by this print.', 'ai_inferred', 'explanation').action).toBe('rewrite');
    const lineage = lint('This appears to draw from Dutch genre painting.', 'ai_inferred', 'description');
    expect(lineage.action).toBe('flag');
    expect(lineage.findings[0]).toMatchObject({ category: 'influence', hedged: true });
  });

  it('passes caveats that deny copying or influence', () => {
    for (const text of [
      'Nothing here shows that Homer knew this print.',
      'This is a shared subject, not evidence that Homer copied Hokusai.',
      'The pairing does not prove that either artist was influenced by the other.',
    ]) {
      expect(lint(text, 'ai_inferred', 'caveat').action, text).toBe('pass');
    }
  });
});

describe('hedging rules: absolute certainty', () => {
  it.each([
    'This proves Homer understood the danger of the sea.',
    'The artist definitely wanted us to feel afraid.',
    'The wave clearly represents the power of nature.',
    'The shark is certainly a symbol of death.',
    'The true meaning of the scene is despair.',
    'He must have seen a waterspout himself.',
  ])('asks for a rewrite: %s', (text) => {
    const r = lint(text);
    expect(r.action).toBe('rewrite');
    expect(r.sentences[0].classification).toBe('unsupported_certainty');
  });

  it('passes "clearly" when it describes what is visible', () => {
    expect(lint('The signature is clearly visible at lower left.').action).toBe('pass');
    expect(lint('It appears to be clearly visible in the marked region.').action).toBe('pass');
  });
});

describe('hedging rules: history, causation, symbolism and unsupported fact', () => {
  it('rejects dates the record does not contain', () => {
    const r = lint('Homer painted this in 1885 after his trip to the Bahamas.');
    expect(r.action).toBe('reject');
    expect(categories('Homer painted this in 1885 after his trip to the Bahamas.')).toContain('historical');
  });

  it('accepts dates and centuries the record does contain', () => {
    expect(lint('The Met record dates the painting to 1899.').action).toBe('pass');
    expect(lint('A nineteenth-century sea picture with a single figure.').action).toBe('pass');
    expect(lint('A sixteenth-century sea picture.').action).toBe('reject');
  });

  it('asks for a rewrite of speculative history', () => {
    expect(lint('The scene may reflect what he saw during his travels in the Caribbean.').action).toBe('rewrite');
  });

  it('asks for a rewrite of unhedged causation, flags hedged causation', () => {
    expect(lint('The dark palette is there because he was grieving.').action).toBe('rewrite');
    expect(lint('The dark palette may be a result of the late light, possibly in response to the weather.').action).toBe('flag');
  });

  it('asks for a rewrite of unhedged symbolism', () => {
    expect(lint('The shark symbolizes death.').action).toBe('rewrite');
    expect(lint('The pitcher embodies purity.').action).toBe('rewrite');
  });

  it('asks for a rewrite of unsupported statements of fact about the world', () => {
    expect(lint('This is the most famous print in Japanese art.').action).toBe('rewrite');
    expect(lint('Scholars agree the sailor is doomed.').action).toBe('rewrite');
  });
});

describe('hedging rules: verified museum facts and provenance', () => {
  it('passes legitimate verified museum facts stated plainly', () => {
    const hokusai = record('great-wave');
    for (const text of [
      'The print comes from the series Thirty-six Views of Mount Fuji.',
      'The print shows a great wave off Kanagawa.',
      'Woodblock print; ink and color on paper.',
    ]) {
      const r = lintText(text, { sourceType: 'externally_verified', field: 'description', recordText: hokusai });
      expect(r, text).toMatchObject({ action: 'pass', downgraded: false, sourceType: 'externally_verified' });
    }
  });

  it('downgrades "verified" text that makes interpretive claims, and then judges it as interpretation', () => {
    const r = lint('The artist deliberately chose woodblock to symbolize impermanence.', 'externally_verified', 'description');
    expect(r).toMatchObject({ downgraded: true, sourceType: 'ai_inferred', action: 'rewrite' });

    const hedged = lint('This appears to draw from Dutch genre painting.', 'externally_verified', 'description');
    expect(hedged).toMatchObject({ downgraded: true, sourceType: 'ai_inferred', action: 'flag' });
  });

  it('downgrades artist-declared text that claims influence', () => {
    const r = lint('I was influenced by Hokusai.', 'artist_declared');
    expect(r).toMatchObject({ downgraded: true, sourceType: 'ai_inferred' });
  });

  it('never raises provenance', () => {
    for (const text of ['Oil on canvas.', 'Homer copied Hokusai.', 'The shark may symbolize death.']) {
      expect(lint(text, 'ai_inferred').sourceType).toBe('ai_inferred');
    }
  });
});

describe('hedging rules: false positives', () => {
  it.each([
    'Ink drawn on paper, printed from several blocks.',
    'The Met holds copies of the print in several states.',
    'The brushwork imitates the texture of foam.',
    'The painting represents a young woman at a window.',
    'The shadow falls to the left because the light comes from the window.',
    'A figure stands for a moment at the edge of the deck.',
    'The foam breaks into hooked, claw-like fingers.',
    'Nothing proves a link between the two works.',
  ])('passes: %s', (text) => {
    expect(lint(text).action).not.toMatch(/rewrite|reject/);
  });

  it('accepts every curated observation, relationship claim, evidence and caveat', () => {
    for (const a of curatedArtworks) {
      for (const m of a.motifs) {
        for (const o of m.observations) {
          const r = lintText(o.text, { sourceType: o.sourceType, field: 'meaning', recordText: record(a.id) });
          expect([r.action, r.downgraded], `${a.id}/${m.id}: ${o.text}`).toEqual(['pass', false]);
        }
        for (const c of m.connections) {
          const recordText = record(a.id, c.targetArtworkId);
          for (const [field, text] of [
            ['explanation', c.claim.text],
            ['evidence', c.visualEvidence],
            ['caveat', c.caveat],
          ] as const) {
            expect(lintText(text, { sourceType: 'ai_inferred', field, recordText }).action, `${a.id}/${m.id} ${field}: ${text}`).toBe('pass');
          }
          for (const x of c.context ?? []) {
            expect(lintText(x.text, { sourceType: x.sourceType, field: 'meaning', recordText }).action, x.text).toBe('pass');
          }
        }
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/* Document pass                                                        */
/* ------------------------------------------------------------------ */

const rewriteTo = (text: string, action: 'rewrite' | 'reject' = 'rewrite') =>
  vi.fn<HedgingRewriter>(async (items) => ({ rewrites: items.map((i) => ({ ref: i.ref, action, text, reason: 'test' })) }));

describe('runHedgingLinter', () => {
  it('leaves a clean document unchanged and never calls Gemini', async () => {
    const dna = fixtureDna('great-wave');
    const rewrite = rewriteTo('x');
    const { dna: out, outcomes } = await runHedgingLinter(dna, { ctx, rewrite });
    expect(out).toEqual(dna);
    expect(outcomes).toEqual([]);
    expect(rewrite).not.toHaveBeenCalled();
  });

  it('sends an intent claim to Gemini and keeps a rewrite that passes the rules', async () => {
    const dna = fixtureDna('great-wave');
    dna.elements[0].meaning = 'The artist intended the rowers to symbolize human fragility.';
    const rewrite = rewriteTo('The crouched rowers may suggest how small people are against the sea.');
    const notes: string[] = [];
    const { dna: out, outcomes } = await runHedgingLinter(dna, { ctx, rewrite, notes });

    const [items] = rewrite.mock.calls[0];
    expect(items).toEqual([
      expect.objectContaining({ ref: 'elements[the-boats].meaning', field: 'meaning', source_type: 'ai_inferred' }),
    ]);
    expect(items[0].problems.join()).toMatch(/intent "The artist intended"/);
    expect(out.elements[0].meaning).toBe('The crouched rowers may suggest how small people are against the sea.');
    expect(outcomes).toEqual([expect.objectContaining({ ref: 'elements[the-boats].meaning', outcome: 'rewritten' })]);
    expect(notes[0]).toMatch(/^Hedging linter rewritten elements\[the-boats\]\.meaning/);
  });

  it('removes the item when the rewrite still fails the rules', async () => {
    const dna = fixtureDna('great-wave');
    dna.elements[0].meaning = 'The artist intended the rowers to look small.';
    const { dna: out, outcomes } = await runHedgingLinter(dna, { ctx, rewrite: rewriteTo('The artist definitely meant this.') });
    expect(out.elements.map((e) => e.id)).not.toContain('the-boats');
    expect(outcomes[0]).toMatchObject({ outcome: 'rejected' });
    expect(outcomes[0].detail).toMatch(/rewrite still fails/);
  });

  it('removes the item when Gemini rejects it, or no reviewer is available', async () => {
    const dna = fixtureDna('great-wave');
    dna.elements[0].meaning = 'This clearly proves the boats are doomed.';
    expect((await runHedgingLinter(dna, { ctx, rewrite: rewriteTo('', 'reject') })).dna.elements).toHaveLength(dna.elements.length - 1);
    expect((await runHedgingLinter(dna, { ctx })).dna.elements).toHaveLength(dna.elements.length - 1);
  });

  it('rejects a copying claim without asking Gemini', async () => {
    const dna = fixtureDna('great-wave');
    dna.relationships[0].explanation = 'Homer copied the boat from Hokusai.';
    const rewrite = rewriteTo('x');
    const { dna: out } = await runHedgingLinter(dna, { ctx, rewrite });
    expect(rewrite).not.toHaveBeenCalled();
    expect(out.relationships).toHaveLength(dna.relationships.length - 1);
  });

  it('downgrades a "verified" technique whose description interprets, then hedges it', async () => {
    const dna = fixtureDna('great-wave');
    dna.techniques[0].description = 'The woodblock technique symbolizes the transience of life.';
    const rewrite = rewriteTo('The flat woodblock colour may give the scene a still, graphic look.');
    const { dna: out, outcomes } = await runHedgingLinter(dna, { ctx, rewrite });
    expect(out.techniques[0]).toMatchObject({
      source_type: 'ai_inferred',
      description: 'The flat woodblock colour may give the scene a still, graphic look.',
    });
    expect(outcomes.map((o) => o.outcome)).toEqual(['downgraded', 'rewritten']);
  });

  it('keeps a verified museum fact as verified', async () => {
    const dna = fixtureDna('great-wave');
    dna.techniques[0].description = 'The Met record lists the medium as woodblock print; ink and color on paper.';
    const { dna: out } = await runHedgingLinter(dna, { ctx });
    expect(out.techniques[0].source_type).toBe('externally_verified');
  });

  it('passes the 25-word limit to Gemini for relationship explanations', async () => {
    const dna = fixtureDna('great-wave');
    dna.relationships[0].explanation = 'Both boats definitely face the same fate.';
    const rewrite = rewriteTo('Both boats appear to face open water with no shelter.');
    await runHedgingLinter(dna, { ctx, rewrite });
    expect(rewrite.mock.calls[0][0][0]).toMatchObject({ field: 'explanation', max_words: 25 });
  });

  it('rewrites a negated caveat that the load-time validator would still refuse', async () => {
    const dna = fixtureDna('great-wave');
    dna.relationships[0].caveat = 'Nothing shows that Homer was influenced by Hokusai.';
    const rewrite = rewriteTo('Nothing shows that Homer knew this print.');
    const { dna: out } = await runHedgingLinter(dna, { ctx, rewrite });
    expect(rewrite.mock.calls[0][0][0].problems.join()).toMatch(/load-time validator/);
    expect(out.relationships[0].caveat).toBe('Nothing shows that Homer knew this print.');
    expect(validateCreativeDna(out, ctx).errors).toEqual([]);
  });

  it('turns a Prompt D "overconfident" finding into a rewrite, and rejects an unchanged one', async () => {
    const dna = fixtureDna('great-wave');
    const requests = [{ key: 'elements[the-boats]', reason: 'phrased as certain fact' }];
    const same = await runHedgingLinter(dna, { ctx, requests, rewrite: rewriteTo(dna.elements[0].meaning) });
    expect(same.outcomes[0]).toMatchObject({ outcome: 'rejected' });
    expect(same.outcomes[0].detail).toMatch(/unchanged/);

    const changed = await runHedgingLinter(dna, { ctx, requests, rewrite: rewriteTo('The boats appear low in the trough.') });
    expect(changed.dna.elements[0].meaning).toBe('The boats appear low in the trough.');
  });

  it('rejects the document when the tradition cannot be made safe', async () => {
    const dna = fixtureDna('great-wave');
    dna.tradition.description = 'Hokusai invented this style in 1790 for his patron.';
    await expect(runHedgingLinter(dna, { ctx })).rejects.toBeInstanceOf(HedgingRejection);
  });
});

/* ------------------------------------------------------------------ */
/* Pipeline integration                                                 */
/* ------------------------------------------------------------------ */

describe('hedging linter in the pipeline', () => {
  it('runs before a document is accepted, and records what it changed', async () => {
    const call = mockGemini({
      override: (r) => {
        if (r.label !== 'A great-wave') return undefined;
        const res = elementsResponse(artwork('great-wave'));
        res.elements[1].meaning = 'Hokusai clearly intended the crest to symbolize the power of nature.';
        return JSON.stringify(res);
      },
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    const doc = result.accepted[0];
    const h = call.calls.find((c) => c.label === 'H great-wave')!;
    expect(h.parts.every((p) => 'text' in p)).toBe(true);
    expect((h.parts[0] as { text: string }).text).toContain('elements[wave-crest].meaning');
    expect(doc.elements.find((e) => e.id === 'wave-crest')!.meaning).toMatch(/^FIXTURE: the two details may suggest/);
    expect(doc.generation!.notes.join('\n')).toMatch(/Hedging linter rewritten elements\[wave-crest\]\.meaning/);
    expect(doc.generation!.prompt_versions.H).toBeDefined();
  });

  it('sends Prompt D "overconfident" errors to the linter for a hedged rewrite', async () => {
    const call = mockGemini({
      override: (r) =>
        r.label === 'D great-wave'
          ? JSON.stringify({ issues: [{ path: 'relationships[0]', kind: 'overconfident', severity: 'error', message: 'too sure' }] })
          : undefined,
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    const rel = result.accepted[0].relationships.find((r) => r.source_element_id === 'the-boats')!;
    expect(rel.explanation).toMatch(/^FIXTURE: the two details may suggest/);
    expect(result.accepted[0].generation!.notes.join('\n')).toMatch(/sent to the hedging linter/);
  });

  it('drops only the affected item when the hedging review call fails', async () => {
    const call = mockGemini({
      override: (r) => {
        if (r.label === 'H great-wave') throw Object.assign(new Error('quota exceeded'), { status: 400 });
        if (r.label !== 'A great-wave') return undefined;
        const res = elementsResponse(artwork('great-wave'));
        res.elements[0].meaning = 'The artist definitely meant the boats as a warning.';
        return JSON.stringify(res);
      },
    });
    const result = await runPipeline({ call, model: 'mock', collection: curatedArtworks, only: ['great-wave'], loadImage: fakeImage });
    expect(result.failures).toEqual([]);
    expect(result.accepted[0].elements.map((e) => e.id)).not.toContain('the-boats');
    expect(result.notes['great-wave'].join('\n')).toMatch(/Prompt H failed/);
  });

  it('makes no hedging call when every text is already safe', async () => {
    const call = mockGemini();
    await runPipeline({ call, model: 'mock', collection: curatedArtworks, loadImage: fakeImage });
    expect(call.calls.some((c) => c.label.startsWith('H '))).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Build-time only                                                      */
/* ------------------------------------------------------------------ */

describe('the linter is not a client-side dependency', () => {
  const SRC = path.resolve(import.meta.dirname, '../src');
  const resolve = (from: string, spec: string): string | null => {
    const base = spec.startsWith('@/') ? path.join(SRC, spec.slice(2)) : spec.startsWith('.') ? path.resolve(path.dirname(from), spec) : null;
    if (!base) return null;
    for (const f of [base, `${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) if (existsSync(f) && f.match(/\.tsx?$/)) return f;
    return null;
  };

  it('is unreachable from the app entry points', () => {
    const seen = new Set<string>();
    const queue = [path.join(SRC, 'app/page.tsx'), path.join(SRC, 'app/layout.tsx')];
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      const source = readFileSync(file, 'utf8');
      for (const m of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g)) {
        const next = resolve(file, m[1]);
        if (next) queue.push(next);
      }
    }
    const reached = [...seen].map((f) => path.relative(SRC, f));
    expect(reached).toContain('lib/creative-dna/validate.ts');
    expect(reached.filter((f) => f.startsWith('lib/hedging/') || f.startsWith('lib/gemini/'))).toEqual([]);
  });
});
