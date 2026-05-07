-- SocialDrive AI - Submissions Schema
-- For client upload flow (no login required)
-- Run this in Supabase SQL Editor

-- ============================================
-- SUBMISSIONS TABLE
-- Tracks each client upload batch
-- ============================================

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Access tokens (for no-login flow)
  upload_token TEXT UNIQUE NOT NULL,  -- For upload page
  review_token TEXT UNIQUE NOT NULL,  -- For review page
  
  -- Client info (captured at upload time)
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  
  -- Brief/notes from client
  brief_text TEXT,
  brief_voice_url TEXT,  -- If voice note uploaded
  
  -- Status tracking
  status TEXT DEFAULT 'pending',  -- pending, generating, ready, approved, published
  post_count INT DEFAULT 0,  -- How many posts generated
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  generated_at TIMESTAMPTZ,
  notified_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  ip_address TEXT,  -- For basic analytics
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBMISSION IMAGES TABLE
-- Stores uploaded images for each submission
-- ============================================

CREATE TABLE IF NOT EXISTS submission_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  
  -- Image data
  image_url TEXT NOT NULL,
  image_filename TEXT,
  image_size INT,  -- In bytes
  
  -- Context from filename or client notes
  image_context TEXT,  -- Extracted from filename or manual entry
  
  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  
  -- Order (for carousel or sequence)
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_submissions_client_id ON submissions(client_id);
CREATE INDEX idx_submissions_upload_token ON submissions(upload_token);
CREATE INDEX idx_submissions_review_token ON submissions(review_token);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submission_images_submission_id ON submission_images(submission_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-generate tokens
CREATE OR REPLACE FUNCTION generate_secure_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(16), 'hex');  -- 32 char hex string
END;
$$ LANGUAGE plpgsql;

-- Auto-update updated_at
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Optional - for future auth)
-- ============================================

-- For now, keep it open (tokens provide security)
-- Can enable RLS later if needed

-- ============================================
-- SAMPLE DATA (For Testing)
-- ============================================

-- Create a submission for No Label Barber
INSERT INTO submissions (
  client_id,
  upload_token,
  review_token,
  client_name,
  client_email,
  client_phone,
  brief_text,
  status
)
VALUES (
  (SELECT id FROM clients WHERE name = 'No Label Barber' LIMIT 1),
  generate_secure_token(),  -- Random upload token
  generate_secure_token(),  -- Random review token
  'No Label Barber',
  'dpmcgoldrick@gmail.com',
  '+353 87 123 4567',
  'Test submission - Sale this week',
  'pending'
)
RETURNING id, upload_token, review_token;

-- ============================================
-- HELPER QUERIES
-- ============================================

-- Get submission by upload token
-- SELECT * FROM submissions WHERE upload_token = 'YOUR_TOKEN';

-- Get submission by review token
-- SELECT * FROM submissions WHERE review_token = 'YOUR_TOKEN';

-- Get all images for a submission
-- SELECT * FROM submission_images WHERE submission_id = 'YOUR_SUBMISSION_ID';

-- Get all submissions for a client
-- SELECT * FROM submissions WHERE client_id = 'YOUR_CLIENT_ID' ORDER BY submitted_at DESC;
