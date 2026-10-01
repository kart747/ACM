import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';

const records = [
  ['art_001', '446567', '13.228.33'],
  ['art_002', '451725', '63.210.11'],
  ['art_003', '36741', 'JP269'],
  ['art_004', '65584', '2003.165'],
  ['art_005', '436671', '27.250.1'],
  ['art_006', '36491', 'JP10'],
  ['art_007', '11122', '06.1234'],
  ['art_008', '436104', '1982.60.17'],
  ['art_009', '437397', '14.40.618'],
  ['art_010', '437881', '89.15.21'],
];

describe('V2 sourced artwork data', () => {
  it('contains ten distinct public-domain museum works with local images', () => {
    expect(V2_ARTWORKS).toHaveLength(10);
    expect(new Set(V2_ARTWORKS.map(art => art.id)).size).toBe(10);
    expect(new Set(V2_ARTWORKS.map(art => art.sourceUrl)).size).toBe(10);
    const hashes = V2_ARTWORKS.map(art => {
      expect(art.rights).toMatch(/public domain/i);
      const filename = path.join(process.cwd(), 'public', art.image.replace(/^\//, ''));
      const bytes = readFileSync(filename);
      expect([...bytes.subarray(0, 3)]).toEqual([255, 216, 255]);
      return createHash('sha256').update(bytes).digest('hex');
    });
    expect(new Set(hashes).size).toBe(10);
  });

  it('connects all ten artworks to the first work through visible comparisons', () => {
    const reached = new Set([V2_ARTWORKS[0].id]);
    const queue = [V2_ARTWORKS[0].id];
    while (queue.length) {
      const current = queue.shift();
      for (const rel of V2_RELATIONSHIPS.filter(rel => rel.sourceArtworkId === current)) {
        if (!reached.has(rel.targetArtworkId)) {
          reached.add(rel.targetArtworkId);
          queue.push(rel.targetArtworkId);
        }
      }
    }
    expect([...reached].sort()).toEqual(V2_ARTWORKS.map(art => art.id).sort());
    expect(new Set(V2_RELATIONSHIPS.map(rel => rel.id)).size).toBe(V2_RELATIONSHIPS.length);
    for (const art of V2_ARTWORKS) expect(V2_RELATIONSHIPS.some(rel => rel.sourceArtworkId === art.id)).toBe(true);
  });

  it.each(records)('%s links the catalog record belonging to its local image', (id, objectId, accession) => {
    const artwork = V2_ARTWORKS.find(artwork => artwork.id === id)!;
    expect(artwork.sourceUrl).toBe(`https://www.metmuseum.org/art/collection/search/${objectId}`);
    expect(artwork.source).toContain(accession);
    expect(artwork.medium.length).toBeGreaterThan(0);
    expect(artwork.artistStatement).toBeNull();
    expect(artwork.sourceType).toBe('ai_inferred');
  });

  it('credits the painter of the garden scene and removes the nonexistent peacock motif', () => {
    expect(V2_ARTWORKS[0].creator).toContain('Manohar');
    expect(V2_ARTWORKS[0].title).toContain('Garden');
    expect(V2_ELEMENTS.art_001.some(element => /peacock/i.test(element.label))).toBe(false);
  });

  it('identifies the print as peacock and maple, and the Dutch work as oil on canvas', () => {
    expect(V2_ELEMENTS.art_003.map(element => element.label).join(' ')).toMatch(/Peacock.*Maple/);
    expect(V2_ELEMENTS.art_003.map(element => element.label).join(' ')).not.toMatch(/crane|cherry/i);
    expect(V2_ARTWORKS.find(artwork => artwork.id === 'art_005')?.medium).toBe('Oil on canvas');
    expect(V2_ELEMENTS.art_005.map(element => element.label).join(' ')).not.toMatch(/abstract|gold leaf/i);
  });

  it('keeps all curated polygons inside the image and labels visual readings as interpretations', () => {
    const ids = new Set<string>();
    for (const artwork of V2_ARTWORKS) {
      expect(V2_ELEMENTS[artwork.id].length).toBeGreaterThanOrEqual(2);
      for (const element of V2_ELEMENTS[artwork.id]) {
        expect(ids.has(element.id)).toBe(false);
        ids.add(element.id);
        expect(element.geometry.points.length).toBeGreaterThanOrEqual(3);
        for (const point of element.geometry.points) {
          expect(point).toHaveLength(2);
          for (const coordinate of point) {
            expect(Number.isFinite(coordinate)).toBe(true);
            expect(coordinate).toBeGreaterThanOrEqual(0);
            expect(coordinate).toBeLessThanOrEqual(1);
          }
        }
        const area = element.geometry.points.reduce((sum, [x, y], i, points) => {
          const next = points[(i + 1) % points.length];
          return sum + x * next[1] - next[0] * y;
        }, 0);
        expect(Math.abs(area)).toBeGreaterThan(0.0001);
        expect(element.meaning.sourceType).toBe('ai_inferred');
      }
    }
  });

  it('uses real endpoints without invented agreement scores or historical verification', () => {
    for (const relationship of V2_RELATIONSHIPS) {
      expect(V2_ELEMENTS[relationship.sourceArtworkId].some(element => element.id === relationship.sourceElementId)).toBe(true);
      expect(V2_ELEMENTS[relationship.targetArtworkId].some(element => element.id === relationship.targetElementId)).toBe(true);
      expect(relationship.status).toBe('candidate');
      expect(relationship.agreement).toBe('');
      expect(relationship.evidence.length).toBeGreaterThan(0);
    }
  });
});
