-- Fix: Allow public read access to submission images
-- Run this in Supabase SQL Editor: https://dqhnxzaktnejasqlfrjf.supabase.co/app/sql

-- First, check if the policy already exists
DO $$
BEGIN
  -- Drop existing policy if it exists (to avoid conflicts)
  DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
  
  -- Create new policy for public read access
  CREATE POLICY "Allow public read"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'submissions');
  
  RAISE NOTICE 'Storage policy created successfully!';
END $$;

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND policyname = 'Allow public read';
