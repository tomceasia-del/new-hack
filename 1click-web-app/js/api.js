(function () {
  function directorPrompt() {
    const p = window.ONECLICK_PROMPT && window.ONECLICK_PROMPT.ADAPTIVE_VIDEO_DIRECTOR_PROMPT;
    if (!p || !String(p).trim()) {
      throw new Error('Prompt template ยังไม่โหลด — รีเฟรชหน้าหรือตรวจสอบว่าโหลด js/promptTemplate.js แล้ว');
    }
    return p;
  }

  const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro'];

  async function fetchGeminiWithFallbackAPI(apiKey, requestBody, maxOutputTokens, temperature) {
    const maxT = maxOutputTokens != null ? maxOutputTokens : 16384;
    const temp = temperature != null ? temperature : 0.7;
    for (let i = 0; i < GEMINI_MODELS.length; i++) {
      const model = GEMINI_MODELS[i];
      try {
        const body = JSON.parse(JSON.stringify(requestBody));
        if (!body.generationConfig) body.generationConfig = {};
        body.generationConfig.maxOutputTokens = maxT;
        body.generationConfig.temperature = temp;
        if (!body.safetySettings) {
          body.safetySettings = [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ];
        }
        const response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(apiKey),
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
        );
        if (response.status === 429) continue;
        if (!response.ok) {
          const error = await response.json().catch(function () { return {}; });
          const errMsg = (error.error && error.error.message) || 'HTTP ' + response.status;
          if (i < GEMINI_MODELS.length - 1 && response.status >= 500) continue;
          throw new Error(errMsg);
        }
        return await response.json();
      } catch (err) {
        if (i < GEMINI_MODELS.length - 1 && (String(err.message).includes('429') || String(err.message).includes('rate') || String(err.message).includes('quota'))) {
          continue;
        }
        throw err;
      }
    }
    throw new Error('All Gemini models rate limited — กรุณารอสักครู่แล้วลองใหม่');
  }

  async function callOpenAI(apiKey, userMessage) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: directorPrompt() },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 16000,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const error = await response.json().catch(function () { return {}; });
      throw new Error((error.error && error.error.message) || 'OpenAI API Error');
    }
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async function callGoogleAI(apiKey, userMessage) {
    const data = await fetchGeminiWithFallbackAPI(
      apiKey,
      {
        contents: [
          {
            parts: [{ text: directorPrompt() + '\n\n---\n\nUser Input: ' + userMessage }]
          }
        ]
      },
      16000,
      0.7
    );
    return data.candidates[0].content.parts[0].text;
  }

  async function generateScript(provider, apiKey, userMessage) {
    if (provider === 'openai') return await callOpenAI(apiKey, userMessage);
    if (provider === 'google') return await callGoogleAI(apiKey, userMessage);
    throw new Error('Unknown provider');
  }

  window.generateScript = generateScript;
})();
