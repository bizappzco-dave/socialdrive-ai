-- Check if 'submissions' storage bucket exists and create if needed
-- Run this in Supabase SQL Editor

-- First, check existing buckets
SELECT name, public FROM storage.buckets;

-- Create the submissions bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public uploads (for the upload flow)
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'submissions');

-- Allow public reads
CREATE POLICY "Allow public reads"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- Allow authenticated users to manage their files
CREATE POLICY "Allow authenticated management"
ON storage.objects FOR ALL
USING (bucket_id = 'submissions');
