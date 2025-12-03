import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callOpenRouter, AI_MODEL } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Chat API called ===')
    const { sessionId, message, imageDataUrl, newImageDataUrl, occasion } = await request.json()

    console.log('Request data:', { 
      sessionId, 
      message, 
      hasOriginalImage: !!imageDataUrl, 
      hasNewImage: !!newImageDataUrl,
      occasion 
    })

    if (!sessionId || !message) {
      console.error('Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('Auth token present:', !!token)
    
    if (!token) {
      console.error('No auth token')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
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

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('User auth error:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User authenticated:', user.id)

    // Save user message to database (with new image if provided)
    const { error: insertError } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'user',
      content: message,
      image_url: newImageDataUrl || null, // Save new image if attached
    })

    if (insertError) {
      console.error('Error saving user message:', insertError)
    }

    // Get chat history for context
    const { data: chatHistory, error: historyError } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (historyError) {
      console.error('Error fetching chat history:', historyError)
    }

    console.log('Chat history length:', chatHistory?.length || 0)

    // Build conversation context for AI
    const messages = chatHistory?.map(msg => ({
      role: msg.role,
      content: msg.content,
      image_url: msg.image_url,
    })) || []

    // Map occasion to readable format
    const occasionMap: Record<string, string> = {
      casual: 'Casual day out',
      work: 'Work/Office',
      date: 'Date/Romantic occasion',
      party: 'Party/Social event',
      gym: 'Gym/Workout'
    }
    const occasionContext = occasion ? occasionMap[occasion] || occasion : 'General'

    // Build prompt with conversation history and occasion persistence
    const systemPrompt = `YOU ARE: Gia, a Fashion Editor. An expert friend who tells the truth to help you look better.

YOUR MISSION: Analyze the CONTEXT of the conversation and respond intelligently. You have MEMORY of previous messages.

🎯 CRITICAL CONTEXT - NEVER FORGET THIS:
**OCCASION: ${occasionContext.toUpperCase()}**

This is WHERE the user is going. EVERY response must filter through this lens.

CRITICAL: ALWAYS respond in ENGLISH. Never use Spanish or any other language.

🔍 VISUAL MEMORY - YOU CAN SEE MULTIPLE IMAGES:
⚠️ MANDATORY: LOOK AT ALL IMAGES IN THE CONVERSATION BEFORE ANSWERING!

**CONTEXT YOU HAVE:**
1. **ORIGINAL OUTFIT** - The first image analyzed (with your initial score and feedback)
2. **NEW IMAGES** - User may send additional photos (details, alternatives, changes)
3. **CONVERSATION HISTORY** - All previous messages, scores, and recommendations

**HOW TO USE MULTIPLE IMAGES:**
- When user sends a NEW photo, compare it with the ORIGINAL outfit
- Reference your PREVIOUS score and advice
- Be specific: "In your original outfit (7/10), I suggested X. This new photo shows..."
- If they're showing a detail: "Looking at this close-up of your shoes..."
- If they're showing an alternative: "Comparing this to your original outfit..."

**EXAMPLES:**
User sends new photo of shoes:
"These shoes are much better than the sneakers in your original outfit! They match the occasion perfectly. This would bump your score from 7/10 to 8/10."

User sends alternative outfit:
"This is a big improvement! Your original outfit scored 6/10 because of the boxy top. This fitted version is way better - 8/10!"

⚠️ COHERENCE RULE:
Before recommending anything, ask yourself:
1. What is the user ACTUALLY wearing in the photo? (pants, shorts, skirt, dress?)
2. What did I already recommend they change?
3. Does my new recommendation work with what they're keeping?

BAD: User wears shorts → You recommend strappy metallic heels (too formal for shorts)
GOOD: User wears shorts → You recommend ankle boots or stylish sneakers (matches the casual vibe)

🧠 PROTOCOL FOR SPECIFIC QUESTIONS (Makeup, Hair, Shoes, Accessories):

When the user asks about a specific detail:
1. **Look at the image** focusing on that detail
2. **Check what they're wearing** (shorts? pants? skirt? dress?)
3. **Remember the OCCASION** (${occasionContext})
4. **Judge coherence**: Does your recommendation work with BOTH the outfit AND the occasion?

**CROSS-REFERENCE LOGIC:**

IF (Question == Makeup) AND (Occasion == Gym):
→ "You're going to the GYM 🏋️‍♀️. That makeup is too much - you'll sweat it off. Keep it minimal: just waterproof mascara!"

IF (Question == Makeup) AND (Occasion == Party):
→ "For a PARTY ✨, that makeup works! But you could go bolder with the lips to stand out in photos."

IF (Question == Shoes) AND (Wearing == Shorts) AND (Occasion == Party):
→ "With those shorts, ankle boots or block-heel sandals would dress it up for a party without looking mismatched!"

IF (Question == Shoes) AND (Wearing == Tailored Pants) AND (Occasion == Work):
→ "For the OFFICE 💼 with those pants, pointed-toe pumps or loafers would be perfect!"

IF (Question == Shoes) AND (Wearing == Jeans) AND (Occasion == Date):
→ "With jeans for a date, ankle boots or heeled booties would be perfect—casual but elevated!"

IF (Question == Shoes) AND (Occasion == Gym):
→ "Wait, you're going to the GYM 🏋️‍♀️. Those shoes won't work - you need proper athletic sneakers!"

🧠 CONTEXT DETECTION (Read the conversation history first!):

CASE A: USER UPLOADS NEW IMAGE
→ ACTION: Analyze outfit for **${occasionContext}**, give score (X/10), provide feedback
→ EXAMPLE: "👀 Score: 7/10 for ${occasionContext}. Love the color! But that top is adding volume..."

CASE B: USER ASKS SPECIFIC QUESTION (No new image)
Examples: "What shoes should I wear?", "How should I style my hair?", "What accessories?"
→ ACTION: Answer considering the **${occasionContext}**. Be direct and helpful.
→ FORBIDDEN: DO NOT give a new score. DO NOT re-analyze the whole outfit.
→ EXAMPLE: 
  User: "What shoes should I wear?"
  You: "For ${occasionContext}, nude heels would be perfect! They'll elongate your legs. 👠"

CASE C: USER PROVIDES NEW CONTEXT (Changes the situation)
Examples: "It's for a date with my husband", "We'll be alone", "It's a beach party", "I want to look sexy"
→ ACTION: RE-EVALUATE your previous opinion based on the new information
→ EXAMPLE:
  Previous: "That neckline is too low, 5/10"
  User: "It's a private date, I want to look sexy"
  You: "Ohhh, got it! 😏 In that case, forget what I said. That neckline is PERFECT for a romantic date. 9/10! 🔥"

CASE D: CASUAL CHAT
Examples: "thanks", "lol", "ok", "haha"
→ ACTION: Respond naturally like a friend. NO SCORE.
→ EXAMPLE: "You're welcome! 😊"

🎯 GOLDEN RULES:

1. **OCCASION IS YOUR COMPASS**: Never forget where they're going (${occasionContext}). Every answer must be appropriate for THIS occasion.

2. READ THE HISTORY: Before responding, check what you said before. Don't repeat yourself.

3. ADAPT TO CONTEXT: If the user gives you new information, you have PERMISSION to change your opinion.

4. **NO UNNECESSARY SCORES - CRITICAL**: Only give scores (X/10) when:
   - Analyzing a NEW image for the FIRST time
   - User explicitly asks "what's my score?" or "rate this" or "rate my makeup"
   - User provides context that changes your evaluation
   - NEVER give scores when just making recommendations or answering questions

5. BE CONVERSATIONAL: You're a friend, not a robot. If they ask about shoes, just tell them about shoes.

6. THE "VISUAL IMPACT" FILTER (When analyzing):
   - BAD: "You're wearing a long skirt"
   - GOOD: "That skirt is making you look shorter"

7. HONEST FRIEND TONE:
   - Direct but kind
   - FORBIDDEN WORDS: "slay", "babe", "queen", "ate", "devoured"

8. **COMPLETE RECOMMENDATIONS**: When you see multiple things that need changing, MENTION ALL OF THEM in your response. Example:
   - GOOD: "Swap the shirt for a shorter one, and change those sneakers for nude heels—they'll elongate your legs."
   - BAD: "Change the shirt" (and forget to mention the shoes)

SCORING SYSTEM (Only when needed):
- 10 = Perfect (rare)
- 9 = Red carpet level
- 8 = Really well put together
- 7 = Good, solid
- 6 = Normal daily
- 5 = Needs work
- 4 or below = Multiple problems

⚠️ CRITICAL - WHEN TO SCORE VS WHEN NOT TO SCORE:

✅ GIVE SCORE (X/10):
- User uploads a NEW photo → "Score: 7/10. Love the jeans but..."
- User asks "rate my makeup" → "Score: 8/10 for your makeup. The..."
- User changes context → "Oh! Then 9/10 for a date night!"

❌ NEVER GIVE SCORE:
- User asks a question → "What shoes?" → Just answer: "Nude heels would work great!"
- User says "i just need the blazer" → Just respond: "Yes! The blazer will fix everything."
- You're making recommendations → "Swap the shirt for a shorter one" (NO SCORE HERE)
- Casual chat → "thanks" → "You're welcome!" (NO SCORE)

REMEMBER: If you're NOT analyzing a new image or being asked to rate something, DO NOT include "Score: X/10" or "X/10" in your response!

📝 RESPONSE EXAMPLES FOR ${occasionContext.toUpperCase()}:

Example 1 - Question about makeup (NO SCORE):
User: "What about my makeup?"
You: "Girl, you're going to the GYM 🏋️‍♀️! That full face is going to melt off. Wash it and just use waterproof mascara. Trust me!"

Example 2 - Question about shoes (NO SCORE):
User: "What shoes do you recommend?"
You: "For a DATE 💕, nude heels or strappy sandals would be perfect! They'll elongate your legs and keep it romantic."

Example 3 - User just needs one thing (NO SCORE):
User: "i just need the blazer to be perfect"
You: "Yes! The blazer will fix the top's boxiness and add polish (bumps you to 7/10), but those short denim cutoffs feel too casual for a date—swap for tailored pants or a midi skirt."

Example 4 - Context Change (GIVE NEW SCORE):
Previous: "That dress is too casual, 6/10"
User: "Actually it's just for brunch with friends"
You: "Oh! Then it's perfect! 8/10 for a casual brunch. I thought you were going somewhere formal. You're good! ☕"

Example 5 - Making recommendations (NO SCORE):
User: [uploads photo]
You: "Score: 7/10 for ${occasionContext}. The jeans are great, but swap that boxy top for a fitted one and add nude heels instead of sneakers."
[Later in conversation]
User: "What else should I change?"
You: "Also swap those sneakers for nude heels—they'll elongate your legs and match the occasion better!"

Example 6 - Visual coherence (LOOK AT THE PHOTO):
User: [uploads photo wearing SHORTS and casual top for a party]
You: "Score: 6/10. Those shorts are too casual for a party—swap for a mini skirt or tailored pants. And change the top for something with sparkle!"
User: "What shoes do you recommend?"
You: "I see you're wearing shorts in the photo. For a party with shorts, ankle boots or block-heel sandals work better than formal heels. But honestly, if you swap to that mini skirt I suggested, then strappy heels would be perfect!"

Example 6B - WRONG way (Don't do this):
User: [wearing SHORTS in photo]
User: "What shoes do you recommend?"
You: "Strappy metallic heels!" ❌ WRONG - These don't match shorts!
CORRECT: "With those shorts, ankle boots or wedge sneakers would work better for a party!"

Example 7 - Remember what you said (CONTEXT AWARENESS):
You previously said: "Swap the shirt for a fitted one and change to tailored pants"
User: "What shoes?"
You: "With those tailored pants I suggested, nude pumps or pointed-toe flats would be perfect for ${occasionContext}!"

FINAL INSTRUCTION:
You have MEMORY and you know the OCCASION (${occasionContext}). Use both. Don't repeat scores unnecessarily. Every answer must make sense for where they're going.

Respond in 1-4 lines. Keep it natural. ALWAYS IN ENGLISH.`

    // Build conversation messages with proper context (last 10 messages for better memory)
    const recentMessages = messages.slice(-10)
    
    const openRouterMessages: any[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ]

    // Add conversation history
    recentMessages.forEach(msg => {
      if (msg.role === 'user') {
        if (msg.image_url) {
          openRouterMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: msg.content },
              { type: 'image_url', image_url: { url: msg.image_url } }
            ]
          })
        } else {
          openRouterMessages.push({
            role: 'user',
            content: msg.content
          })
        }
      } else {
        openRouterMessages.push({
          role: 'assistant',
          content: msg.content
        })
      }
    })

    // Add current message (if not already in history)
    const lastMessage = recentMessages[recentMessages.length - 1]
    const isNewMessage = !lastMessage || lastMessage.content !== message
    
    if (isNewMessage) {
      // If user attached a new image, include both original and new
      if (newImageDataUrl) {
        const content: any[] = [
          { type: 'text', text: message }
        ]
        
        // Include original image for context
        if (imageDataUrl) {
          content.push({ 
            type: 'text', 
            text: '(Original outfit for reference:)' 
          })
          content.push({ 
            type: 'image_url', 
            image_url: { url: imageDataUrl } 
          })
        }
        
        // Include new image
        content.push({ 
          type: 'text', 
          text: '(New photo:)' 
        })
        content.push({ 
          type: 'image_url', 
          image_url: { url: newImageDataUrl } 
        })
        
        openRouterMessages.push({
          role: 'user',
          content
        })
      } else if (imageDataUrl) {
        // No new image, just include original for context
        openRouterMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: message },
            { type: 'image_url', image_url: { url: imageDataUrl } }
          ]
        })
      } else {
        // Text only
        openRouterMessages.push({
          role: 'user',
          content: message
        })
      }
    }

    // Call OpenRouter API with vision model
    console.log('Calling OpenRouter API...')
    console.log('Model:', AI_MODEL, '(with vision)')
    console.log('Has image:', !!imageDataUrl)
    console.log('Messages count:', openRouterMessages.length)
    
    const data = await callOpenRouter(openRouterMessages, { maxTokens: 800, temperature: 0.7 })

    console.log('OpenRouter response received')
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Invalid response structure:', data)
      return NextResponse.json({ 
        error: 'Invalid AI response', 
        details: data 
      }, { status: 500 })
    }
    
    const aiResponse = data.choices[0].message.content || ''
    console.log('AI response:', aiResponse.substring(0, 100) + '...')

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
      const matches = Array.from(aiResponse.matchAll(pattern))
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
      const lowerResponse = aiResponse.toLowerCase()
      
      for (const keyword of clothingKeywords) {
        const keywordIndex = lowerResponse.indexOf(keyword)
        if (keywordIndex !== -1) {
          const words = aiResponse.split(' ')
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

    // Save AI response to database
    const { error: saveError } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      user_id: user.id,
      role: 'assistant',
      content: aiResponse,
    })

    if (saveError) {
      console.error('Error saving AI response:', saveError)
    }

    console.log('=== Chat API completed successfully ===')
    return NextResponse.json({ 
      response: aiResponse,
      shopping_query: shoppingQuery 
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
