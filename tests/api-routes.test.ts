import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { V2_ARTWORKS, V2_ELEMENTS, V2_RELATIONSHIPS } from '@/data/artworks-v2';

beforeEach(() => {
  for (const key of Object.keys(process.env).filter(key => key.startsWith('GEMINI_API_KEY'))) vi.stubEnv(key, '');
  vi.stubEnv('GEMINI_API_KEY', '');
});
afterEach(() => vi.unstubAllEnvs());
import { GET as getArtworks } from '@/app/api/artworks/route';
import { GET as getArtworkById } from '@/app/api/artworks/[id]/route';
import { GET as getElements } from '@/app/api/artworks/[id]/elements/route';
import { GET as getRelationships } from '@/app/api/relationships/route';
import { POST as discoverRelationships } from '@/app/api/relationships/discover/route';
import { POST as verifyRelationship } from '@/app/api/relationships/verify/route';
import { POST as analyzeArtwork } from '@/app/api/analyze/route';
import { GET as getHealth } from '@/app/api/health/route';
import { NextRequest } from 'next/server';

function makeRequest(url: string, method = 'GET', body?: unknown): NextRequest {
  if (body) {
    return new NextRequest(new URL(url, 'http://localhost:3000'), {
      method,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), { method });
}

describe('Next.js API Route Handlers', () => {
  it('GET /api/health returns online status and Gemini mode', async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('online');
    expect(data.version).toBe('2.0.0');
    expect(data.gemini).toBeDefined();
  });

  it('GET /api/artworks returns all 10 V2 artworks', async () => {
    const res = await getArtworks();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(10);
    expect(data[0].id).toBe('art_001');
    expect(data).toEqual(V2_ARTWORKS);
  });

  it('GET /api/artworks/[id] returns a single artwork', async () => {
    const req = makeRequest('http://localhost:3000/api/artworks/art_001');
    const res = await getArtworkById(req, { params: Promise.resolve({ id: 'art_001' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe('art_001');
    expect(data).toEqual(V2_ARTWORKS[0]);
  });

  it('GET /api/artworks/[id]/elements returns motifs and features', async () => {
    const req = makeRequest('http://localhost:3000/api/artworks/art_001/elements');
    const res = await getElements(req, { params: Promise.resolve({ id: 'art_001' }) });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(2);
    expect(data).toEqual(V2_ELEMENTS.art_001);
    expect(data[0].geometry.type).toBe('polygon');
  });

  it('GET /api/relationships filters by artworkId', async () => {
    const req = makeRequest('http://localhost:3000/api/relationships?artworkId=art_001');
    const res = await getRelationships(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    for (const rel of data) {
      expect(rel.sourceArtworkId === 'art_001' || rel.targetArtworkId === 'art_001').toBe(true);
    }
  });

  it('POST /api/relationships/discover returns matching connections', async () => {
    const req = makeRequest('http://localhost:3000/api/relationships/discover', 'POST', {
      artworkId: 'art_001',
      elementId: 'elem_001_01',
    });
    const res = await discoverRelationships(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toEqual(V2_RELATIONSHIPS.filter(rel => rel.sourceArtworkId === 'art_001' && rel.sourceElementId === 'elem_001_01'));
  });

  it('POST /api/relationships/verify reports no AI verification without credentials', async () => {
    const req = makeRequest('http://localhost:3000/api/relationships/verify', 'POST', {
      relationshipId: 'rel_001',
    });
    const res = await verifyRelationship(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.relationship.id).toBe('rel_001');
    expect(data.verificationRuns).toBe(0);
    expect(data.agreement).toBe('');
    expect(data.status).toBe('candidate');
  });

  it('POST /api/analyze provides structured CreativeDNA analysis', async () => {
    const req = makeRequest('http://localhost:3000/api/analyze', 'POST', {
      artworkId: 'art_001',
    });
    const res = await analyzeArtwork(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.artwork.id).toBe('art_001');
    expect(data.elements.length).toBeGreaterThanOrEqual(1);
    expect(data.status).toBeDefined();
  });
});
