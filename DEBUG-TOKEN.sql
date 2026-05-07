-- Check the exact token
SELECT 
  upload_token,
  length(upload_token) as token_length,
  client_name,
  status,
  created_at
FROM submissions
WHERE upload_token LIKE '6db6a6b8f632e6ddbf479ad97bcd3ded'
   OR upload_token LIKE '6db6a6b8%'
ORDER BY created_at DESC
LIMIT 5;

-- Check all tokens for Family Butcher
SELECT 
  upload_token,
  client_name,
  status
FROM submissions
WHERE client_name LIKE '%Family Butcher%'
ORDER BY created_at DESC;

-- Check if there are ANY submissions
SELECT COUNT(*) FROM submissions;

-- Check recent submissions
SELECT 
  upload_token,
  client_name,
  status,
  created_at
FROM submissions
ORDER BY created_at DESC
LIMIT 10;
