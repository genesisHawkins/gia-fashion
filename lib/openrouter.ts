// Amazon Nova 2 Lite - Free model
export const AI_MODEL = "amazon/nova-2-lite-v1:free"

export async function callOpenRouter(messages: any[], options: {
  maxTokens?: number
  temperature?: number
  responseFormat?: { type: string }
} = {}) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      'X-Title': 'Gia Fashion AI',
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.7,
      ...(options.responseFormat && { response_format: options.responseFormat }),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${errorText}`)
  }

  return response.json()
}
