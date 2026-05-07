-- Check for posts created in last 10 minutes
-- Run in Supabase SQL Editor

SELECT 
  p.id,
  p.caption_text,
  LENGTH(p.caption_text) as caption_length,
  p.image_url,
  p.created_at,
  s.client_name,
  s.status
FROM posts p
JOIN submissions s ON p.submission_id = s.id
WHERE p.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY p.created_at DESC
LIMIT 10;
