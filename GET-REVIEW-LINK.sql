-- Get the latest review token for No Label Barber
-- Run this in Supabase SQL Editor

SELECT 
  s.id,
  s.client_name,
  s.status,
  s.post_count,
  s.review_token,
  s.created_at,
  COUNT(p.id) as actual_post_count
FROM submissions s
LEFT JOIN posts p ON p.submission_id = s.id AND p.deleted = false
WHERE s.client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
GROUP BY s.id, s.client_name, s.status, s.post_count, s.review_token, s.created_at
ORDER BY s.created_at DESC
LIMIT 1;
