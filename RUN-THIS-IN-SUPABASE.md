# Run This in Supabase Dashboard - Step by Step

**Date:** 2026-05-06  
**Time needed:** 2 minutes

---

## Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Click on your project (socialdrive-ai)
3. Click **SQL Editor** in left sidebar
4. Click **New Query** button

---

## Step 2: Copy This SQL

**Copy the entire block below** (from `-- Migration` to the end):

```sql
-- ============================================
-- Migration: Add Client Tiers
-- Run this ONCE to add tier support
-- ============================================

-- 1. Add tier column to clients
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'simple'
CHECK (tier IN ('simple', 'pro', 'agency'));

COMMENT ON COLUMN clients.tier IS 'Client tier: simple (€29), pro (€79), agency (€149)';

-- 2. Add features JSONB column
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}';

COMMENT ON COLUMN clients.features IS 'Feature flags per client';

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_tier ON clients(tier);

-- 4. Set all existing clients to Simple tier (default)
UPDATE clients SET tier = 'simple' WHERE tier IS NULL;

-- 5. Set default features for Simple tier
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
-- 6. Set No Label Barber to PRO tier (example)
-- ============================================

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
WHERE name = 'No Label Barber' OR name = 'no label Barber';

-- ============================================
-- 7. Verify it worked
-- ============================================

-- Check columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'clients' 
  AND column_name IN ('tier', 'features');

-- View all clients with their tiers
SELECT name, tier, features 
FROM clients 
ORDER BY tier, name;

-- Count clients per tier
SELECT tier, COUNT(*) as count
FROM clients
GROUP BY tier;
```

---

## Step 3: Run the SQL

1. **Paste** the SQL into the editor
2. Click **Run** button (or press Ctrl+Enter / Cmd+Enter)
3. Wait for it to complete (should take 1-2 seconds)

---

## Step 4: Verify Success

You should see **3 result tables**:

### Result 1: Columns Added
```
column_name  | data_type
-------------|----------
tier         | text
features     | jsonb
```

### Result 2: Clients with Tiers
```
name              | tier   | features
------------------|--------|----------
Family Butcher    | simple | {...}
Test Client       | simple | {...}
No Label Barber   | pro    | {...}
```

### Result 3: Tier Count
```
tier   | count
-------|------
simple | 5
pro    | 1
```

---

## Step 5: Test the Upload Page

**For Simple Tier Client:**

1. Get an upload token for a simple tier client:
```sql
SELECT upload_token, client_name 
FROM submissions 
WHERE status = 'pending' 
ORDER BY created_at DESC 
LIMIT 5;
```

2. Copy one of the tokens (e.g., `cd912e1b65c1e0de0ffc2b82aac80a49`)

3. Visit: `https://socialdrive-ai.vercel.app/upload/cd912e1b65c1e0de0ffc2b82aac80a49`

4. **You should see:**
   - Simple, clean interface
   - Just "Upload Your Photos"
   - No format options
   - No platform options
   - Friendly, minimal copy

**For Pro Tier Client (No Label Barber):**

1. Get No Label Barber's upload token:
```sql
SELECT upload_token 
FROM submissions 
WHERE client_name = 'No Label Barber' OR client_name = 'no label Barber'
ORDER BY created_at DESC 
LIMIT 1;
```

2. Visit that upload page

3. **You should see:**
   - Full upload interface
   - Format selection (Images/Carousel/Video)
   - Platform selection (Instagram/TikTok/etc)
   - All the options

---

## Troubleshooting

### Error: "column email does not exist"

**Cause:** You tried to run the wrong SQL (from the old migration file)

**Fix:** Use the SQL in this file (`RUN-THIS-IN-SUPABASE.md`), NOT the one in `migrations/add-client-tiers.sql`

The SQL above is updated to match your actual database schema.

---

### Upload Page Still Flashing

**Cause:** Old cached version

**Fix:**
1. Hard refresh the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Or open in incognito/private window
3. Or wait 1-2 minutes for Vercel cache to clear

---

### Simple Tier Shows Pro UI

**Cause:** Client tier not set correctly

**Fix:**
```sql
-- Check the client's tier
SELECT name, tier FROM clients WHERE name = 'Your Client Name';

-- If it's not 'simple', update it
UPDATE clients SET tier = 'simple' WHERE name = 'Your Client Name';
```

Then refresh the upload page.

---

## What This Does

### Adds 2 Columns to `clients` Table:

1. **`tier`** (text) - Which tier they're on
   - `'simple'` - €29/month
   - `'pro'` - €79/month
   - `'agency'` - €149/month

2. **`features`** (JSONB) - What features they can use
   ```json
   {
     "format_selection": false,
     "platform_selection": false,
     "team_seats": 1
   }
   ```

### Sets Defaults:

- All existing clients → **Simple tier**
- No Label Barber → **Pro tier** (as an example)

---

## After Running

**Come back and tell me:**
1. ✅ SQL ran successfully
2. ✅ You can see the tier columns
3. ✅ Simple tier upload page loads (no flashing)
4. ✅ Pro tier upload page shows options

Then we'll test the video creator command! 🚀

---

**Questions?** Just ask!
