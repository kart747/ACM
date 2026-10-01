import { storyService } from '@/lib/story/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

function json(value: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  try {
    const result = await storyService.get(id);
    return result ? json(result) : json({ error: 'Artwork not found' }, 404);
  } catch {
    return json({ error: 'Story unavailable' }, 500);
  }
}

export async function POST(request: Request, { params }: Context) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== url.origin) return json({ error: 'Cross-origin request not allowed' }, 403);
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) > 64 * 1024) return json({ error: 'Request too large' }, 413);
  if (url.search || (contentLength !== null && contentLength !== '0')) {
    return json({ error: 'Only the artwork ID in the path is accepted' }, 400);
  }
  // Next.js can wrap an empty POST in a stream; only its actual bytes count as a body.
  const reader = request.body?.getReader();
  if (reader) {
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (chunk.value.byteLength) {
          await reader.cancel();
          return json({ error: 'Only the artwork ID in the path is accepted' }, chunk.value.byteLength > 64 * 1024 ? 413 : 400);
        }
      }
    } catch {
      return json({ error: 'Invalid request body' }, 400);
    } finally {
      reader.releaseLock();
    }
  }
  const { id } = await params;
  try {
    const result = await storyService.generate(id);
    return result ? json(result) : json({ error: 'Artwork not found' }, 404);
  } catch {
    return json({ error: 'Story unavailable' }, 500);
  }
}

function methodNotAllowed() {
  return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, POST' });
}

export const PUT = methodNotAllowed;
export const PATCH = methodNotAllowed;
export const DELETE = methodNotAllowed;
export const OPTIONS = methodNotAllowed;
export const HEAD = methodNotAllowed;
