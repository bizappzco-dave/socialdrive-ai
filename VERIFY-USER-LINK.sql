-- =============================================
-- Verify/Fix User Link for david@taskifiai.com
-- Run in Supabase Dashboard: https://supabase.com/dashboard/project/nmebpawvnhrokouksvir/sql/new
-- =============================================

-- STEP 1: Check current user
SELECT 
  id, 
  email, 
  created_at
FROM auth.users 
WHERE email = 'david@taskifiai.com';

-- Expected: dac838a6-aecd-4664-9eb0-44497a2f1d6a

-- STEP 2: Check client_members link
SELECT 
  cm.id,
  cm.client_id,
  cm.user_id,
  cm.role,
  cm.status,
  c.name as client_name,
  u.email as user_email
FROM client_members cm
JOIN clients c ON c.id = cm.client_id
JOIN auth.users u ON u.id = cm.user_id
WHERE u.email = 'david@taskifiai.com';

-- If this returns 0 rows, the link is missing!

-- STEP 3: If Step 2 returned 0 rows, run this to create the link
-- No Label Academy client_id in NEW database (nmebpawvnhrokouksvir)
INSERT INTO client_members (client_id, user_id, role, status, joined_at)
SELECT 
  c.id,  -- No Label Academy's actual ID
  u.id,  -- david@taskifiai.com's ID
  'owner',
  'active',
  NOW()
FROM auth.users u
CROSS JOIN (
  SELECT id FROM clients WHERE name = 'No Label Academy' LIMIT 1
) c
WHERE u.email = 'david@taskifiai.com'
ON CONFLICT (client_id, user_id) DO NOTHING;

-- STEP 4: Verify the link was created
SELECT 
  cm.id,
  cm.client_id,
  cm.user_id,
  cm.role,
  cm.status,
  c.name as client_name,
  u.email as user_email
FROM client_members cm
JOIN clients c ON c.id = cm.client_id
JOIN auth.users u ON u.id = cm.user_id
WHERE u.email = 'david@taskifiai.com';
