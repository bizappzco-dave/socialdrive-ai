-- Fixed Migration: Add Upload Types and Video URL Support
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. ADD SUBMISSION_TYPE TO SUBMISSIONS
-- ============================================

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'images';

-- Add constraint (without IF NOT EXISTS - use DO block)
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'submissions_submission_type_check'
    ) THEN
        ALTER TABLE submissions 
        ADD CONSTRAINT submissions_submission_type_check 
        CHECK (submission_type IN ('images', 'carousel', 'video'));
    END IF;
END $$;

COMMENT ON COLUMN submissions.submission_type IS 'Type of upload: images (individual posts), carousel (GIF), video (MP4 slideshow)';

-- ============================================
-- 2. ADD POST_TYPE AND VIDEO_URL TO POSTS
-- ============================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'image';

-- Add constraint for post_type
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'posts_post_type_check'
    ) THEN
        ALTER TABLE posts 
        ADD CONSTRAINT posts_post_type_check 
        CHECK (post_type IN ('image', 'carousel', 'video'));
    END IF;
END $$;

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT;

COMMENT ON COLUMN posts.post_type IS 'Type of post: image (static), carousel (multi-image GIF), video (MP4)';
COMMENT ON COLUMN posts.video_url IS 'URL to generated video/GIF for carousel or video posts. Used instead of image_url for video-type posts.';

-- ============================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_posts_post_type ON posts(post_type);
CREATE INDEX IF NOT EXISTS idx_submissions_submission_type ON submissions(submission_type);

-- ============================================
-- 4. UPDATE EXISTING DATA
-- ============================================

-- Set all existing posts to 'image' type (default)
UPDATE posts SET post_type = 'image' WHERE post_type IS NULL;

-- Set all existing submissions to 'images' type (default)
UPDATE submissions SET submission_type = 'images' WHERE submission_type IS NULL;

-- ============================================
-- 5. VERIFICATION
-- ============================================

-- Check columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name IN ('post_type', 'video_url');

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' AND column_name = 'submission_type';

-- Check constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname IN ('submissions_submission_type_check', 'posts_post_type_check');
