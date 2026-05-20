-- ============================================
-- SocialDrive AI - Supabase Schema Migration
-- ============================================
-- Run this in the NEW Supabase project's SQL Editor
-- https://supabase.com/dashboard/project/[NEW_PROJECT_ID]/sql/new

-- ============================================
-- 1. Enable required extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. Create ENUM types
-- ============================================
DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE platform_type AS ENUM ('instagram', 'facebook', 'linkedin', 'twitter', 'tiktok');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 3. Create tables
-- ============================================

-- Clients table (core)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT DEFAULT 'General',
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  rss_feed_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand profiles
CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  brand_name TEXT,
  industry TEXT,
  location TEXT,
  website TEXT,
  target_audience TEXT,
  tone TEXT,
  personality TEXT,
  avoid_words TEXT[],
  key_messages TEXT[],
  products_services TEXT,
  usps TEXT,
  cta TEXT,
  hashtags TEXT[],
  emoji_style TEXT,
  post_length_pref TEXT,
  platforms platform_type[],
  brand_history TEXT,
  sample_posts TEXT[],
  competitors_to_monitor JSONB[],
  file_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submissions (onboarding + content uploads)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  upload_token TEXT UNIQUE NOT NULL,
  review_token TEXT UNIQUE NOT NULL,
  client_name TEXT NOT NULL,
  brief_text TEXT,
  image_urls TEXT[],
  status submission_status DEFAULT 'pending',
  platform platform_type,
  scheduled_for TIMESTAMPTZ,
  ai_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Submission images (metadata)
CREATE TABLE IF NOT EXISTS submission_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_path TEXT,
  public_url TEXT,
  width INTEGER,
  height INTEGER,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (generated content)
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  platform platform_type NOT NULL,
  caption TEXT NOT NULL,
  hashtags TEXT[],
  image_urls TEXT[],
  status post_status DEFAULT 'draft',
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  external_post_url TEXT,
  analytics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preferences (per-client feature toggles)
CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  feature_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, feature_key)
);

-- Activities (audit log)
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  product TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. Create indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_active ON clients(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_brand_profiles_client_id ON brand_profiles(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_client_id ON submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_submissions_upload_token ON submissions(upload_token);
CREATE INDEX IF NOT EXISTS idx_submissions_review_token ON submissions(review_token);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submission_images_submission_id ON submission_images(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_images_client_id ON submission_images(client_id);
CREATE INDEX IF NOT EXISTS idx_posts_client_id ON posts(client_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_for ON posts(scheduled_for) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_preferences_client_id ON preferences(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_client_id ON activities(client_id);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at DESC);

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS policies
-- ============================================

-- Clients: Users can only see their own clients
CREATE POLICY "Users can view own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Brand profiles: Follow client ownership
CREATE POLICY "Users can view brand profiles for own clients"
  ON brand_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = brand_profiles.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert brand profiles for own clients"
  ON brand_profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = brand_profiles.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brand profiles for own clients"
  ON brand_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = brand_profiles.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Submissions: Allow public access via token for upload/review pages
CREATE POLICY "Users can view submissions for own clients"
  ON submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = submissions.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Public upload access via token"
  ON submissions FOR SELECT
  USING (true); -- Token-based access handled in API

CREATE POLICY "Users can insert submissions for own clients"
  ON submissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = submissions.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update submissions for own clients"
  ON submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = submissions.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Submission images: Follow submission ownership
CREATE POLICY "Users can view images for own clients"
  ON submission_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = submission_images.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images for own clients"
  ON submission_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = submission_images.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Posts: Follow client ownership
CREATE POLICY "Users can view posts for own clients"
  ON posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = posts.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert posts for own clients"
  ON posts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = posts.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update posts for own clients"
  ON posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = posts.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete posts for own clients"
  ON posts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = posts.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Preferences: Follow client ownership
CREATE POLICY "Users can view preferences for own clients"
  ON preferences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = preferences.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage preferences for own clients"
  ON preferences FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = preferences.client_id
      AND clients.user_id = auth.uid()
    )
  );

-- Activities: Follow client ownership
CREATE POLICY "Users can view activities for own clients"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.id = activities.client_id
      AND clients.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert activities"
  ON activities FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 7. Create updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at
  BEFORE UPDATE ON brand_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at
  BEFORE UPDATE ON preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. Create storage buckets (via SQL)
-- ============================================
-- Note: Storage buckets are usually created via Dashboard UI
-- But we can insert them directly:

INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('client-images', 'client-images', true),
  ('submission-images', 'submission-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Public access to client images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-images');

CREATE POLICY "Users can upload to client images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'client-images' 
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'client-images'
    AND auth.uid() IS NOT NULL
  );

-- ============================================
-- Migration complete!
-- ============================================
