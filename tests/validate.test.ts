import { describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { CreativeDnaSchema } from '@/lib/creative-dna/schema';
import { contextFromArtworks, validateCreativeDna, wordCount } from '@/lib/creative-dna/validate';
import { fixtureDna } from './fixtures/gemini';

const ctx = contextFromArtworks(curatedArtworks);

describe('CreativeDNA schema (spec §16)', () => {
  it('accepts a spec-exact document without the extension fields', () => {
    const doc = fixtureDna('great-wave');
    const specOnly = {
      ...doc,
      relationships: doc.relationships.map(({ target_artwork_id, relationship_type, explanation, source_type, confidence }) => ({
        target_artwork_id,
        relationship_type,
        explanation,
        source_type,
        confidence,
      })),
    };
    expect(CreativeDnaSchema.safeParse(specOnly).success).toBe(true);
  });

  it('rejects the old custom relationship types', () => {
    for (const type of ['echo', 'contrast', 'formal', 'source-image']) {
      const doc = fixtureDna('great-wave') as unknown as { relationships: { relationship_type: string }[] };
      doc.relationships[0].relationship_type = type;
      const r = validateCreativeDna(doc, ctx);
      expect(r.ok).toBe(false);
      expect(r.errors.join()).toMatch(/relationship_type/);
    }
  });

  it('rejects documents with missing required fields, naming the field', () => {
    const doc = fixtureDna('great-wave') as Record<string, unknown>;
    delete doc.tradition;
    const r = validateCreativeDna(doc, ctx);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/^schema: tradition/);
  });

  it('rejects coordinates outside 0–1 and confidence outside 0–1', () => {
    const doc = fixtureDna('great-wave');
    doc.elements[0].location.x = 1.4;
    doc.relationships[0].confidence = 87;
    const r = validateCreativeDna(doc, ctx);
    expect(r.ok).toBe(false);
    expect(r.errors.join('\n')).toMatch(/elements\.0\.location\.x/);
    expect(r.errors.join('\n')).toMatch(/relationships\.0\.confidence/);
  });

  it('rejects non-JSON-object input', () => {
    expect(validateCreativeDna('not json', ctx).ok).toBe(false);
    expect(validateCreativeDna(null, ctx).ok).toBe(false);
  });
});

describe('validate_creative_dna semantics (spec §20, §35)', () => {
  it('accepts every fixture document unchanged', () => {
    for (const a of curatedArtworks) {
      const r = validateCreativeDna(fixtureDna(a.id), ctx);
      expect(r.errors, a.id).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });

  it('rejects an artwork outside the sourced set, or a changed title or artist', () => {
    const outside = fixtureDna('great-wave');
    outside.artwork.id = 'mona-lisa';
    expect(validateCreativeDna(outside, ctx).ok).toBe(false);

    const renamed = fixtureDna('great-wave');
    renamed.artwork.artist = 'Utagawa Hiroshige';
    const r = validateCreativeDna(renamed, ctx);
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/does not match the record/);
  });

  it('drops an element Gemini places outside its motif rectangle', () => {
    const doc = fixtureDna('great-wave');
    doc.elements[0].location = { x: 0.05, y: 0.05 };
    const r = validateCreativeDna(doc, ctx);
    expect(r.ok).toBe(true);
    expect(r.dna!.elements.map((e) => e.id)).not.toContain('the-boats');
    expect(r.errors.join()).toMatch(/outside the motif rectangle/);
  });

  it('drops elements that are not supplied motifs, and duplicates', () => {
    const doc = fixtureDna('great-wave');
    doc.elements.push({ ...doc.elements[0], id: 'invented-dragon' }, { ...doc.elements[1] });
    const r = validateCreativeDna(doc, ctx);
    expect(r.dna!.elements).toHaveLength(4);
    expect(r.errors.join('\n')).toMatch(/invented-dragon.*not one of the supplied motifs/);
    expect(r.errors.join('\n')).toMatch(/duplicate element id/);
  });

  it('downgrades artist_declared, since no artist statement is supplied', () => {
    const doc = fixtureDna('great-wave');
    doc.elements[0].source_type = 'artist_declared';
    const r = validateCreativeDna(doc, ctx);
    expect(r.dna!.elements[0].source_type).toBe('ai_inferred');
    expect(r.warnings.join()).toMatch(/artist_declared downgraded/);
  });

  it('downgrades "verified" claims the museum record does not back', () => {
    const doc = fixtureDna('great-wave');
    doc.techniques[0] = { name: 'Prussian blue pigment', description: 'Uses imported blue.', source_type: 'externally_verified' };
    doc.tradition = { name: 'Ukiyo-e', description: 'Pictures of the floating world.', source_type: 'externally_verified' };
    const r = validateCreativeDna(doc, ctx);
    expect(r.dna!.techniques[0].source_type).toBe('ai_inferred');
    expect(r.dna!.tradition.source_type).toBe('ai_inferred');
  });

  it('keeps "verified" when the record names it', () => {
    const r = validateCreativeDna(fixtureDna('great-wave'), ctx);
    expect(r.dna!.techniques[0].name).toBe('Woodblock print');
    expect(r.dna!.techniques[0].source_type).toBe('externally_verified');
  });

  it('rejects overconfident or influence claims in AI interpretations', () => {
    const doc = fixtureDna('gulf-stream');
    doc.relationships[0].explanation = 'Homer definitely copied this pose from David.';
    doc.elements[0].meaning = 'The artist intended the boat to stand for America.';
    const r = validateCreativeDna(doc, ctx);
    expect(r.ok).toBe(true);
    expect(r.errors.join('\n')).toMatch(/overconfident wording "definitely"/);
    expect(r.errors.join('\n')).toMatch(/overconfident wording "the artist intended"/i);
    expect(r.dna!.relationships).toHaveLength(doc.relationships.length - 1);
  });

  it('rejects explanations over 25 words', () => {
    const doc = fixtureDna('great-wave');
    doc.relationships[0].explanation = Array(26).fill('word').join(' ');
    expect(wordCount(doc.relationships[0].explanation)).toBe(26);
    const r = validateCreativeDna(doc, ctx);
    expect(r.errors.join()).toMatch(/26 words \(max 25\)/);
  });

  it('only accepts human-approved relationships with the approved type', () => {
    const doc = fixtureDna('great-wave');
    doc.relationships.push({ ...doc.relationships[0], target_artwork_id: 'self-portrait', target_element_id: 'lit-face' });
    doc.relationships[0].relationship_type = 'same_tradition';
    const r = validateCreativeDna(doc, ctx);
    expect(r.errors.join('\n')).toMatch(/not a human-approved relationship/);
    expect(r.errors.join('\n')).toMatch(/differs from the approved "shared_motif"/);
  });

  it('rejects relationships to artworks outside the closed set, or missing evidence', () => {
    const doc = fixtureDna('great-wave');
    doc.relationships[0].target_artwork_id = 'starry-night';
    delete doc.relationships[1].evidence;
    const r = validateCreativeDna(doc, ctx);
    expect(r.errors.join('\n')).toMatch(/not in the sourced artwork set/);
    expect(r.errors.join('\n')).toMatch(/missing source_element_id, target_element_id, evidence or caveat/);
  });

  it('forces relationship provenance to ai_inferred', () => {
    const doc = fixtureDna('great-wave');
    doc.relationships[0].source_type = 'externally_verified';
    const r = validateCreativeDna(doc, ctx);
    expect(r.dna!.relationships[0].source_type).toBe('ai_inferred');
  });
});
