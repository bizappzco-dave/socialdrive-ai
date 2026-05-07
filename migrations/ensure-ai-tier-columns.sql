-- Check if ai_tier column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name IN ('ai_tier', 'claude_model');

-- If columns don't exist, add them
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS ai_tier TEXT DEFAULT 'standard' CHECK (ai_tier IN ('standard', 'premium'));

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS claude_model TEXT DEFAULT 'claude-sonnet-4-5-20250929';

-- Set No Label Barber to premium
UPDATE clients 
SET ai_tier = 'premium', 
    claude_model = 'claude-sonnet-4-5-20250929'
WHERE name ILIKE '%no label%';

-- Verify
SELECT id, name, ai_tier, claude_model FROM clients WHERE name ILIKE '%no label%';
