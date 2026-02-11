// Vercel serverless function — LLM proxy (Anthropic / Gemini / OpenAI)

// Auto-detect provider from API key prefix
function detectProviderFromKey(key) {
  if (!key) return null;
  if (key.startsWith('AIza')) return 'gemini';
  if (key.startsWith('sk-')) return 'openai';
  return 'claude';
}

async function callLLM({ provider, model, systemPrompt, messages, maxTokens = 1500, temperature = 0.7, userApiKey }) {
  if (!messages || !Array.isArray(messages)) {
    throw new Error('messages array is required');
  }

  // Auto-detect provider from key prefix
  if (userApiKey) {
    const detected = detectProviderFromKey(userApiKey);
    if (detected && detected !== provider) provider = detected;
  }

  if (provider === 'gemini') {
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Gemini API key not available. Add your key in Settings.');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(apiKey);
    const genModel = genAI.getGenerativeModel({
      model: model || 'gemini-2.5-flash',
      systemInstruction: systemPrompt || undefined,
    });

    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

    const result = await genModel.generateContent({
      contents,
      generationConfig: { temperature, maxOutputTokens: maxTokens },
    });

    return result.response.text();

  } else if (provider === 'claude') {
    const apiKey = userApiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('Anthropic API key not available. Add your key in Settings.');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model || 'claude-sonnet-4-5-20250929',
        system: systemPrompt || '',
        messages: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Claude API error: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find(b => b.type === 'text');
    return textBlock?.text || '';

  } else {
    // OpenAI / OpenRouter
    const apiKey = userApiKey || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OpenAI/OpenRouter API key not available. Add your key in Settings.');

    const url = provider === 'openrouter'
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt || '' },
          ...messages.filter(m => m.role !== 'system'),
        ],
        max_tokens: maxTokens,
        temperature,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`API error: ${errBody.slice(0, 300)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { provider, model, systemPrompt, messages, maxTokens, temperature, userApiKey } = req.body;
    const content = await callLLM({ provider, model, systemPrompt, messages, maxTokens, temperature, userApiKey });
    return res.status(200).json({ content });
  } catch (err) {
    console.error('LLM proxy error:', err.message);
    const status = err.message.includes('not available') ? 500 : err.message.includes('API error') ? 502 : 500;
    return res.status(status).json({ error: err.message });
  }
}
