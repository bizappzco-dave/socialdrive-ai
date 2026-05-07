-- Delete ALL old submissions for No Label Barber and create a fresh one with production URL

-- Step 1: Delete posts
DELETE FROM posts WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- Step 2: Delete submission_images
DELETE FROM submission_images 
WHERE submission_id IN (
  SELECT id FROM submissions WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
);

-- Step 3: Delete ALL submissions for this client
DELETE FROM submissions WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- Step 4: Verify clean slate
SELECT COUNT(*) as remaining_submissions FROM submissions WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- Step 5: Generate new tokens (copy these values)
-- Run this to get new tokens:
SELECT 
  '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f' as client_id,
  encode(gen_random_bytes(16), 'hex') as new_upload_token,
  encode(gen_random_bytes(16), 'hex') as new_review_token;
