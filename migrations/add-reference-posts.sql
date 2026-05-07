-- Reference Posts Table
-- Stores example posts that clients love during onboarding
-- Used as style references for AI generation

CREATE TABLE IF NOT EXISTS reference_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Post content
  caption_text TEXT,
  hashtags TEXT[],
  image_url TEXT, -- Optional: screenshot/example image
  
  -- Context about why this post was chosen
  notes TEXT, -- e.g., "Love the tone", "Great engagement", "Perfect length"
  source TEXT, -- e.g., "Competitor: Joe's Barbers", "Client's old post", "Instagram find"
  
  -- Style tags for easy filtering
  style_tags TEXT[], -- e.g., ["funny", "professional", "short", "storytelling"]
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_reference_posts_client ON reference_posts(client_id);
CREATE INDEX idx_reference_posts_active ON reference_posts(client_id) WHERE is_active = true;

-- RLS Policies
ALTER TABLE reference_posts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage their own reference posts
CREATE POLICY "Users can view own reference posts"
  ON reference_posts FOR SELECT
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can insert own reference posts"
  ON reference_posts FOR INSERT
  WITH CHECK (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can update own reference posts"
  ON reference_posts FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

CREATE POLICY "Users can delete own reference posts"
  ON reference_posts FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM clients WHERE id = client_id));

-- Allow service role (admin) full access
CREATE POLICY "Service role full access"
  ON reference_posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

COMMENT ON TABLE reference_posts IS 'Example posts clients love - used as AI style references';
COMMENT ON COLUMN reference_posts.notes IS 'Why this post was chosen as a reference';
COMMENT ON COLUMN reference_posts.source IS 'Where this example came from (competitor, client history, etc.)';
COMMENT ON COLUMN reference_posts.style_tags IS 'Style descriptors for filtering/matching';
