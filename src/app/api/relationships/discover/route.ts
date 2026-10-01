import { NextRequest } from 'next/server';
import { V2_RELATIONSHIPS } from '@/data/artworks-v2';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artworkId, elementId } = body;

    if (!artworkId || !elementId) {
      return jsonResponse({ error: 'Missing artworkId or elementId' }, 400);
    }

    const matches = V2_RELATIONSHIPS.filter(
      (r) => r.sourceArtworkId === artworkId && r.sourceElementId === elementId
    );

    return jsonResponse(matches);
  } catch (error) {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
}
