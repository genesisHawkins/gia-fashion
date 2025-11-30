-- EcoStyle AI Database Schema
-- Ejecuta esto en el SQL Editor de Supabase

-- Tabla de usuarios (Supabase Auth ya maneja esto, pero podemos extenderla)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de prendas del armario
CREATE TABLE IF NOT EXISTS public.wardrobe_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url TEXT NOT NULL,
  category TEXT, -- 'top', 'bottom', 'shoes', 'accessory', 'dress', 'outerwear'
  color_tags TEXT[], -- ['black', 'white', 'red']
  style_tags TEXT[], -- ['casual', 'formal', 'sporty']
  last_worn_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de análisis de outfits (historial)
CREATE TABLE IF NOT EXISTS public.outfit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  outfit_image_url TEXT NOT NULL,
  occasion TEXT NOT NULL, -- 'date', 'work', 'casual', 'party', 'gym'
  ai_score INTEGER CHECK (ai_score >= 1 AND ai_score <= 10),
  ai_critique TEXT,
  body_type_analysis TEXT,
  missing_item_suggestion TEXT,
  suggested_wardrobe_items UUID[], -- IDs de prendas sugeridas del armario
  amazon_search_query TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_user ON public.wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_outfit_logs_user ON public.outfit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_category ON public.wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_last_worn ON public.wardrobe_items(last_worn_date);

-- Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outfit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad: usuarios solo ven sus propios datos
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own wardrobe" ON public.wardrobe_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe items" ON public.wardrobe_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe items" ON public.wardrobe_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe items" ON public.wardrobe_items
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own outfit logs" ON public.outfit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own outfit logs" ON public.outfit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own outfit logs" ON public.outfit_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Tabla para mensajes de chat con Gia
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_session ON public.chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id);

-- RLS para chat
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage bucket para imágenes
INSERT INTO storage.buckets (id, name, public) 
VALUES ('outfit-images', 'outfit-images', true)
ON CONFLICT DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('wardrobe-images', 'wardrobe-images', true)
ON CONFLICT DO NOTHING;

-- Políticas de storage
CREATE POLICY "Users can upload own outfit images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'outfit-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own wardrobe images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'wardrobe-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view outfit images" ON storage.objects
  FOR SELECT USING (bucket_id = 'outfit-images');

CREATE POLICY "Anyone can view wardrobe images" ON storage.objects
  FOR SELECT USING (bucket_id = 'wardrobe-images');
