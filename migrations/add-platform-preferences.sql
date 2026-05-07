-- Migration: Add Platform Preferences to Clients
-- Date: 2026-05-06
-- Purpose: Track which platforms clients post to for auto-resizing

-- ============================================
-- 1. ADD PLATFORM COLUMNS TO CLIENTS
-- ============================================

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{"instagram"}',
ADD COLUMN IF NOT EXISTS primary_platform TEXT DEFAULT 'instagram',
ADD COLUMN IF NOT EXISTS generate_all_formats BOOLEAN DEFAULT false;

COMMENT ON COLUMN clients.platforms IS 'Array of platforms client posts to: instagram, facebook, tiktok, linkedin, x, youtube, pinterest';
COMMENT ON COLUMN clients.primary_platform IS 'Primary platform for content optimization';
COMMENT ON COLUMN clients.generate_all_formats IS 'If true, generate videos for all platforms (not just primary)';

-- ============================================
-- 2. ADD INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_primary_platform ON clients(primary_platform);

-- ============================================
-- 3. UPDATE EXISTING CLIENTS
-- ============================================

-- Set all existing clients to Instagram-only (conservative default)
UPDATE clients SET platforms = '{"instagram"}' WHERE platforms IS NULL;
UPDATE clients SET primary_platform = 'instagram' WHERE primary_platform IS NULL;
UPDATE clients SET generate_all_formats = false WHERE generate_all_formats IS NULL;

-- ============================================
-- 4. VERIFICATION QUERIES
-- ============================================

-- Check columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' AND column_name IN ('platforms', 'primary_platform', 'generate_all_formats');

-- View all client platform preferences
SELECT name, platforms, primary_platform, generate_all_formats 
FROM clients 
ORDER BY name;

-- ============================================
-- 5. USAGE EXAMPLES
-- ============================================

-- Update No Label Barber to post to Instagram, Facebook, TikTok
UPDATE clients 
SET 
  platforms = '{"instagram", "facebook", "tiktok"}',
  primary_platform = 'instagram'
WHERE name = 'No Label Barber';

-- Enable multi-format generation for premium client
UPDATE clients 
SET generate_all_formats = true 
WHERE name = 'No Label Barber';

-- Find all TikTok clients
SELECT name, email 
FROM clients 
WHERE 'tiktok' = ANY(platforms);

-- ============================================
-- 6. PLATFORM SIZE REFERENCE
-- ============================================

/*
Platform       | Aspect Ratio | Size        | Use Case
---------------|--------------|-------------|------------------
instagram      | 1:1          | 1080x1080   | Feed posts
instagram      | 4:5          | 1080x1350   | Portrait feed
instagram      | 9:16         | 1080x1920   | Stories/Reels
facebook       | 1:1          | 1200x1200   | Feed posts
facebook       | 1.91:1       | 1200x627    | Landscape feed
facebook       | 9:16         | 1080x1920   | Stories
tiktok         | 9:16         | 1080x1920   | Required
linkedin       | 1:1          | 1200x1200   | Feed posts
linkedin       | 1.91:1       | 1200x627    | Landscape posts
x (twitter)    | 16:9         | 1200x675    | Landscape
x (twitter)    | 1:1          | 1200x1200   | Square
youtube        | 9:16         | 1080x1920   | Shorts
pinterest      | 2:3          | 1000x1500   | Standard pins
pinterest      | 9:16         | 1000x1500   | Story pins
*/

-- ============================================
-- 7. FUTURE ENHANCEMENTS
-- ============================================

/*
Consider adding:
- platform_specific_settings JSONB - Custom settings per platform
- auto_detect_platforms BOOLEAN - Auto-detect from Sociamonials
- last_platform_sync TIMESTAMPTZ - When we last synced platforms
*/
