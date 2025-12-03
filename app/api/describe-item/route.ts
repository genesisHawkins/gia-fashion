import { NextRequest, NextResponse } from 'next/server'
import { callOpenRouter } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { imageDataUrl } = await request.json()

    if (!imageDataUrl) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Call OpenRouter API to describe the item in detail
    const data = await callOpenRouter([
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
    ], { maxTokens: 300 })

    const description = data.choices[0].message.content.trim()

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
