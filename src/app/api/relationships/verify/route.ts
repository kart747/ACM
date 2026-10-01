import { NextRequest } from 'next/server';
import { verifyRelationshipWithGemini } from '@/lib/gemini/server-service';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { relationshipId } = body;

    if (!relationshipId) {
      return jsonResponse({ error: 'Missing relationshipId' }, 400);
    }

    const verified = await verifyRelationshipWithGemini(relationshipId);
    if (!verified) {
      return jsonResponse({ error: 'Relationship not found' }, 404);
    }

    return jsonResponse(verified);
  } catch (error) {
    return jsonResponse({ error: 'Internal server error', details: (error as Error).message }, 500);
  }
}
