-- Create brand context for No Label Barber client
-- Run this in Supabase SQL Editor

-- First, check what brand data exists
SELECT id, name, ai_tier, claude_model FROM clients WHERE name ILIKE '%no label%';

-- Check if brand_profiles table exists and has data for this client
SELECT * FROM brand_profiles WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- If no brand profile exists, create one based on the brief
INSERT INTO brand_profiles (
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
  post_length_pref,
  optimal_hashtag_count
) VALUES (
  '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f',
  'No Label Barber',
  'Barber/Beauty',
  'Dublin, Ireland',
  'Men 25-45, city workers',
  'Friendly, professional, fun',
  'Approachable expert',
  'Book your shave today',
  ARRAY['#NoLabelBarber', '#DublinBarber', '#MensGrooming', '#ShaveSpecial'],
  'moderate',
  'short',
  4
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
  optimal_hashtag_count = EXCLUDED.optimal_hashtag_count,
  updated_at = NOW();

-- Verify it was created
SELECT * FROM brand_profiles WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';
