-- Add features_enabled column to clients table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/dqhnxzaktnejasqlfrjf/sql/new

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS features_enabled jsonb DEFAULT '{}'::jsonb;

-- Update existing clients with default features
UPDATE clients
SET features_enabled = '{
  "auto_captions": true,
  "platform_optimization": false,
  "hashtags": false,
  "multi_format": true,
  "video_generation": true,
  "caption_variants": false,
  "premium_ai": false,
  "extended_context": true,
  "bulk_upload": true,
  "email_notifications": true,
  "extended_storage": false,
  "priority_processing": false,
  "team_access": false,
  "custom_templates": false,
  "white_label": false,
  "api_access": false,
  "priority_support": false
}'::jsonb
WHERE features_enabled IS NULL OR features_enabled = '{}'::jsonb;

-- Verify
SELECT name, features_enabled FROM clients LIMIT 5;
