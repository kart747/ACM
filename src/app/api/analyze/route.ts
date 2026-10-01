import { NextRequest } from 'next/server';
import { analyzeArtworkWithGemini } from '@/lib/gemini/server-service';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artworkId } = body;

    if (!artworkId) {
      return jsonResponse({ error: 'Missing artworkId' }, 400);
    }

    const result = await analyzeArtworkWithGemini(artworkId);
    return jsonResponse(result);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', details: (error as Error).message }, 500);
  }
}
