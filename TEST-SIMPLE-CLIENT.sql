-- Create a Simple Tier Test Client
-- Run this in Supabase SQL Editor

-- 1. Create a new test client (Family Butcher example)
INSERT INTO clients (name, email, tier, features)
VALUES (
  'Family Butcher Test',
  'test@familybutcher.com',
  'simple',
  '{
    "format_selection": false,
    "platform_selection": false,
    "advanced_customization": false,
    "bulk_upload": false,
    "api_access": false,
    "white_label": false,
    "analytics": false,
    "team_seats": 1
  }'::jsonb
)
RETURNING id, name, tier;

-- 2. Create an upload link for this client
INSERT INTO submissions (
  client_id,
  upload_token,
  review_token,
  client_name,
  client_email,
  status
)
SELECT 
  id,
  encode(gen_random_bytes(16), 'hex'),  -- Random upload token
  encode(gen_random_bytes(16), 'hex'),  -- Random review token
  name,
  email,
  'pending'
FROM clients 
WHERE name = 'Family Butcher Test'
RETURNING upload_token, review_token;

-- 3. Verify the client was created
SELECT name, tier, features->>'format_selection' as can_select_format
FROM clients 
WHERE name = 'Family Butcher Test';

-- 4. Get the upload token to test with
SELECT s.upload_token, s.review_token, c.tier
FROM submissions s
JOIN clients c ON s.client_id = c.id
WHERE c.name = 'Family Butcher Test'
ORDER BY s.created_at DESC
LIMIT 1;
