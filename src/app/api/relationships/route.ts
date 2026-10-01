import { NextRequest } from 'next/server';
import { V2_RELATIONSHIPS } from '@/data/artworks-v2';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  const artworkId = searchParams.get('artworkId');

  if (id) {
    const rel = V2_RELATIONSHIPS.find((r) => r.id === id);
    if (!rel) return jsonResponse({ error: 'Relationship not found' }, 404);
    return jsonResponse(rel);
  }

  if (artworkId) {
    const matching = V2_RELATIONSHIPS.filter(
      (r) => r.sourceArtworkId === artworkId || r.targetArtworkId === artworkId
    );
    return jsonResponse(matching);
  }

  return jsonResponse(V2_RELATIONSHIPS);
}
