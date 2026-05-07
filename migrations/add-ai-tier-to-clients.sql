-- Add AI tier selection to clients table
-- Allows choosing between Ollama (standard) and Claude (premium)

ALTER TABLE clients 
ADD COLUMN ai_tier TEXT DEFAULT 'standard' CHECK (ai_tier IN ('standard', 'premium'));

ALTER TABLE clients
ADD COLUMN claude_model TEXT DEFAULT 'claude-sonnet-4-5-20250929';

-- Add comment for documentation
COMMENT ON COLUMN clients.ai_tier IS 'AI model tier: standard (Ollama) or premium (Claude API)';
COMMENT ON COLUMN clients.claude_model IS 'Specific Claude model to use for premium tier';

-- Update existing clients to standard tier
UPDATE clients SET ai_tier = 'standard' WHERE ai_tier IS NULL;

-- Index for quick tier lookups
CREATE INDEX IF NOT EXISTS idx_clients_ai_tier ON clients(ai_tier);

-- Set No Label Barber to premium for testing
UPDATE clients 
SET ai_tier = 'premium' 
WHERE name = 'No Label Barber';
