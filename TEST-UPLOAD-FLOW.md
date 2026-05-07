# Test Simple Tier Upload Flow

**Goal:** Test the new Simple Tier upload experience

---

## Step 1: Create Test Client in Supabase

**Go to:** https://supabase.com/dashboard → SQL Editor

**Run this SQL:**

```sql
-- Create Simple Tier test client
INSERT INTO clients (name, email, tier, features)
VALUES (
  'Family Butcher Test',
  'test@familybutcher.com',
  'simple',
  '{}'::jsonb
)
RETURNING id, name, tier;

-- Create upload link
INSERT INTO submissions (
  client_id,
  upload_token,
  review_token,
  client_name,
  client_email,
  status
)
SELECT 
  id,
  encode(gen_random_bytes(16), 'hex'),
  encode(gen_random_bytes(16), 'hex'),
  name,
  email,
  'pending'
FROM clients 
WHERE name = 'Family Butcher Test'
RETURNING upload_token, review_token;
```

**Copy the upload_token** from the results (e.g., `cd912e1b65c1e0de0ffc2b82aac80a49`)

---

## Step 2: Test Simple Tier Upload Page

**Visit:** `https://socialdrive-ai.vercel.app/upload/[YOUR_TOKEN]`

**You should see:**
- ✅ Clean, simple interface
- ✅ "Upload Your Photos" heading
- ✅ Drag & drop area
- ✅ "What's Happening This Week?" text box
- ✅ "✨ Create My Posts" button
- ✅ NO format selection
- ✅ NO platform selection

**Test it:**
1. Upload 3-5 images (use the No Label Barber images)
2. Add a brief: "20% off all sausages this week"
3. Click "Create My Posts"
4. Wait for success message

---

## Step 3: Check What Was Generated

**In Supabase SQL Editor:**

```sql
-- Check the submission
SELECT * FROM submissions 
WHERE upload_token = 'YOUR_TOKEN_HERE';

-- Check the posts created
SELECT p.id, p.caption_text, p.image_url, p.post_type, p.video_url
FROM posts p
JOIN submissions s ON p.submission_id = s.id
WHERE s.upload_token = 'YOUR_TOKEN_HERE';
```

**Expected:**
- 3-5 posts created (one per image)
- Each post has 3 caption variations
- `post_type` = 'image' (Simple tier default)
- Platforms = ['instagram'] (Simple tier default)

---

## Step 4: Test Review Page

**Visit:** `https://socialdrive-ai.vercel.app/review/[REVIEW_TOKEN]`

**You should see:**
- Generated posts with images
- 3 caption options per image
- Heart icon to select favorites
- "Ready for Posting" button
- Download CSV option

**Test it:**
1. Select your favorite caption for each image
2. Click "Ready for Posting"
3. CSV downloads automatically

---

## Step 5: Upload to Sociamonials

**In Sociamonials:**
1. Go to Import/Upload
2. Upload the CSV file
3. Check the posts look correct
4. Schedule or publish

---

## Step 6: Test Pro Tier (Optional)

**Update the client to Pro tier:**

```sql
UPDATE clients 
SET tier = 'pro',
    features = '{
      "format_selection": true,
      "platform_selection": true
    }'::jsonb
WHERE name = 'Family Butcher Test';
```

**Visit the same upload page again**

**You should now see:**
- Format selection (Images/Carousel/Video)
- Platform selection (Instagram/TikTok/etc.)
- All the Pro tier options

---

## What to Look For

### ✅ Simple Tier Should Be:
- Super simple, no confusion
- Just photos + brief
- Auto-handles everything
- Fast (2 minutes to upload)
- Professional results

### ❌ Problems to Report:
- Confusing options
- Missing information
- Upload errors
- Wrong formats generated
- Review page issues

---

## Quick Test Commands

**Check client tier:**
```sql
SELECT name, tier FROM clients WHERE name = 'Family Butcher Test';
```

**Check submission:**
```sql
SELECT upload_token, status, post_count FROM submissions 
WHERE client_id = (SELECT id FROM clients WHERE name = 'Family Butcher Test')
ORDER BY created_at DESC LIMIT 1;
```

**Check posts:**
```sql
SELECT COUNT(*), post_type, selected 
FROM posts 
WHERE submission_id = (
  SELECT id FROM submissions 
  WHERE client_id = (SELECT id FROM clients WHERE name = 'Family Butcher Test')
  ORDER BY created_at DESC LIMIT 1
)
GROUP BY post_type, selected;
```

---

**Ready to test?** Start with Step 1 and let me know how it goes! 🚀
