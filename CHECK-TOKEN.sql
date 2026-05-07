-- Check if the upload token exists
SELECT 
  upload_token,
  client_id,
  client_name,
  status,
  created_at
FROM submissions
WHERE upload_token = '6db6a6b8f632e6ddbf479ad97bcd3ded';

-- Check all recent submissions
SELECT 
  upload_token,
  client_name,
  status,
  created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 10;
