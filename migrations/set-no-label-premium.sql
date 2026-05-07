-- Check and set No Label Barber to premium tier

-- First, check current tier
SELECT id, name, ai_tier, claude_model FROM clients WHERE name ILIKE '%no label%';

-- Set to premium tier (if not already)
UPDATE clients 
SET ai_tier = 'premium', 
    claude_model = 'claude-sonnet-4-5-20250929'
WHERE name ILIKE '%no label%';

-- Verify update
SELECT id, name, ai_tier, claude_model FROM clients WHERE name ILIKE '%no label%';
