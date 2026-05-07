-- Migration: Add Upload Types and Video URL Support
-- Date: 2026-05-06
-- Purpose: Support carousel and video slideshow uploads

-- ============================================
-- 1. ADD SUBMISSION_TYPE TO SUBMISSIONS
-- ============================================

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'images'
CHECK (submission_type IN ('images', 'carousel', 'video'));

COMMENT ON COLUMN submissions.submission_type IS 'Type of upload: images (individual posts), carousel (GIF), video (MP4 slideshow)';

-- ============================================
-- 2. ADD POST_TYPE AND VIDEO_URL TO POSTS
-- ============================================

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS post_type TEXT DEFAULT 'image'
CHECK (post_type IN ('image', 'carousel', 'video'));

COMMENT ON COLUMN posts.post_type IS 'Type of post: image (static), carousel (multi-image GIF), video (MP4)';

ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS video_url TEXT;

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
-- 5. VERIFICATION QUERIES
-- ============================================

-- Check column exists
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'posts' AND column_name IN ('post_type', 'video_url');

-- Check submission_type column
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'submissions' AND column_name = 'submission_type';

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Create a carousel submission:
-- UPDATE submissions SET submission_type = 'carousel' WHERE id = '...';

-- Create a video post:
-- UPDATE posts SET post_type = 'video', video_url = 'https://...' WHERE id = '...';

-- Export CSV with video support:
-- SELECT 
--   caption_text as Message,
--   CASE WHEN post_type IN ('carousel', 'video') THEN '' ELSE image_url END as ImageURL,
--   CASE WHEN post_type IN ('carousel', 'video') THEN video_url ELSE '' END as VideoURL,
--   'Type: ' || post_type as TeamNote
-- FROM posts WHERE submission_id = '...';
