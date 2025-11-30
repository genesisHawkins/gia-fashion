import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl } = await request.json()

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Call OpenRouter API to describe the item in detail
    const openaiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        'X-Title': 'EcoStyle AI',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4.1-fast:free',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a fashion cataloging expert. Describe this clothing item or outfit in EXTREME DETAIL so it can be uniquely identified later.

Include:
- Specific garment types (e.g., "slim-fit button-down shirt", "high-waisted wide-leg trousers")
- Exact colors with descriptors (e.g., "navy blue", "cream white", "burgundy red")
- Fabric/texture if visible (e.g., "cotton", "denim", "knit", "leather")
- Patterns (e.g., "vertical pinstripes", "floral print", "solid")
- Distinctive features (e.g., "gold buttons", "rolled cuffs", "v-neck", "ripped knees")
- Fit/silhouette (e.g., "oversized", "fitted", "cropped")
- Accessories if any (e.g., "black leather belt", "silver hoop earrings")

Format: Write 2-3 sentences as a detailed catalog description.

Example: "Oversized cream-colored cable-knit sweater with a relaxed turtleneck and dropped shoulders. Paired with high-waisted dark wash straight-leg jeans featuring a raw hem. Black leather ankle boots with a chunky heel complete the look."

Be SPECIFIC and DETAILED. This description will be used to identify if this exact item appears in future photos.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 300,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenRouter error:', errorData)
      return NextResponse.json({ error: 'Failed to describe item' }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    const description = openaiData.choices[0].message.content.trim()

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
