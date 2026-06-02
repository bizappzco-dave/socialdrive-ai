-- =============================================
-- Create User & Link to No Label Academy
-- =============================================
-- Run this in: https://supabase.com/dashboard/project/nmebpawvnhrokouksvir/sql/new
-- =============================================

-- STEP 1: Check if user already exists
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'taskifiai@gmail.com'
ORDER BY created_at DESC;

-- If you see a result, skip to STEP 3 and use that user ID

-- STEP 2: Create new user (if not found in Step 1)
-- Note: This creates a user without password - they'll need to use magic link to sign in
INSERT INTO auth.users (email, email_confirmed_at, created_at, updated_at)
VALUES (
  'taskifiai@gmail.com',
  NOW(),
  NOW(),
  NOW()
)
RETURNING id, email;

-- STEP 3: Link user to No Label Academy
-- Replace 'YOUR_USER_ID_HERE' with the UUID from Step 1 or 2
INSERT INTO client_members (client_id, user_id, role, status, joined_at)
VALUES (
  '586c0eab-7966-4221-8100-42567cc582fe',  -- No Label Academy
  'YOUR_USER_ID_HERE',  -- <-- Replace with actual UUID
  'owner',
  'active',
  NOW()
)
RETURNING *;

-- STEP 4: Verify the link
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
