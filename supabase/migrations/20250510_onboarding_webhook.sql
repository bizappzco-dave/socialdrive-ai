-- ============================================
-- DM CHAMP WEBHOOK SUPPORT
-- Migration: 20250510_onboarding_webhook
-- ============================================

-- Table for tracking onboarding webhook events
CREATE TABLE IF NOT EXISTS onboarding_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  phone TEXT NOT NULL,
  dmchamp_contact_id TEXT,
  raw_data JSONB,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups by phone
CREATE INDEX idx_onboarding_logs_phone ON onboarding_logs(phone);

-- Index for client activity tracking
CREATE INDEX idx_onboarding_logs_client_id ON onboarding_logs(client_id);

-- Index for status filtering
CREATE INDEX idx_onboarding_logs_status ON onboarding_logs(status);

-- Add phone field to clients table metadata if not handling via JSONB
COMMENT ON TABLE onboarding_logs IS 'Audit trail for DM Champ webhook onboarding events';

-- ============================================
-- CLIENTS TABLE ENHANCEMENTS
-- ============================================

-- Ensure clients table has metadata column for phone/dmchamp linking
DO $$
BEGIN
  -- Add metadata column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE clients ADD COLUMN metadata JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- Create GIN index for metadata queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_clients_metadata_gin'
  ) THEN
    CREATE INDEX idx_clients_metadata_gin ON clients USING GIN(metadata);
  END IF;
END $$;

-- ============================================
-- SUBMISSIONS TABLE ENHANCEMENTS
-- ============================================

-- Ensure submissions has upload_token
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'submissions' AND column_name = 'upload_token'
  ) THEN
    ALTER TABLE submissions ADD COLUMN upload_token TEXT UNIQUE;
  END IF;
END $$;

-- Add index for token lookups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_submissions_upload_token'
  ) THEN
    CREATE INDEX idx_submissions_upload_token ON submissions(upload_token);
  END IF;
END $$;

-- ============================================
-- WEBHOOK STATUS TABLE (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  events TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  secret_hash TEXT,  -- For webhook signature verification
  rate_limit_per_minute INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed DM Champ webhook endpoint
INSERT INTO webhook_endpoints (name, path, provider, events)
VALUES (
  'DM Champ Onboarding',
  '/api/webhooks/dmchamp/onboarding',
  'dmchamp',
  ARRAY['flow.completed', 'contact.tagged', 'contact.updated']
)
ON CONFLICT (path) DO NOTHING;

-- ============================================
-- EXTRACTED CONVERSATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS onboarding_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  dmchamp_contact_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  conversation_json JSONB NOT NULL,  -- Full conversation from DM Champ
  extracted_data JSONB,              -- Processed/extracted fields
  processing_status TEXT DEFAULT 'pending', -- pending, ready, processed, failed
  source TEXT DEFAULT 'dmchamp',   -- dmchamp, manual, api
  completed_at TIMESTAMPTZ,          -- When onboarding flow finished
  processed_at TIMESTAMPTZ,        -- When we processed it
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for conversation lookups
CREATE INDEX idx_conversations_client_id ON onboarding_conversations(client_id);
CREATE INDEX idx_conversations_phone ON onboarding_conversations(phone);
CREATE INDEX idx_conversations_status ON onboarding_conversations(processing_status);
CREATE INDEX idx_conversations_dmchamp_id ON onboarding_conversations(dmchamp_contact_id);

COMMENT ON TABLE onboarding_conversations IS 'Stores full onboarding conversations for data extraction and analysis';

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Disable RLS for webhook tables (they're system tables)
ALTER TABLE onboarding_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints DISABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_conversations DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to process conversation data and extract structured fields
CREATE OR REPLACE FUNCTION process_onboarding_conversation(conversation_id UUID)
RETURNS JSONB AS $$
DECLARE
  conversation_record RECORD;
  extracted JSONB;
BEGIN
  SELECT * INTO conversation_record 
  FROM onboarding_conversations 
  WHERE id = conversation_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Conversation not found');
  END IF;

  -- Extract structured data from conversation
  -- This is a placeholder for AI/LLM processing
  -- For now, just return the raw data structure
  
  UPDATE onboarding_conversations
  SET 
    processing_status = 'processed',
    extracted_data = conversation_record.conversation_json->>'custom_fields',
    processed_at = NOW()
  WHERE id = conversation_id;

  RETURN jsonb_build_object(
    'status', 'processed',
    'conversation_id', conversation_id,
    'extracted_fields', conversation_record.conversation_json->>'custom_fields'
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION process_onboarding_conversation IS 'Process an onboarding conversation and extract structured data';