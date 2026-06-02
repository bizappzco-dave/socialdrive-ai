-- Update test posts with real submission images
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/nmebpawvnhrokouksvir/sql/new

-- First, check what real images exist in submissions
SELECT id, client_id, image_urls 
FROM submissions 
WHERE image_urls IS NOT NULL 
  AND array_length(image_urls, 1) > 0
LIMIT 5;

-- Then update a test post with a real image URL
UPDATE posts 
SET image_urls = (
  SELECT image_urls 
  FROM submissions 
  WHERE image_urls IS NOT NULL 
    AND array_length(image_urls, 1) > 0
  LIMIT 1
)
WHERE id = '2299a7ea-14f3-4c2d-bd75-dde5e1aed958';

-- Verify the update
SELECT id, caption, image_urls 
FROM posts 
WHERE id = '2299a7ea-14f3-4c2d-bd75-dde5e1aed958';
