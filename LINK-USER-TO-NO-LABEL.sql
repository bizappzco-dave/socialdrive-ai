-- =============================================
-- Link User to No Label Academy
-- =============================================
-- Run this in: https://supabase.com/dashboard/project/nmebpawvnhrokouksvir/sql/new
--
-- Steps:
-- 1. Sign in at https://socialdrive-ai.vercel.app/auth/signin
-- 2. Come back here and run Step 1 to get your user ID
-- 3. Run Step 2 to link your account
-- =============================================

-- STEP 1: Find your user ID
-- Run this after signing in to get your user UUID
SELECT 
  id, 
  email, 
  created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- Copy the ID of the user you just created (most recent)

-- STEP 2: Link user to No Label Academy
-- Replace 'YOUR_USER_ID_HERE' with the UUID from Step 1
INSERT INTO client_members (client_id, user_id, role, status, joined_at)
VALUES (
  '586c0eab-7966-4221-8100-42567cc582fe',  -- No Label Academy (DO NOT CHANGE)
  'YOUR_USER_ID_HERE',  -- <-- PASTE YOUR USER ID HERE
  'owner',
  'active',
  NOW()
);

-- STEP 3: Verify the link
SELECT 
  cm.id,
  cm.role,
  cm.status,
  c.name as client_name,
  u.email as user_email
FROM client_members cm
JOIN clients c ON c.id = cm.client_id
JOIN auth.users u ON u.id = cm.user_id
WHERE c.name = 'No Label Academy';
