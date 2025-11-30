import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type WardrobeItem = {
  id: string
  user_id: string
  image_url: string
  category: string
  color_tags: string[]
  style_tags: string[]
  last_worn_date: string | null
  notes: string | null
  created_at: string
}

export type OutfitLog = {
  id: string
  user_id: string
  outfit_image_url: string
  occasion: string
  ai_score: number
  ai_critique: string
  body_type_analysis: string
  missing_item_suggestion: string | null
  suggested_wardrobe_items: string[]
  amazon_search_query: string | null
  created_at: string
}
