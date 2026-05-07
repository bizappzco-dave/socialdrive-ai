-- Temporarily switch to standard tier (Ollama) for testing

UPDATE clients 
SET ai_tier = 'standard'
WHERE name ILIKE '%no label%';

-- Verify
SELECT id, name, ai_tier FROM clients WHERE name ILIKE '%no label%';
