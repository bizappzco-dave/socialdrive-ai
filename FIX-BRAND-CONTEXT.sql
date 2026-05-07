-- Create brand context for No Label Barber client
-- Run this in Supabase SQL Editor

INSERT INTO brand_contexts (
  client_id,
  brand_name,
  industry,
  location,
  target_audience,
  tone,
  personality,
  cta,
  hashtags,
  emoji_style,
  post_length_pref
) VALUES (
  '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f',
  'No Label Barber',
  'Barber/Beauty',
  'Dublin, Ireland',
  'Men 25-45, city workers',
  'Friendly, professional, fun',
  'Approachable expert',
  'Book your shave today',
  '["#NoLabelBarber", "#DublinBarber", "#MensGrooming", "#ShaveSpecial"]'::jsonb,
  'moderate',
  'short'
)
ON CONFLICT (client_id) DO UPDATE SET
  brand_name = EXCLUDED.brand_name,
  industry = EXCLUDED.industry,
  location = EXCLUDED.location,
  target_audience = EXCLUDED.target_audience,
  tone = EXCLUDED.tone,
  personality = EXCLUDED.personality,
  cta = EXCLUDED.cta,
  hashtags = EXCLUDED.hashtags,
  emoji_style = EXCLUDED.emoji_style,
  post_length_pref = EXCLUDED.post_length_pref,
  updated_at = NOW();

-- Verify it was created
SELECT * FROM brand_contexts WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';
