-- SocialDrive: Posting jobs + multi-user client members
-- Date: 2026-06-01

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Client members (users-per-account)
CREATE TABLE IF NOT EXISTS client_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner','manager','editor','viewer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited','active','disabled')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (client_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_client_members_client_id ON client_members(client_id);
CREATE INDEX IF NOT EXISTS idx_client_members_user_id ON client_members(user_id);
CREATE INDEX IF NOT EXISTS idx_client_members_status ON client_members(status);

-- Seed existing single-owner client model into memberships
INSERT INTO client_members (client_id, user_id, role, status, joined_at)
SELECT c.id, c.user_id, 'owner', 'active', NOW()
FROM clients c
WHERE c.user_id IS NOT NULL
ON CONFLICT (client_id, user_id) DO NOTHING;

-- 2) Posting jobs lifecycle
CREATE TABLE IF NOT EXISTS posting_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES submissions(id) ON DELETE SET NULL,
  post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  uploadpost_request_id TEXT,
  uploadpost_job_id TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('post_now','scheduled')),
  scheduled_date_utc TIMESTAMPTZ,
  platform_targets JSONB NOT NULL DEFAULT '[]'::jsonb,
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image','carousel','video','text')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','posted','failed','cancelled')),
  error_message TEXT,
  posted_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posting_jobs_client_id ON posting_jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_posting_jobs_status ON posting_jobs(status);
CREATE INDEX IF NOT EXISTS idx_posting_jobs_submission_id ON posting_jobs(submission_id);
CREATE INDEX IF NOT EXISTS idx_posting_jobs_request_id ON posting_jobs(uploadpost_request_id);
CREATE INDEX IF NOT EXISTS idx_posting_jobs_job_id ON posting_jobs(uploadpost_job_id);

CREATE TABLE IF NOT EXISTS posting_job_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_job_id UUID NOT NULL REFERENCES posting_jobs(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  platform_post_id TEXT,
  post_url TEXT,
  raw_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posting_job_results_job_id ON posting_job_results(posting_job_id);

COMMIT;
