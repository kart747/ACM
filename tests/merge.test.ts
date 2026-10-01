import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { curatedArtworks } from '@/data/artworks';
import { artworks as appArtworks, collectionReport } from '@/data/collection';
import { generatedCreativeDna } from '@/data/generated';
import { applyCreativeDna } from '@/lib/creative-dna/merge';
import { fixtureDna } from './fixtures/gemini';

describe('fallback to curated data', () => {
  it('uses curated data unchanged when nothing is generated', () => {
    const { artworks, report } = applyCreativeDna(curatedArtworks, []);
    expect(report.every((r) => r.dataSource === 'curated')).toBe(true);
    expect(artworks.map((a) => a.dataSource)).toEqual(Array(5).fill('curated'));
    const boats = artworks[0].motifs[0];
    expect(boats.observations[0].text).toBe(curatedArtworks[0].motifs[0].observations[0].text);
    expect(boats.observations[0].origin).toBe('curated');
    expect(artworks[0].creativeDna).toBeUndefined();
  });

  it('falls back per artwork when a stored document is invalid, and reports why', () => {
    const broken = { ...fixtureDna('gulf-stream'), tradition: undefined };
    const { artworks, report } = applyCreativeDna(curatedArtworks, [fixtureDna('great-wave'), broken]);
    expect(artworks.find((a) => a.id === 'great-wave')!.dataSource).toBe('gemini');
    expect(artworks.find((a) => a.id === 'gulf-stream')!.dataSource).toBe('curated');
    expect(report.find((r) => r.artworkId === 'gulf-stream')!.errors[0]).toMatch(/schema: tradition/);
  });

  it('keeps the curated item when Gemini did not produce it', () => {
    const doc = fixtureDna('great-wave');
    doc.elements = doc.elements.filter((e) => e.id !== 'mount-fuji');
    doc.relationships = doc.relationships.filter((r) => r.source_element_id !== 'mount-fuji');
    const { artworks } = applyCreativeDna(curatedArtworks, [doc]);
    const fuji = artworks[0].motifs.find((m) => m.id === 'mount-fuji')!;
    expect(fuji.observations.every((c) => c.origin === 'curated')).toBe(true);
    expect(fuji.connections[0].claim.origin).toBe('curated');
  });
});

describe('generated data replaces AI interpretation only', () => {
  const { artworks, report } = applyCreativeDna(curatedArtworks, curatedArtworks.map((a) => fixtureDna(a.id)));

  it('marks every artwork as Gemini-backed and counts replacements', () => {
    expect(artworks.every((a) => a.dataSource === 'gemini')).toBe(true);
    const r = report.find((x) => x.artworkId === 'great-wave')!;
    expect(r).toMatchObject({ replacedElements: 4, replacedRelationships: 4 });
  });

  it('replaces the AI observation but keeps Met-record claims', () => {
    const crest = artworks[0].motifs.find((m) => m.id === 'wave-crest')!;
    expect(crest.observations[0]).toMatchObject({ sourceType: 'externally_verified', origin: 'curated' });
    expect(crest.observations[1]).toMatchObject({ sourceType: 'ai_inferred', origin: 'gemini' });
    expect(crest.observations[1].text).toMatch(/^FIXTURE reading of The Crest/);
    expect(crest.observations[1].sourceDetail).toMatch(/Gemini \(fixture-model\), generated 2026-09-30/);
    expect(crest.observations).toHaveLength(2);
  });

  it('replaces relationship text, evidence and caveat; keeps type and verified context', () => {
    const boats = artworks[0].motifs.find((m) => m.id === 'the-boats')!;
    const c = boats.connections[0];
    expect(c.relationshipType).toBe('shared_motif');
    expect(c.claim).toMatchObject({ origin: 'gemini', sourceType: 'ai_inferred', confidence: 0.72 });
    expect(c.visualEvidence).toMatch(/^FIXTURE/);
    expect(c.caveat).toMatch(/^FIXTURE/);
    expect(c.context?.[0]).toMatchObject({ sourceType: 'externally_verified', origin: 'curated' });
  });

  it('exposes techniques and tradition with provenance', () => {
    const dna = artworks[0].creativeDna!;
    expect(dna.techniques[0]).toMatchObject({ name: 'Woodblock print', sourceType: 'externally_verified', origin: 'gemini' });
    expect(dna.tradition.name).toBe('Japanese');
  });

  it('never changes the journey structure', () => {
    for (const [i, a] of artworks.entries()) {
      const c = curatedArtworks[i];
      expect(a.motifs.map((m) => [m.id, m.rect, m.connections.map((x) => `${x.targetArtworkId}/${x.targetMotifId}`)])).toEqual(
        c.motifs.map((m) => [m.id, m.rect, m.connections.map((x) => `${x.targetArtworkId}/${x.targetMotifId}`)]),
      );
    }
  });
});

describe('stored generated JSON', () => {
  it('round-trips through JSON as the CLI writes it', () => {
    const text = `${JSON.stringify(fixtureDna('water-pitcher'), null, 2)}\n`;
    const { artworks } = applyCreativeDna(curatedArtworks, [JSON.parse(text)]);
    expect(artworks.find((a) => a.id === 'water-pitcher')!.dataSource).toBe('gemini');
  });

  it('the app collection loads whatever src/data/generated holds, and every stored file validates', () => {
    expect(Array.isArray(generatedCreativeDna)).toBe(true);
    expect(appArtworks).toHaveLength(5);
    for (const r of collectionReport) {
      if (r.dataSource === 'curated') expect(r.errors, `${r.artworkId} stored document is invalid`).toEqual([]);
    }
    const index = readFileSync(path.resolve(import.meta.dirname, '../src/data/generated/index.ts'), 'utf8');
    expect(index).toMatch(/export const generatedCreativeDna: unknown\[\]/);
  });
});
