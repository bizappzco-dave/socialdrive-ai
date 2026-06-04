-- Clean up all test data for No Label Academy
-- Run this in Supabase SQL Editor

-- Delete all posts
DELETE FROM posts WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';

-- Delete all submissions  
DELETE FROM submissions WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';

-- Verify
SELECT 'Posts remaining: ' || COUNT(*) as check FROM posts WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';
SELECT 'Submissions remaining: ' || COUNT(*) as check FROM submissions WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';
