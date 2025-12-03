import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { callOpenRouter } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      height_cm,
      bust_cm,
      waist_cm,
      hip_cm,
      weight_kg,
      photo_front_url,
      photo_side_url,
      photo_face_url,
    } = body

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Calculate body ratios for analysis
    const bustWaistRatio = bust_cm / waist_cm
    const hipWaistRatio = hip_cm / waist_cm
    const bustHipRatio = bust_cm / hip_cm

    // Build comprehensive AI prompt with hybrid analysis
    const analysisPrompt = `You are a Technical Tailor and Expert Stylist. You have TWO sources of truth that you MUST cross-reference:

1. **THE MEASURING TAPE (User Data)**: Exact proportions and height
2. **THE CLINICAL EYE (Photos)**: Visual volume, posture, face shape, and coloring

**USER MEASUREMENTS:**
- Height: ${height_cm} cm ${height_cm < 160 ? '(PETITE)' : height_cm > 170 ? '(TALL)' : '(REGULAR)'}
- Bust: ${bust_cm} cm
- Waist: ${waist_cm} cm
- Hip: ${hip_cm} cm
${weight_kg ? `- Weight: ${weight_kg} kg` : ''}

**MATHEMATICAL RATIOS:**
- Bust/Waist: ${bustWaistRatio.toFixed(2)}
- Hip/Waist: ${hipWaistRatio.toFixed(2)}
- Bust/Hip: ${bustHipRatio.toFixed(2)}

**PHOTOS PROVIDED:**
1. Full body front view (for width distribution)
2. Full body side profile (for depth/volume)
3. Face close-up (for face shape and coloring)

---

**MANDATORY HYBRID ANALYSIS ALGORITHM:**

**STEP 1: READ THE MEASUREMENTS (Mathematical Skeleton)**
Before looking at photos, analyze the numerical inputs:
- Calculate proportions: Are shoulders > hips? Is waist < hips by more than 25cm?
- Define "Theoretical Body Type" based purely on the math
- Note the height category (Petite/Regular/Tall) for clothing recommendations

**STEP 2: ANALYZE THE PHOTOS (Visual Validation)**
Now look at the 3 photos to confirm volume distribution and posture:
- Does the visual match what the numbers say?
- USE CASE: Sometimes measurements say "Rectangle" but the photo shows soft curves. Detect this.
- Use HEIGHT to determine if Petite (<160cm), Regular, or Tall (>170cm) and adjust clothing advice
  - Example: "Avoid midi cuts if petite"

**STEP 3: SYNTHESIS (The Verdict)**
The final result must be a combination of BOTH:
- **If there's conflict:** If measurements say one thing and photo shows another, prioritize the PHOTO for body type (since clothes dress visual volume), but use MEASUREMENTS for sizing and fit recommendations

**EXAMPLE OF EXPECTED REASONING:**
"User entered shoulders 90cm and hips 110cm (Mathematically Pear/Triangle). In front photo, I confirm hips are the widest point. In side profile, I see little glute volume.
→ FINAL DIAGNOSIS: Pear body with lateral volume
→ RECOMMENDATION: A-line skirts (per measurements) but with back pockets (per flat profile photo)"

---

**YOUR TASK:**
Cross-reference measurements and photos to determine:

1. **BODY TYPE (Morphology) - HYBRID ANALYSIS REQUIRED**
   - First, calculate theoretical type from measurements
   - Then, validate with photos (front + side profile)
   - If conflict exists, explain why and which source you prioritized
   - Classify as: Hourglass, Pear, Apple, Rectangle, or Inverted Triangle
   - Provide technical description mentioning BOTH measurements and visual observations
   - List 5 specific clothing items that FLATTER (consider height: ${height_cm}cm)
   - List 5 specific clothing items to AVOID (consider height: ${height_cm}cm)
   - IMPORTANT: If petite (<160cm), avoid overwhelming volumes. If tall (>170cm), avoid cropped cuts.

2. **FACE SHAPE (Visagismo) - PHOTO ANALYSIS**
   - Analyze face photo for bone structure
   - Classify as: Oval, Round, Square, Heart, or Diamond
   - Provide brief technical description
   - Recommend 3 hairstyle types that balance face shape
   - Recommend 3 accessory/earring types
   - Provide specific makeup contouring tips

3. **COLOR ANALYSIS (Colorimetry) - PHOTO ANALYSIS**
   - Analyze skin undertone, eye color, and natural hair color from face photo
   - Determine seasonal color type: Spring, Summer, Autumn, or Winter
   - Specify subtype (e.g., "Deep Winter", "Warm Spring")
   - Provide 5 power colors (as hex codes) that enhance natural coloring
   - Provide 3 colors to avoid (as hex codes) that wash out or clash

**OUTPUT FORMAT (JSON only, no extra text):**
{
  "body_type": "hourglass|pear|apple|rectangle|inverted_triangle",
  "body_type_description": "Technical description that mentions BOTH what measurements show AND what photos confirm. Example: 'Measurements show pear proportions (hips 20cm wider than bust). Photos confirm this with visible hip width in front view and moderate depth in profile. Height of ${height_cm}cm is ${height_cm < 160 ? 'petite' : height_cm > 170 ? 'tall' : 'regular'}, which affects clothing proportions.'",
  "recommended_clothing": [
    "High-waisted wide-leg pants (elongate petite frame)" or "Midi skirts (perfect for tall stature)",
    "Wrap dresses (emphasize waist per measurements)",
    "Structured blazers (balance shoulders per photo analysis)",
    "A-line skirts (flatter hip width from measurements)",
    "V-neck tops (create vertical line for height)"
  ],
  "avoid_clothing": [
    "Low-rise pants (emphasize hip width from measurements)",
    "Boxy oversized tops (hide waist definition)",
    "Horizontal stripes at hips (widen visual per photos)",
    "Ankle-length pants (cut petite frame)" or "Cropped jackets (shorten tall frame)",
    "Tight pencil skirts (emphasize hip-to-waist ratio)"
  ],
  "face_shape": "oval|round|square|heart|diamond",
  "face_shape_description": "Description based on face photo analysis",
  "recommended_hairstyles": [
    "Long layers with side part",
    "Soft waves past shoulders",
    "Shoulder-length bob with texture"
  ],
  "recommended_accessories": [
    "Long drop earrings (elongate face shape)",
    "Delicate layered necklaces",
    "Cat-eye or oversized sunglasses"
  ],
  "makeup_tips": "Specific contouring advice based on face shape from photo. Example: 'Contour along jawline to soften square shape. Highlight cheekbones and center of forehead.'",
  "color_season": "spring|summer|autumn|winter",
  "color_season_subtype": "Deep Winter|Cool Winter|Warm Spring|etc.",
  "power_colors": ["#2C3E50", "#8B4513", "#4A90E2", "#E74C3C", "#27AE60"],
  "avoid_colors": ["#FFD700", "#FF69B4", "#00CED1"]
}

**CRITICAL REMINDERS:**
- NEVER ignore the measurements the user took time to enter
- ALWAYS cross-reference numbers with photos
- If there's a conflict, explain your reasoning in body_type_description
- Consider height (${height_cm}cm) for ALL clothing recommendations
- Be specific and practical. Focus on actionable advice.`

    // Call OpenRouter API with vision model
    const openRouterMessages = [
      {
        role: 'user',
        content: [
          { type: 'text', text: analysisPrompt },
          { type: 'image_url', image_url: { url: photo_front_url } },
          { type: 'image_url', image_url: { url: photo_side_url } },
          { type: 'image_url', image_url: { url: photo_face_url } }
        ]
      }
    ]

    const data = await callOpenRouter(openRouterMessages, {
      maxTokens: 1500,
      temperature: 0.7,
      responseFormat: { type: 'json_object' }
    })

    console.log('OpenRouter raw response:', data.choices[0].message.content)
    
    const analysisResult = JSON.parse(data.choices[0].message.content || '{}')
    console.log('Parsed analysis result:', analysisResult)

    // Save to database (upsert with conflict resolution on user_id)
    const { error: dbError } = await supabase
      .from('style_diagnosis')
      .upsert({
        user_id: user.id,
        height_cm,
        bust_cm,
        waist_cm,
        hip_cm,
        weight_kg,
        photo_front_url,
        photo_side_url,
        photo_face_url,
        body_type: analysisResult.body_type,
        body_type_description: analysisResult.body_type_description,
        recommended_clothing: analysisResult.recommended_clothing,
        avoid_clothing: analysisResult.avoid_clothing,
        face_shape: analysisResult.face_shape,
        face_shape_description: analysisResult.face_shape_description,
        recommended_hairstyles: analysisResult.recommended_hairstyles,
        recommended_accessories: analysisResult.recommended_accessories,
        makeup_tips: analysisResult.makeup_tips,
        color_season: analysisResult.color_season,
        color_season_subtype: analysisResult.color_season_subtype,
        power_colors: analysisResult.power_colors,
        avoid_colors: analysisResult.avoid_colors,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      console.error('Database error details:', JSON.stringify(dbError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to save diagnosis',
        details: dbError.message,
        code: dbError.code 
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, diagnosis: analysisResult })
  } catch (error) {
    console.error('Style diagnosis error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
