import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildAnalysisPrompt } from '@/lib/ai-prompt'
import { callOpenRouter, AI_MODEL } from '@/lib/openrouter'

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

    // Call OpenRouter API with Amazon Nova
    console.log('Calling OpenRouter API...')
    console.log('Model:', AI_MODEL)
    console.log('Image data URL length:', imageDataUrl.length)
    
    const data = await callOpenRouter([
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
    ], { maxTokens: 1000, temperature: 0.7 })

    console.log('OpenRouter response received successfully')
    
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid OpenRouter response structure:', data)
      return NextResponse.json({ 
        error: 'Invalid AI response',
        message: 'Received invalid response from AI. Please try again.'
      }, { status: 500 })
    }
    
    const analysisText = data.choices[0].message.content || ''
    
    console.log('✅ First AI returned plain text')
    console.log('Preview:', analysisText.substring(0, 200))
    
    // Extract score from text (e.g., "Score: 7.5/10" or "**Score: 7.5/10**")
    const scoreMatch = analysisText.match(/\*?\*?Score:\s*(\d+(?:\.\d+)?)\s*\/\s*10\*?\*?/i)
    const extractedScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7
    
    console.log('Extracted score:', extractedScore)
    
    // The text IS the analysis - no JSON parsing needed
    const analysis = {
      score: extractedScore,
      chat_response: analysisText,
      critique: analysisText,
      body_type_analysis: '',
      missing_item_suggestion: null,
      color_harmony: '',
      shopping_query: null as string | null,
      suggested_item_search: null as string | null
    }

    // Extract shopping suggestions from the response
    // IMPORTANT: Only extract the FIRST recommendation when multiple items are mentioned
    const clothingPatterns = [
      // Action verbs with items - captures "swap/change X for Y" patterns (PRIORITIZE THIS - it captures recommendations)
      /(?:swap|change|replace|cambia|cambiar)\s+(?:the|those|your|el|la|los|las|tu|tus)?\s*([a-z\sáéíóúñ-]+(?:collar|necklace|earrings|aros|aretes|pendientes|pulsera|bracelet|anillo|ring|shirt|top|blouse|sweater|cardigan|pants|jeans|skirt|dress|shoes|sneakers|heels|boots|flats|sandals|jacket|blazer|coat|abrigo|chaqueta|zapatos|pantalones|falda|vestido))\s+(?:for|por|with|con)\s+(?:a|an|some|unos|unas|un|una)?\s*([a-z\sáéíóúñ-]+(?:collar|necklace|earrings|aros|aretes|pendientes|pulsera|bracelet|anillo|ring|shirt|top|blouse|sweater|cardigan|pants|jeans|skirt|dress|shoes|sneakers|heels|boots|flats|sandals|jacket|blazer|coat|one|abrigo|chaqueta|zapatos|pantalones|falda|vestido))/gi,
      // Specific items with descriptors
      /(?:try|wear|add|get|use|pair with|go for|opt for|choose|intenta|prueba|usa|agrega)\s+(?:a|an|some|the|unos|unas|un|una)?\s*([a-z\sáéíóúñ-]+(?:collar|necklace|earrings|aros|aretes|pendientes|pulsera|bracelet|anillo|ring|blazer|jacket|shoes|heels|flats|sandals|boots|belt|pants|skirt|dress|top|shirt|blouse|sweater|cardigan|coat|jeans|trousers|bag|purse|scarf|hat|accessories|abrigo|chaqueta|zapatos|pantalones|falda|vestido))/gi,
      // Direct mentions with adjectives
      /(?:nude|black|white|red|blue|navy|beige|brown|leather|structured|fitted|wide|slim|high-waisted|cropped|long|short|midi|maxi|ankle|knee|pointed|round|square|metallic|gold|silver|strappy|dorado|plateado|negro|blanco|rojo|azul)\s+([a-z\sáéíóúñ-]+(?:collar|necklace|earrings|aros|aretes|pendientes|pulsera|bracelet|anillo|ring|blazer|jacket|shoes|heels|flats|sandals|boots|belt|pants|skirt|dress|top|shirt|blouse|sweater|cardigan|coat|jeans|trousers|bag|purse|scarf|hat|abrigo|chaqueta|zapatos|pantalones|falda|vestido))/gi
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
            .replace(/one|a |an |some |the |unos |unas |un |una |el |la |los |las /gi, '')
            .replace(/[.,!?()]/g, '')
            .trim()
          console.log('Shopping query detected (swap pattern):', shoppingQuery)
          break
        } else if (match[1]) {
          // For other patterns, clean up the matched text
          shoppingQuery = match[0]
            .replace(/try|wear|add|get|use|pair with|go for|opt for|choose|swap|change|replace|for|por|con|intenta|prueba|usa|agrega|cambia|cambiar|a |an |some |the |unos |unas |un |una |el |la |los |las /gi, '')
            .replace(/[.,!?()]/g, '')
            .trim()
          console.log('Shopping query detected:', shoppingQuery)
          break
        }
      }
    }
    
    // If no specific pattern matched, look for general clothing keywords (first occurrence only)
    if (!shoppingQuery) {
      const clothingKeywords = ['earrings', 'aros', 'aretes', 'necklace', 'collar', 'bracelet', 'pulsera', 'ring', 'anillo', 'blazer', 'jacket', 'shirt', 'top', 'blouse', 'sweater', 'shoes', 'heels', 'boots', 'belt', 'pants', 'skirt', 'dress', 'cardigan', 'coat', 'jeans', 'sandals', 'flats', 'bag', 'scarf']
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

    // The AI already returned clean text - use it directly
    let chatResponse = analysisText
    
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
