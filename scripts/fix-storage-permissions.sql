-- Fix Storage Permissions
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dqhnxzaktnejasqlfrjf/sql

-- 1. Check if bucket exists
SELECT id, name, public 
FROM storage.buckets 
WHERE name = 'submissions';

-- 2. Drop all existing policies for submissions bucket (clean slate)
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow delete" ON storage.objects;

-- 3. Create new policies

-- Allow anyone to READ (view images)
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'submissions');

-- Allow authenticated users to UPLOAD
CREATE POLICY "Allow uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

-- Allow authenticated users to DELETE
CREATE POLICY "Allow delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'submissions');

-- 4. Verify policies
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%submissions%';

-- 5. Make bucket public (optional but recommended for images)
UPDATE storage.buckets 
SET public = true 
WHERE name = 'submissions';
