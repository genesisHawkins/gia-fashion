-- Tabla para el Diagnóstico de Estilo Permanente
CREATE TABLE IF NOT EXISTS public.style_diagnosis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Datos manuales del usuario
  height_cm INTEGER,
  bust_cm INTEGER,
  waist_cm INTEGER,
  hip_cm INTEGER,
  weight_kg INTEGER,
  
  -- URLs de las fotos de análisis
  photo_front_url TEXT,
  photo_side_url TEXT,
  photo_face_url TEXT,
  
  -- SECCIÓN A: MORFOLOGÍA (Tipo de cuerpo)
  body_type TEXT, -- 'hourglass', 'pear', 'apple', 'rectangle', 'inverted_triangle'
  body_type_description TEXT,
  recommended_clothing JSONB, -- Array de prendas recomendadas
  avoid_clothing JSONB, -- Array de prendas a evitar
  
  -- SECCIÓN B: VISAGISMO (Rostro)
  face_shape TEXT, -- 'oval', 'round', 'square', 'heart', 'diamond'
  face_shape_description TEXT,
  recommended_hairstyles TEXT[],
  recommended_accessories TEXT[],
  makeup_tips TEXT,
  
  -- SECCIÓN C: COLORIMETRÍA
  color_season TEXT, -- 'spring', 'summer', 'autumn', 'winter'
  color_season_subtype TEXT, -- 'deep_winter', 'cool_winter', etc.
  power_colors TEXT[], -- Array de colores hex que le favorecen
  avoid_colors TEXT[], -- Array de colores hex a evitar
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsqueda rápida por usuario
CREATE INDEX IF NOT EXISTS idx_style_diagnosis_user ON public.style_diagnosis(user_id);

-- RLS
ALTER TABLE public.style_diagnosis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own style diagnosis" ON public.style_diagnosis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style diagnosis" ON public.style_diagnosis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style diagnosis" ON public.style_diagnosis
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket para fotos de diagnóstico
INSERT INTO storage.buckets (id, name, public) 
VALUES ('diagnosis-photos', 'diagnosis-photos', true)
ON CONFLICT DO NOTHING;

-- Políticas de storage para diagnóstico
CREATE POLICY "Users can upload own diagnosis photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'diagnosis-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own diagnosis photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'diagnosis-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
