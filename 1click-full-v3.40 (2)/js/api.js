import { ADAPTIVE_VIDEO_DIRECTOR_PROMPT } from './promptTemplate.js';

// ★ Gemini Fallback Helper — auto-switch model เมื่อโดน rate limit (429) ★
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

async function fetchGeminiWithFallbackAPI(apiKey, requestBody, maxOutputTokens = 16384, temperature = 0.7) {
  for (let i = 0; i < GEMINI_MODELS.length; i++) {
    const model = GEMINI_MODELS[i];
    try {
      console.log(`[Gemini-API] Trying model: ${model}...`);
      const body = JSON.parse(JSON.stringify(requestBody));
      if (!body.generationConfig) body.generationConfig = {};
      body.generationConfig.maxOutputTokens = maxOutputTokens;
      body.generationConfig.temperature = temperature;
      
      // ★ Auto-inject safetySettings BLOCK_NONE ถ้ายังไม่มี — ป้องกัน PROHIBITED_CONTENT ★
      if (!body.safetySettings) {
        body.safetySettings = [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ];
      }
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      
      if (response.status === 429) {
        console.warn(`[Gemini-API] ⚠️ ${model} rate limited (429) — fallback...`);
        continue;
      }
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        const errMsg = error.error?.message || `HTTP ${response.status}`;
        if (i < GEMINI_MODELS.length - 1 && response.status >= 500) {
          console.warn(`[Gemini-API] ⚠️ ${model} server error — fallback...`);
          continue;
        }
        throw new Error(errMsg);
      }
      
      const data = await response.json();
      if (model !== GEMINI_MODELS[0]) console.log(`[Gemini-API] ✅ Success with fallback: ${model}`);
      return data;
    } catch (err) {
      if (i < GEMINI_MODELS.length - 1 && (err.message.includes('429') || err.message.includes('rate') || err.message.includes('quota') || err.message.includes('Resource has been exhausted'))) {
        console.warn(`[Gemini-API] ⚠️ ${model} error: ${err.message} — fallback...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่');
}

export async function callOpenAI(apiKey, userMessage) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: ADAPTIVE_VIDEO_DIRECTOR_PROMPT },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 16000,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API Error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function callGoogleAI(apiKey, userMessage) {
  const data = await fetchGeminiWithFallbackAPI(apiKey, {
    contents: [{
      parts: [{ text: ADAPTIVE_VIDEO_DIRECTOR_PROMPT + '\n\n---\n\nUser Input: ' + userMessage }]
    }]
  }, 16000, 0.7);
  return data.candidates[0].content.parts[0].text;
}

export async function generateScript(provider, apiKey, userMessage) {
  if (provider === 'openai') {
    return await callOpenAI(apiKey, userMessage);
  } else if (provider === 'google') {
    return await callGoogleAI(apiKey, userMessage);
  }
  throw new Error('Unknown provider');
}
