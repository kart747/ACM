import { NextRequest } from 'next/server';
import { V2_ARTWORKS } from '@/data/artworks-v2';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const artwork = V2_ARTWORKS.find((a) => a.id === id);

  if (!artwork) {
    return jsonResponse({ error: 'Artwork not found' }, 404);
  }

  return jsonResponse(artwork);
}
