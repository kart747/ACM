import { isGeminiConfigured, REQUIRED_GEMINI_MODEL } from '@/lib/gemini/routing-client';
import { handleOptions, jsonResponse } from '@/lib/cors';

export async function OPTIONS() {
  return handleOptions();
}

export async function GET() {
  const geminiActive = isGeminiConfigured();
  return jsonResponse({
    status: 'online',
    version: '2.0.0',
    gemini: {
      configured: geminiActive,
      model: REQUIRED_GEMINI_MODEL,
      provider: 'https://api.routing.run/v1',
      mode: geminiActive ? 'live_available' : 'curated_fallback'
    },
    timestamp: new Date().toISOString()
  });
}
