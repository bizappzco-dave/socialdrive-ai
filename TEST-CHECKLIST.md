# Test Checklist - Client Upload Flow

## Prerequisites

### ✅ 1. Run Database Migrations

**In Supabase SQL Editor**, run these in order:

```sql
-- 1. Submissions schema
-- Copy contents of: submissions-schema.sql

-- 2. Add submission_id to posts table
-- Copy contents of: migrations/add-submission-id-to-posts.sql
```

### ✅ 2. Create Storage Bucket

Follow: `SUPABASE-STORAGE-SETUP.md`
- Create `submissions` bucket
- Add 3 storage policies

### ✅ 3. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
npm run dev
```

---

## Test 1: Create Upload Link

```bash
npx tsx scripts/create-upload-link.ts "No Label Barber" "dpmcgoldrick@gmail.com" "+353871234567"
```

**Expected output:**
```
✅ Upload Link Created!

📤 Upload URL:
http://localhost:3000/upload/abc123xyz789

📋 Review URL:
http://localhost:3000/review/def456uvw012
```

**✅ Copy the upload URL**

---

## Test 2: Upload Page

1. **Open the upload URL** in your browser
2. **Verify you see:**
   - "Upload Your Content" header
   - Drag & drop zone for images
   - Brief text area
   - Voice recording button
   - "Submit for Review" button

**✅ Upload page loads correctly**

---

## Test 3: Upload Images

1. **Drag & drop 2-3 test images** (or click to browse)
   - Use any JPG/PNG images
   - Rename them with context: `test-sale.jpg`, `test-new-branch.png`

2. **Add a brief note:**
   ```
   Test submission - Sale this week
   ```

3. **Click "Submit for Review"**

4. **Watch for:**
   - "Uploading..." state
   - Success message when done
   - Redirect to "Submission Received!" page

**✅ Upload completes successfully**

---

## Test 4: Verify Database

**In Supabase SQL Editor**, run:

```sql
-- Check submission was created
SELECT id, status, client_name, brief_text, post_count 
FROM submissions 
ORDER BY submitted_at DESC 
LIMIT 1;

-- Check images were stored
SELECT * FROM submission_images 
WHERE submission_id = (SELECT id FROM submissions ORDER BY submitted_at DESC LIMIT 1);

-- Check posts were generated
SELECT id, caption_text, caption_style, image_url 
FROM posts 
WHERE submission_id = (SELECT id FROM submissions ORDER BY submitted_at DESC LIMIT 1);
```

**Expected:**
- ✅ 1 submission record (status: `ready`)
- ✅ 2-3 image records
- ✅ 6-9 post records (3 variations per image)

---

## Test 5: Review Page

1. **Copy the review URL** from the script output
2. **Open it in your browser**
3. **Verify you see:**
   - All generated posts (6-9 posts)
   - Heart icon on each (click to select)
   - Trash icon (click to delete)
   - "Ready for Posting" button

4. **Select 3-4 favorites** (click hearts)
5. **Delete 1-2 posts** (click trash)
6. **Click "Ready for Posting"**

**✅ Review page works**

---

## Test 6: CSV Export

After clicking "Ready for Posting":

1. **CSV should download automatically**
2. **Open the CSV** - verify it has:
   - Your selected posts
   - Proper Sociamonials format
   - Category = "No Label Barber"

3. **Check database:**
   ```sql
   SELECT status, approved_at FROM submissions 
   ORDER BY submitted_at DESC LIMIT 1;
   ```
   - Status should be: `approved`

**✅ CSV downloads and is formatted correctly**

---

## Test 7: End-to-End Flow

**Full scenario:**

1. Create upload link ✅
2. Upload 5 images with brief ✅
3. AI generates 15 posts ✅
4. Review page shows all 15 ✅
5. Select 8, delete 2 ✅
6. CSV downloads with 8 posts ✅

**Time estimate:** 5-7 minutes total

---

## Known Issues / Gotchas

### Ollama Not Running
**Error:** "Ollama not available"  
**Fix:** `ollama serve` in a terminal

### Storage Bucket Not Found
**Error:** "Bucket not found"  
**Fix:** Create `submissions` bucket in Supabase Storage

### RLS Blocking Access
**Error:** "Permission denied"  
**Fix:** Run the RLS disable policies from earlier, or use service role key

### Image Upload Fails
**Error:** "Failed to upload image"  
**Fix:** Check storage policies are set correctly

---

## Success Criteria

You can confidently say "it works" when:

- ✅ Upload link generates correctly
- ✅ Upload page accepts images + brief
- ✅ AI generates 10-15 posts automatically
- ✅ Review page shows all posts
- ✅ Can select/delete posts
- ✅ CSV downloads with selected posts
- ✅ Database updates correctly

---

## Next Steps After Testing

If everything works:

1. **Create real upload links** for actual clients
2. **Send via WhatsApp** and get real feedback
3. **Build agency dashboard** to monitor all submissions
4. **Add WhatsApp auto-send** (currently manual)
5. **Improve AI prompts** based on client feedback

---

**Ready to test? Start with Step 1 (database migrations)!** 🚀
