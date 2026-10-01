import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';
import { sourceRecordLabel, sourceRecordRef } from '@/lib/artwork-sources';
import { prepareStory } from '@/lib/story/prepared';
import { validateStory } from '@/lib/story/schema';

const photo = V2_ARTWORKS.find(artwork => artwork.id === 'art_011')!;
const hashes = [
  ['art_011', '2b8977655ac93c839c7a8b8e92c0533fd4994011b5a426cc29fd13b9cb6486e8'],
  ['art_012', '8d68644cb8c8b86781f8018014d7f7f5105cc78032fdfa18fd721c82a061b8a1'],
  ['art_013', 'f719d65e5d0bf1db2bb55c15af2b1fcabd8355b23cd8051c3b55d7720a16165d'],
];

describe('cultural collection sources', () => {
  it.each(hashes)('%s uses the exact unfiltered approved image', (id, expected) => {
    const artwork = V2_ARTWORKS.find(item => item.id === id)!;
    const bytes = readFileSync(path.join(process.cwd(), 'public', artwork.image.replace(/^\//, '')));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expected);
    expect(artwork.image).not.toMatch(/interpretation|stylized|derived/);
    expect(artwork.imageCredit?.sourceUrl).toBe(artwork.sourceUrl);
    expect(artwork.imageCredit?.licenseUrl).toMatch(/^https:\/\/creativecommons\.org\//);
    expect(artwork.culturalClaims?.length).toBeGreaterThan(0);
  });

  it('credits the photographer and preserves the attribution/share-alike licence', () => {
    expect(photo.sourceKind).toBe('photograph');
    expect(photo.sourceUrl).toBe('https://commons.wikimedia.org/wiki/File:Lord_Shree_Durga_Devi_slays_Mahishasura.jpg');
    expect(photo.imageCredit).toMatchObject({
      creator: 'Krishnamoorthy Sudhakar',
      license: 'CC BY-SA 4.0',
    });
    expect(photo.imageCredit!.title).toContain('Durga');
    expect(photo.imageCredit!.changes).toMatch(/resiz/i);
    expect(photo.imageCredit!.changes).toMatch(/JPEG/i);
    expect(photo.creator).toMatch(/photograph/i);
    expect(photo.region).toMatch(/unverified|not (?:recorded|verified|established)/i);
    expect(photo.culturalClaims!.some(claim => claim.tier === 'unverified')).toBe(true);
    expect(photo.culturalClaims!.some(claim => claim.tier === 'community_review')).toBe(true);
    expect(photo.artistStatement).toBeNull();
  });

  it('keeps numbered cultural markers apart at the mobile detail-panel size', () => {
    for (const [id, width, height] of [['art_011', 1400, 933], ['art_012', 1050, 1400], ['art_013', 1400, 945]] as const) {
      const scale = Math.min(358 / width, (844 * 0.34) / height);
      const positions = V2_ELEMENTS[id].map(element => {
        const [x, y] = element.geometry.points[0];
        return [x * width * scale, y * height * scale];
      });
      for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
        expect(Math.hypot(positions[i][0] - positions[j][0], positions[i][1] - positions[j][1])).toBeGreaterThan(22);
      }
    }
  });

  it('keeps museum attributions conservative and excludes flagged research records', () => {
    for (const id of ['art_012', 'art_013']) {
      const artwork = V2_ARTWORKS.find(item => item.id === id)!;
      expect(artwork.creator).toMatch(/unknown|not named/i);
      expect(artwork.sourceKind).toBe('museum');
      expect(artwork.sourceType).toBe('ai_inferred');
      expect(artwork.imageCredit!.license).toMatch(/CC0|Public Domain/);
    }
    expect(V2_ARTWORKS.some(artwork => /74660|74653/.test(artwork.sourceUrl))).toBe(false);
    expect(V2_ARTWORKS.some(artwork => /mahishasura-interpretation/.test(artwork.image))).toBe(false);
  });

  it('labels source references honestly and produces valid prepared stories for all thirteen works', () => {
    expect(sourceRecordLabel(photo)).toBe('Photograph source');
    expect(sourceRecordRef(photo)).toBe('source_record');
    expect(sourceRecordLabel(V2_ARTWORKS[0])).toBe('Museum record');
    expect(sourceRecordRef(V2_ARTWORKS[0])).toBe('museum_record');
    for (const artwork of V2_ARTWORKS) {
      const elements = V2_ELEMENTS[artwork.id];
      const story = prepareStory(artwork, elements);
      expect(validateStory(story, artwork, elements, false)).toEqual(story);
      expect(story.beats[0].source_refs).toEqual([sourceRecordRef(artwork)]);
    }
  });

  it('keeps cultural connections provisional, with real detail endpoints and evidence limits', () => {
    const ids = new Set(hashes.map(([id]) => id));
    const relationships = V2_RELATIONSHIPS.filter(rel => ids.has(rel.sourceArtworkId) || ids.has(rel.targetArtworkId));
    expect(relationships.length).toBeGreaterThanOrEqual(6);
    for (const rel of relationships) {
      expect(rel.status).toBe('candidate');
      expect(rel.agreement).toBe('');
      expect(rel.relationshipType).not.toBe('artist_influence');
      expect(rel.culturalClaims?.length).toBeGreaterThan(0);
      expect(rel.evidence.find(item => item.type === 'limitation')?.description).toMatch(/not|no |without|doesn|cannot|neither/i);
    }
  });
});
