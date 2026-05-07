-- Brand Profile Fields Migration
-- Add columns to clients table for brand profile data

-- Online Presence
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS instagram_handle TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS facebook_handle TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS linkedin_handle TEXT;

-- Brand & Audience
ALTER TABLE clients ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_tone TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_voice TEXT;

-- Competitive Positioning
ALTER TABLE clients ADD COLUMN IF NOT EXISTS usps TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS competitors TEXT;

-- Content Guidelines
ALTER TABLE clients ADD COLUMN IF NOT EXISTS words_to_use TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS words_to_avoid TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS content_preferences TEXT[];
ALTER TABLE clients ADD COLUMN IF NOT EXISTS brand_guidelines_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN clients.website_url IS 'Company website URL';
COMMENT ON COLUMN clients.instagram_handle IS 'Instagram handle (without @)';
COMMENT ON COLUMN clients.facebook_handle IS 'Facebook page handle';
COMMENT ON COLUMN clients.linkedin_handle IS 'LinkedIn company handle';
COMMENT ON COLUMN clients.target_audience IS 'Description of target audience';
COMMENT ON COLUMN clients.brand_tone IS 'Brand tone (e.g., professional, friendly)';
COMMENT ON COLUMN clients.brand_voice IS 'Brand voice description';
COMMENT ON COLUMN clients.usps IS 'Unique selling points';
COMMENT ON COLUMN clients.competitors IS 'Main competitors';
COMMENT ON COLUMN clients.words_to_use IS 'Words/phrases to always use';
COMMENT ON COLUMN clients.words_to_avoid IS 'Words/phrases to avoid';
COMMENT ON COLUMN clients.content_preferences IS 'Preferred content types';
COMMENT ON COLUMN clients.brand_guidelines_url IS 'Link to brand guidelines document';
