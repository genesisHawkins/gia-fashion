import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildAnalysisPrompt } from '@/lib/ai-prompt'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting analysis ===')
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('API Key prefix:', process.env.OPENAI_API_KEY?.substring(0, 10))
    
    const formData = await request.formData()
    const image = formData.get('image') as File
    const occasion = formData.get('occasion') as string
    const wardrobeContext = formData.get('wardrobeContext') as string | null

    console.log('Image received:', image?.name, image?.type, image?.size)
    console.log('Occasion:', occasion)
    console.log('Wardrobe context:', wardrobeContext ? 'Yes' : 'No')

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Get current user from cookie
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // For now, we'll skip auth check and use a test user ID
    // In production, you'd want proper auth
    const testUserId = 'test-user-' + Date.now()

    // Get auth token for storage upload
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    // Create authenticated client for storage
    const storageClient = token ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    ) : supabaseClient

    // Upload image to Supabase Storage
    const fileName = `${testUserId}/${Date.now()}-${image.name}`
    const { error: uploadError } = await storageClient.storage
      .from('outfit-images')
      .upload(fileName, image)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Continue even if upload fails, we can still analyze
    } else {
      console.log('✅ Image uploaded successfully:', fileName)
    }

    // Get public URL
    const { data: { publicUrl } } = storageClient.storage
      .from('outfit-images')
      .getPublicUrl(fileName)
    
    console.log('Public URL:', publicUrl)

    // Convert image to base64 for OpenAI
    console.log('Converting image to base64...')
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageDataUrl = `data:${image.type};base64,${base64Image}`
    console.log('Image converted, size:', base64Image.length)

    // Call OpenRouter API with Grok
    console.log('Calling OpenRouter API...')
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
                text: buildAnalysisPrompt(occasion, wardrobeContext || undefined),
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
        max_tokens: 1000,
      }),
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error('OpenRouter error:', errorData)
      return NextResponse.json({ 
        error: 'AI analysis failed', 
        details: errorData 
      }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenRouter response:', openaiData)
    
    const analysisText = openaiData.choices[0].message.content
    
    // Parse JSON response from AI
    let analysis
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      const jsonText = jsonMatch ? jsonMatch[0] : analysisText
      analysis = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', analysisText)
      // Return a default analysis if parsing fails
      analysis = {
        score: 7,
        critique: analysisText,
        body_type_analysis: 'Analysis in progress',
        missing_item_suggestion: null,
        color_harmony: 'Analysis in progress'
      }
    }

    // Extract shopping suggestions from the response
    // IMPORTANT: Only extract the FIRST recommendation when multiple items are mentioned
    const clothingPatterns = [
      // Action verbs with items - captures "swap/change X for Y" patterns
      /(?:swap|change|replace)\s+(?:the|those|your)?\s*([a-z\s-]+(?:shirt|top|blouse|sweater|cardigan|pants|jeans|skirt|dress|shoes|sneakers|heels|boots|flats|sandals|jacket|blazer|coat))\s+for\s+(?:a|an|some)?\s*([a-z\s-]+(?:shirt|top|blouse|sweater|cardigan|pants|jeans|skirt|dress|shoes|sneakers|heels|boots|flats|sandals|jacket|blazer|coat|one))/gi,
      // Specific items with descriptors
      /(?:try|wear|add|get|use|pair with|go for|opt for|choose)\s+(?:a|an|some|the)?\s*([a-z\s-]+(?:blazer|jacket|shoes|heels|flats|sandals|boots|belt|pants|skirt|dress|top|shirt|blouse|sweater|cardigan|coat|jeans|trousers|bag|purse|scarf|hat|necklace|earrings|bracelet|accessories))/gi,
      // Direct mentions with adjectives
      /(?:nude|black|white|red|blue|navy|beige|brown|leather|structured|fitted|wide|slim|high-waisted|cropped|long|short|midi|maxi|ankle|knee|pointed|round|square|metallic|gold|silver|strappy)\s+([a-z\s-]+(?:blazer|jacket|shoes|heels|flats|sandals|boots|belt|pants|skirt|dress|top|shirt|blouse|sweater|cardigan|coat|jeans|trousers|bag|purse|scarf|hat|necklace|earrings|bracelet))/gi
    ]
    
    let shoppingQuery = null
    
    // Try to find the FIRST recommendation only
    for (const pattern of clothingPatterns) {
      const matches = Array.from(analysisText.matchAll(pattern))
      if (matches.length > 0) {
        const match = matches[0] as RegExpMatchArray // Take only the first match
        
        // For "swap X for Y" pattern, use the Y (what to get)
        if (match[2]) {
          shoppingQuery = match[2]
            .replace(/one|a |an |some |the /gi, '')
            .replace(/[.,!?()]/g, '')
            .trim()
          console.log('Shopping query detected (swap pattern):', shoppingQuery)
          break
        } else if (match[1]) {
          // For other patterns, clean up the matched text
          shoppingQuery = match[0]
            .replace(/try|wear|add|get|use|pair with|go for|opt for|choose|swap|change|replace|for|a |an |some |the /gi, '')
            .replace(/[.,!?()]/g, '')
            .trim()
          console.log('Shopping query detected:', shoppingQuery)
          break
        }
      }
    }
    
    // If no specific pattern matched, look for general clothing keywords (first occurrence only)
    if (!shoppingQuery) {
      const clothingKeywords = ['blazer', 'jacket', 'shirt', 'top', 'blouse', 'sweater', 'shoes', 'heels', 'boots', 'belt', 'pants', 'skirt', 'dress', 'cardigan', 'coat', 'jeans', 'sandals', 'flats', 'bag', 'scarf', 'necklace', 'earrings']
      const lowerResponse = analysisText.toLowerCase()
      
      for (const keyword of clothingKeywords) {
        const keywordIndex = lowerResponse.indexOf(keyword)
        if (keywordIndex !== -1) {
          const words = analysisText.split(' ')
          const wordIndex = words.findIndex((w: string) => w.toLowerCase().includes(keyword))
          if (wordIndex !== -1) {
            const start = Math.max(0, wordIndex - 2)
            const end = Math.min(words.length, wordIndex + 3)
            shoppingQuery = words.slice(start, end).join(' ').replace(/[.,!?]/g, '').trim()
            console.log('Shopping query detected (fallback):', shoppingQuery)
            break
          }
        }
      }
    }
    
    // Use suggested_item_search from AI if available, otherwise use extracted query
    analysis.shopping_query = analysis.suggested_item_search || shoppingQuery

    // Save to database with user's auth token
    try {
      console.log('=== SAVING TO DATABASE ===')
      
      // Get auth token from request header
      const authHeader = request.headers.get('authorization')
      const token = authHeader?.replace('Bearer ', '')
      
      console.log('Auth token present:', !!token)
      
      if (token) {
        // Create a Supabase client with the user's token (this bypasses RLS issues)
        const userSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        )
        
        const { data: { user } } = await userSupabase.auth.getUser()
        
        if (user) {
          console.log('✅ Real user found:', user.id)
          
          const dataToInsert = {
            user_id: user.id,
            outfit_image_url: publicUrl,
            occasion,
            ai_score: analysis.score || 7,
            ai_critique: analysis.analysis || analysis.critique || 'Analysis completed',
            body_type_analysis: analysis.body_type_analysis || (analysis.tips ? analysis.tips.join(', ') : ''),
            missing_item_suggestion: analysis.missing_item_suggestion || null,
            suggested_wardrobe_items: [],
            amazon_search_query: analysis.missing_item_suggestion || null,
          }
          
          console.log('Inserting into outfit_logs...')
          
          const { data: insertedData, error: dbError } = await userSupabase
            .from('outfit_logs')
            .insert(dataToInsert)
            .select()

          if (dbError) {
            console.error('❌ Database error:', dbError)
          } else {
            console.log('✅ Analysis saved to outfit_logs successfully!', insertedData)
          }
        } else {
          console.log('⚠️ No user found from token')
        }
      } else {
        console.log('⚠️ No auth token, skipping database save')
      }
    } catch (saveError) {
      console.error('❌ Error saving to database:', saveError)
      // Continue even if save fails
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
