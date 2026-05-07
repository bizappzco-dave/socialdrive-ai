-- Migration: Add submission_id to posts table
-- Run this in Supabase SQL Editor

-- Add submission_id column
ALTER TABLE posts 
ADD COLUMN submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
ADD COLUMN deleted BOOLEAN DEFAULT false,
ADD COLUMN deleted_at TIMESTAMPTZ;

-- Add index for faster lookups
CREATE INDEX idx_posts_submission_id ON posts(submission_id);

-- Update existing posts (set to NULL for now)
UPDATE posts SET submission_id = NULL WHERE submission_id IS NULL;

COMMENT ON COLUMN posts.submission_id IS 'Links post to client submission (for upload flow)';
COMMENT ON COLUMN posts.deleted IS 'Soft delete flag - client rejected this post';
COMMENT ON COLUMN posts.deleted_at IS 'When the post was marked as deleted';
