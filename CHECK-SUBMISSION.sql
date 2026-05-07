-- Check if No Label Barber submission and posts exist
-- Run this in Supabase SQL Editor

-- 1. Find the client
SELECT id, name, ai_tier FROM clients WHERE name ILIKE '%no label%';

-- 2. Check submissions for this client
SELECT id, client_id, client_name, status, post_count, review_token, created_at 
FROM submissions 
WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check if posts were generated
SELECT p.id, p.caption_text, p.image_url, p.caption_style, p.selected, p.hashtags
FROM posts p
JOIN submissions s ON p.submission_id = s.id
WHERE s.client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check submission_images
SELECT si.image_url, si.image_filename, si.sort_order
FROM submission_images si
JOIN submissions s ON si.submission_id = s.id
WHERE s.client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
ORDER BY si.sort_order;
