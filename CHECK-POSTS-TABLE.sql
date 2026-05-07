-- Check posts table and RLS policies
-- Run this in Supabase SQL Editor

-- 1. Check if posts table exists and has ai_tier column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'posts' 
ORDER BY ordinal_position;

-- 2. Check RLS policies on posts table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'posts';

-- 3. Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'posts';

-- 4. Test insert with service role
INSERT INTO posts (client_id, image_url, caption_text, caption_style, caption_length, hashtag_count, hashtags, emoji_count, emojis_used, submission_id)
VALUES (
  '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f',
  'https://example.com/test.jpg',
  'Test caption',
  'test',
  2,
  1,
  ARRAY['#test'],
  0,
  ARRAY[]::text[],
  (SELECT id FROM submissions LIMIT 1)
)
RETURNING id;

-- 5. If insert fails, check error
-- The error message will tell us what's wrong
