class ClaudeProvider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.anthropic.com/v1/messages';
  }

  async chat({ system, message, temperature = 0.5 }) {
    const body = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: message }],
      temperature,
    };

    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Claude API error ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const content = data.content.map(c => c.text).join('');
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    return { content, tokensUsed };
  }
}

module.exports = ClaudeProvider;
