-- Check if 'submissions' bucket exists
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dqhnxzaktnejasqlfrjf/sql

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE name = 'submissions';

-- If no results, create the bucket:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false,  -- Keep private, we'll add read policy separately
  10485760,  -- 10MB limit
  ARRAY['image/*']
)
ON CONFLICT (id) DO NOTHING;

-- Then add the public read policy:
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;

CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'submissions');

-- Verify everything is set up
SELECT 'Bucket exists' as check, name FROM storage.buckets WHERE name = 'submissions'
UNION ALL
SELECT 'Policy exists' as check, policyname FROM pg_policies WHERE policyname = 'Allow public read';
