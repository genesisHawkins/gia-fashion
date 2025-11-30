import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildAnalysisPrompt } from '@/lib/ai-prompt'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Starting analysis ===')
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY)
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    
    const formData = await request.formData()
    const image = formData.get('image') as File
    const occasion = formData.get('occasion') as string
    const wardrobeContext = formData.get('wardrobeContext') as string | null

    console.log('Image received:', image?.name, image?.type, image?.size)
    console.log('Occasion:', occasion)
    console.log('Wardrobe context:', wardrobeContext ? 'Yes' : 'No')

    if (!image) {
      console.error('No image provided')
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Get auth token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    console.log('Auth token present:', !!token)
    
    // Get user ID for storage path
    let userId = 'anonymous-' + Date.now()
    let publicUrl = ''
    
    if (token) {
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
      
      const { data: { user }, error: userError } = await userSupabase.auth.getUser()
      
      if (user && !userError) {
        userId = user.id
        console.log('User authenticated:', userId)
        
        // Try to upload image to Supabase Storage
        try {
          const fileName = `${userId}/${Date.now()}-${image.name}`
          const { error: uploadError } = await userSupabase.storage
            .from('outfit-images')
            .upload(fileName, image)

          if (uploadError) {
            console.error('Upload error:', uploadError)
            console.log('Continuing without storage upload...')
          } else {
            console.log('✅ Image uploaded successfully:', fileName)
            const { data: { publicUrl: url } } = userSupabase.storage
              .from('outfit-images')
              .getPublicUrl(fileName)
            publicUrl = url
            console.log('Public URL:', publicUrl)
          }
        } catch (storageError) {
          console.error('Storage error:', storageError)
          console.log('Continuing without storage upload...')
        }
      } else {
        console.log('User not authenticated or error:', userError)
      }
    } else {
      console.log('No auth token provided')
    }

    // Convert image to base64 for OpenAI
    console.log('Converting image to base64...')
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageDataUrl = `data:${image.type};base64,${base64Image}`
    console.log('Image converted, size:', base64Image.length)

    // Call OpenRouter API with Grok
    console.log('Calling OpenRouter API...')
    console.log('Model: x-ai/grok-4.1-fast:free')
    console.log('Image data URL length:', imageDataUrl.length)
    
    const openaiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gia-fashion.vercel.app',
        'X-Title': 'Gia Fashion AI',
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
        temperature: 0.7,
      }),
    })

    console.log('OpenRouter response status:', openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenRouter error response:', errorText)
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      console.error('OpenRouter error details:', errorData)
      return NextResponse.json({ 
        error: 'AI analysis failed', 
        details: errorData,
        message: 'Failed to analyze image. Please try again.'
      }, { status: 500 })
    }

    const openaiData = await openaiResponse.json()
    console.log('OpenRouter response received successfully')
    
    if (!openaiData.choices || !openaiData.choices[0]) {
      console.error('Invalid OpenRouter response structure:', openaiData)
      return NextResponse.json({ 
        error: 'Invalid AI response',
        message: 'Received invalid response from AI. Please try again.'
      }, { status: 500 })
    }
    
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

    // ===== DEDICATED AI FORMATTER: ALWAYS converts JSON to clean text =====
    // This ALWAYS runs - no conditions. Takes any output and makes it beautiful.
    
    let rawResponse = analysis.chat_response || analysis.analysis || analysis.critique || analysisText
    
    console.log('🔄 Calling dedicated AI formatter (always runs)...')
    console.log('Raw response preview:', rawResponse.substring(0, 150))
    
    let chatResponse = rawResponse
    
    try {
      // ALWAYS call the AI formatter to ensure clean output
      const formatterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gia-fashion.vercel.app',
          'X-Title': 'Gia Fashion AI',
        },
        body: JSON.stringify({
          model: 'x-ai/grok-4.1-fast:free',
          messages: [
            {
              role: 'system',
              content: `You are a text formatter for a fashion chat app. Your ONLY job:

1. Extract the fashion advice text from whatever input you receive
2. Remove ALL JSON syntax: { } " \\ escape characters
3. Convert \\n to actual line breaks
4. Keep emojis, bold text (**text**), and natural formatting
5. Write in ENGLISH only
6. Return ONLY the clean conversational text - nothing else

If you see JSON, extract the content. If you see clean text, return it as-is.`
            },
            {
              role: 'user',
              content: rawResponse
            }
          ],
          max_tokens: 600,
          temperature: 0.2,
        }),
      })
      
      if (formatterResponse.ok) {
        const formatterData = await formatterResponse.json()
        chatResponse = formatterData.choices[0].message.content.trim()
        console.log('✅ AI formatter succeeded')
        console.log('Formatted preview:', chatResponse.substring(0, 150))
      } else {
        console.log('⚠️ AI formatter failed, using manual cleanup')
        chatResponse = rawResponse
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/^["'\{]+|["'\}]+$/g, '')
          .replace(/.*?"chat_response"\s*:\s*"/, '')
          .replace(/",?\s*"suggested_item_search".*$/, '')
          .trim()
      }
    } catch (error) {
      console.error('❌ AI formatter error:', error)
      // Manual cleanup as last resort
      chatResponse = rawResponse
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/^["'\{]+|["'\}]+$/g, '')
        .trim()
    }
    
    console.log('✅ Final formatted response length:', chatResponse.length)
    
    const formattedAnalysis = {
      score: analysis.score || 7,
      chat_response: chatResponse,
      shopping_query: analysis.shopping_query || analysis.suggested_item_search,
      body_type_analysis: analysis.body_type_analysis,
      color_harmony: analysis.color_harmony,
    }

    console.log('Formatted analysis:', formattedAnalysis)

    // Save to database with user's auth token
    if (token && publicUrl) {
      try {
        console.log('=== SAVING TO DATABASE ===')
        
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
        
        const { data: { user }, error: userError } = await userSupabase.auth.getUser()
        
        if (user && !userError) {
          console.log('✅ Real user found:', user.id)
          
          const dataToInsert = {
            user_id: user.id,
            outfit_image_url: publicUrl,
            occasion,
            ai_score: formattedAnalysis.score,
            ai_critique: formattedAnalysis.chat_response,
            body_type_analysis: formattedAnalysis.body_type_analysis || '',
            missing_item_suggestion: analysis.missing_item_suggestion || null,
            suggested_wardrobe_items: [],
            amazon_search_query: formattedAnalysis.shopping_query || null,
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
          console.log('⚠️ No user found from token:', userError)
        }
      } catch (saveError) {
        console.error('❌ Error saving to database:', saveError)
        // Continue even if save fails
      }
    } else {
      console.log('⚠️ Skipping database save (no token or publicUrl)')
    }

    console.log('=== Analysis completed successfully ===')
    return NextResponse.json({ analysis: formattedAnalysis })
    
  } catch (error) {
    console.error('❌ Fatal error in analyze route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to process image. Please try again.',
      details: errorMessage
    }, { status: 500 })
  }
}
