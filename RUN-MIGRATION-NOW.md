# Run Database Migration - Platform Preferences

**Priority:** CRITICAL - Must run before testing

---

## What This Does

Adds 3 columns to the `clients` table:
- `platforms` - Array of platforms (instagram, tiktok, etc.)
- `primary_platform` - Main platform (instagram by default)
- `generate_all_formats` - Whether to generate all formats or just selected

---

## How to Run

### Option 1: Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard
2. Select your project (socialdrive-ai)
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy/paste the SQL below
6. Click **Run**

### Option 2: CLI (If you have Supabase CLI)

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
supabase db push --db-url "your-supabase-connection-string"
```

---

## SQL to Run

Copy this entire block:

```sql
-- Migration: Add Platform Preferences to Clients
-- Date: 2026-05-06

-- Add platform columns to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS platforms TEXT[] DEFAULT '{"instagram"}',
ADD COLUMN IF NOT EXISTS primary_platform TEXT DEFAULT 'instagram',
ADD COLUMN IF NOT EXISTS generate_all_formats BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN clients.platforms IS 'Array of platforms client posts to: instagram, facebook, tiktok, linkedin, x, youtube, pinterest';
COMMENT ON COLUMN clients.primary_platform IS 'Primary platform for content optimization';
COMMENT ON COLUMN clients.generate_all_formats IS 'If true, generate videos for all platforms (not just primary)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_primary_platform ON clients(primary_platform);

-- Update existing clients (set defaults)
UPDATE clients SET platforms = '{"instagram"}' WHERE platforms IS NULL;
UPDATE clients SET primary_platform = 'instagram' WHERE primary_platform IS NULL;
UPDATE clients SET generate_all_formats = false WHERE generate_all_formats IS NULL;
```

---

## Verify It Worked

Run this query to check:

```sql
SELECT name, platforms, primary_platform, generate_all_formats 
FROM clients 
ORDER BY name;
```

You should see all clients with:
- `platforms`: {"instagram"}
- `primary_platform`: instagram
- `generate_all_formats`: false

---

## After Running

Once migration is complete, we can:
1. Update client platforms in database
2. Test upload with platform selection
3. Backend will store platforms correctly

---

**Let me know when you've run this!**
