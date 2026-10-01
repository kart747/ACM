import { NextRequest } from 'next/server';
import { V2_ELEMENTS } from '@/data/artworks-v2';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const elements = V2_ELEMENTS[id] || [];

  return jsonResponse(elements);
}
