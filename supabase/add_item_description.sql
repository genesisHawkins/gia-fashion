-- Add detailed description field to wardrobe_items
ALTER TABLE public.wardrobe_items 
ADD COLUMN IF NOT EXISTS item_description TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_wardrobe_description ON public.wardrobe_items(item_description);
