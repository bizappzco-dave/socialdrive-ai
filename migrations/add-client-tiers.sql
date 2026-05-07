-- Migration: Add Client Tiers
-- Date: 2026-05-06
-- Purpose: Support Simple/Pro/Agency tiers with different features

-- ============================================
-- 1. ADD TIER COLUMN TO CLIENTS
-- ============================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'simple'
CHECK (tier IN ('simple', 'pro', 'agency'));

COMMENT ON COLUMN clients.tier IS 'Client tier: simple (€29), pro (€79), agency (€149)';

-- ============================================
-- 2. ADD FEATURES JSONB COLUMN
-- ============================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

COMMENT ON COLUMN clients.features IS 'Feature flags and settings per client';

-- ============================================
-- 3. ADD INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);

-- ============================================
-- 4. UPDATE EXISTING CLIENTS
-- ============================================

-- Default all existing clients to Simple tier
UPDATE clients SET tier = 'simple' WHERE tier IS NULL;

-- Set default features for each tier
UPDATE clients 
SET features = '{
  "format_selection": false,
  "platform_selection": false,
  "advanced_customization": false,
  "bulk_upload": false,
  "api_access": false,
  "white_label": false,
  "analytics": false,
  "team_seats": 1
}'::jsonb
WHERE tier = 'simple' AND (features IS NULL OR features = '{}');

-- ============================================
-- 5. SET NO LABEL BARBER TO PRO (EXAMPLE)
-- ============================================

-- No Label Barber is a good Pro tier candidate
UPDATE clients 
SET 
  tier = 'pro',
  features = '{
    "format_selection": true,
    "platform_selection": true,
    "advanced_customization": false,
    "bulk_upload": false,
    "api_access": false,
    "white_label": false,
    "analytics": false,
    "team_seats": 3
  }'::jsonb
WHERE name = 'No Label Barber';

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================

-- Check columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name IN ('tier', 'features');

-- View all client tiers
SELECT name, tier, features 
FROM clients 
ORDER BY tier, name;

-- Count clients per tier
SELECT tier, COUNT(*) as count
FROM clients
GROUP BY tier
ORDER BY tier;

-- ============================================
-- 7. USAGE EXAMPLES
-- ============================================

-- Upgrade client to Pro
UPDATE clients 
SET tier = 'pro'
WHERE id = 'client-uuid';

-- Upgrade client to Agency
UPDATE clients 
SET 
  tier = 'agency',
  features = features || '{"bulk_upload": true, "api_access": true, "white_label": true, "analytics": true, "team_seats": 10}'::jsonb
WHERE id = 'client-uuid';

-- Downgrade client to Simple
UPDATE clients 
SET 
  tier = 'simple',
  features = '{}'::jsonb
WHERE id = 'client-uuid';

-- Get client features in query
SELECT 
  name,
  tier,
  features->>'format_selection' as can_select_format,
  features->>'platform_selection' as can_select_platforms,
  features->>'team_seats' as team_seats
FROM clients;

-- ============================================
-- 8. TIER DEFAULTS REFERENCE
-- ============================================

/*
Simple Tier (€29/month):
- format_selection: false
- platform_selection: false
- advanced_customization: false
- bulk_upload: false
- api_access: false
- white_label: false
- analytics: false
- team_seats: 1

Pro Tier (€79/month):
- format_selection: true
- platform_selection: true
- advanced_customization: false
- bulk_upload: false
- api_access: false (read-only maybe)
- white_label: false
- analytics: false
- team_seats: 3

Agency Tier (€149/month):
- format_selection: true
- platform_selection: true
- advanced_customization: true
- bulk_upload: true
- api_access: true
- white_label: true
- analytics: true
- team_seats: 10
*/
