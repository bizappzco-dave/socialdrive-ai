# Supabase Storage Setup

## Create Storage Bucket for Submissions

### Step 1: Go to Storage

1. Open: https://nmebpawvnhrokouksvir.supabase.co
2. Click **Storage** in left sidebar
3. Click **New bucket**

### Step 2: Create Bucket

**Bucket name:** `submissions`  
**Public:** No (keep private)  
**File size limit:** `10485760` (10MB)  
**Allowed MIME types:** `image/*`

Click **Create bucket**

### Step 3: Set Storage Policies

Click on the `submissions` bucket → **Policies** tab → **New policy**

#### Policy 1: Allow authenticated users to upload

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Allow uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');
```

#### Policy 2: Allow public read access (for viewing images)

```sql
-- Allow public read access to uploaded images
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'submissions');
```

#### Policy 3: Allow users to delete their own files

```sql
-- Allow authenticated users to delete their own files
CREATE POLICY "Allow delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'submissions');
```

### Step 4: Verify

Your storage setup should now have:
- ✅ Bucket: `submissions`
- ✅ 3 policies (upload, read, delete)
- ✅ Ready for image uploads!

---

## Test Upload

After running the migrations and setting up storage:

1. Create an upload link:
   ```bash
   npx tsx scripts/create-upload-link.ts "No Label Barber"
   ```

2. Go to the upload URL

3. Upload a test image

4. Check Supabase Storage → `submissions` bucket → should see the uploaded file!

---

## Troubleshooting

**Error: "Bucket not found"**
- Make sure you created the `submissions` bucket exactly (lowercase)

**Error: "Permission denied"**
- Check storage policies are set correctly
- Make sure you're using the service role key in `.env.local`

**Error: "File too large"**
- Default limit is 10MB
- Increase in bucket settings if needed
