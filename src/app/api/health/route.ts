import { isGeminiConfigured } from '@/lib/gemini/server-service';
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
      model: process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash',
      mode: geminiActive ? 'live_multimodal' : 'curated_fallback'
    },
    timestamp: new Date().toISOString()
  });
}
