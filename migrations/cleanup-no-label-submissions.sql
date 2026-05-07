-- Delete old test submissions for No Label Barber
-- Step 1: Delete posts (they reference client_id directly)
DELETE FROM posts 
WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- Step 2: Delete submission_images (they reference submission_id, so we need to find submissions first)
DELETE FROM submission_images 
WHERE submission_id IN (
  SELECT id FROM submissions 
  WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f'
);

-- Step 3: Delete submissions
DELETE FROM submissions 
WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';

-- Verify deletion
SELECT id, name FROM clients WHERE id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';
SELECT COUNT(*) as submission_count FROM submissions WHERE client_id = '62fae0aa-3b82-4c20-b8c7-7a8dfe01543f';
