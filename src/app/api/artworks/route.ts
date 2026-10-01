import { V2_ARTWORKS } from '@/data/artworks-v2';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  return jsonResponse(V2_ARTWORKS);
}
