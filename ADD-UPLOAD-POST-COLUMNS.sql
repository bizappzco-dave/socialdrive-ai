-- Add upload_request_id column to posting_jobs for tracking Upload-Post API requests
-- Run this in Supabase Dashboard: https://supabase.com/dashboard/project/nmebpawvnhrokouksvir/sql/new

ALTER TABLE posting_jobs 
ADD COLUMN IF NOT EXISTS upload_request_id TEXT,
ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS instagram_post_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_media_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_posting_jobs_upload_request 
ON posting_jobs(upload_request_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'posting_jobs'
ORDER BY ordinal_position;
