-- Run this in Supabase SQL Editor to check storage setup

-- 1. Check if submissions bucket exists
SELECT name, public, owner FROM storage.buckets WHERE name = 'submissions';

-- 2. Check storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Create bucket if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 4. Drop old policies and recreate
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated management" ON storage.objects;

-- Allow anyone to upload
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions');

-- Allow anyone to read
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- Allow service role to do anything
CREATE POLICY "Allow service role full access"
ON storage.objects FOR ALL
USING (auth.jwt()->>'role' = 'service_role');
