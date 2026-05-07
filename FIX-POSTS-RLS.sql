-- Fix RLS policies on posts table to allow service role inserts
-- Run this in Supabase SQL Editor

-- 1. Check current RLS status
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'posts';

-- 2. Drop existing policies that might be blocking service role
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON posts;
DROP POLICY IF EXISTS "Enable insert for service role" ON posts;

-- 3. Create policy that allows service role to do anything
CREATE POLICY "Service role has full access"
ON posts FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 4. Also allow authenticated users to insert their own posts
CREATE POLICY "Users can insert their own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- 5. Allow users to read their own posts
CREATE POLICY "Users can read their own posts"
ON posts FOR SELECT
USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- 6. Test insert
INSERT INTO posts (client_id, image_url, caption_text, caption_style, caption_length, hashtag_count, hashtags, emoji_count, emojis_used, submission_id)
VALUES (
  '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f',
  'https://example.com/test.jpg',
  'Test caption from SQL',
  'test',
  3,
  1,
  ARRAY['#test'],
  0,
  ARRAY[]::text[],
  (SELECT id FROM submissions WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f' LIMIT 1)
)
RETURNING id;
