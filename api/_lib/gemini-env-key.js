'use strict';

/**
 * Resolve Gemini (Google AI Studio) API key from environment.
 * Same Google AI key may be stored under different variable names across docs / teams.
 *
 * Order (first non-empty wins):
 *   GEMINI_API_KEY — project & Vercel convention
 *   GOOGLE_AI_API_KEY — @google/generative-ai / AI Studio samples
 *   GOOGLE_GENAI_API_KEY — Gen AI SDK naming
 *   GOOGLE_GENERATIVE_AI_API_KEY — explicit
 *   GOOGLE_API_KEY — generic (only use when this project’s Gemini key lives here)
 */
function resolveGeminiApiKeyFromEnv() {
  const names = [
    'GEMINI_API_KEY',
    'GOOGLE_AI_API_KEY',
    'GOOGLE_GENAI_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'GOOGLE_API_KEY',
  ];
  for (const name of names) {
    const v = process.env[name];
    const t = typeof v === 'string' ? v.trim() : '';
    if (t) return t;
  }
  return '';
}

module.exports = { resolveGeminiApiKeyFromEnv };
