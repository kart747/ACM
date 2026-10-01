import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({ get: vi.fn(), generate: vi.fn() }));
vi.mock('@/lib/story/service', () => ({ storyService: service }));
import { GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD } from '@/app/api/artworks/[id]/story/route';

const url = 'http://localhost:3000/api/artworks/art_001/story';
const context = { params: Promise.resolve({ id: 'art_001' }) };
beforeEach(() => {
  service.get.mockReset().mockResolvedValue({ artworkId: 'art_001', source: 'prepared', model: null, story: {} });
  service.generate.mockReset().mockResolvedValue({ artworkId: 'art_001', source: 'prepared', model: null, reason: 'not_configured', story: {} });
});

describe('story API', () => {
  it('GET only reads cache/prepared and exposes no wildcard CORS', async () => {
    const response = await GET(new Request(url), context);
    expect(response.status).toBe(200);
    expect((await response.json()).source).toBe('prepared');
    expect(service.generate).not.toHaveBeenCalled();
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it.each([undefined, 'http://localhost:3000'])('accepts a path-only same-origin POST', async origin => {
    const response = await POST(new Request(url, { method: 'POST', headers: origin ? { Origin: origin } : {} }), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ source: 'prepared', model: null, reason: 'not_configured' });
    expect(service.generate).toHaveBeenCalledWith('art_001');
  });

  it.each(['https://evil.example', 'null', 'http://localhost:3001'])('rejects cross-origin POST: %s', async origin => {
    const response = await POST(new Request(url, { method: 'POST', headers: { Origin: origin } }), context);
    expect(response.status).toBe(403);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('accepts the empty stream used by Next.js for a bodyless POST', async () => {
    const request = new Request(url, {
      method: 'POST',
      body: new ReadableStream({ start(controller) { controller.close(); } }),
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    expect((await POST(request, context)).status).toBe(200);
    expect(service.generate).toHaveBeenCalledWith('art_001');
  });

  it('rejects body input, query overrides, and oversized requests without forwarding them', async () => {
    const body = new Request(url, { method: 'POST', body: JSON.stringify({ prompt: 'override', model: 'custom', image: '/secret' }) });
    expect((await POST(body, context)).status).toBe(400);
    expect((await POST(new Request(`${url}?refresh=true`, { method: 'POST' }), context)).status).toBe(400);
    const oversized = new Request(url, { method: 'POST', headers: { 'content-length': '65537' } });
    expect((await POST(oversized, context)).status).toBe(413);
    expect(service.generate).not.toHaveBeenCalled();
  });

  it('returns a safe 404 for unknown artwork IDs', async () => {
    service.get.mockResolvedValue(null);
    service.generate.mockResolvedValue(null);
    expect((await GET(new Request(url), context)).status).toBe(404);
    expect((await POST(new Request(url, { method: 'POST' }), context)).status).toBe(404);
  });

  it('never exposes internal exceptions', async () => {
    service.generate.mockRejectedValue(new Error('secret raw provider error'));
    const response = await POST(new Request(url, { method: 'POST' }), context);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Story unavailable' });
  });

  it.each([PUT, PATCH, DELETE, OPTIONS, HEAD])('rejects unsupported methods without CORS grants', async handler => {
    const response = handler();
    expect(response.status).toBe(405);
    expect(response.headers.get('allow')).toBe('GET, POST');
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(service.generate).not.toHaveBeenCalled();
  });
});
