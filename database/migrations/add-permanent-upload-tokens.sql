-- Add permanent upload tokens to clients table
-- This ensures upload links are truly permanent and survive submission cleanup

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS upload_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS review_token TEXT UNIQUE;

-- Generate tokens for clients that don't have them yet
UPDATE clients 
SET 
  upload_token = md5(random()::text || clock_timestamp()::text || id::text),
  review_token = md5(random()::text || clock_timestamp()::text || id::text)
WHERE upload_token IS NULL;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_upload_token ON clients(upload_token);
CREATE INDEX IF NOT EXISTS idx_clients_review_token ON clients(review_token);

-- Comment columns
COMMENT ON COLUMN clients.upload_token IS 'Permanent upload link token (never changes)';
COMMENT ON COLUMN clients.review_token IS 'Permanent review page token (never changes)';
