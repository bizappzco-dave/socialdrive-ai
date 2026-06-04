# SocialDrive AI - Session Backup & Handoff
**Date:** June 4, 2026  
**Session:** Upload Flow + Permanent Links + Auto-Scheduling  
**Status:** ✅ Core features complete, needs final testing

---

## 🎯 What We Built Today

### **1. Permanent Upload Links** ✅
**Problem:** Upload links were stored in `submissions` table and got deleted during cleanup.

**Solution:** Store tokens on `clients` table (never deleted).

**Migration:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS upload_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS review_token TEXT UNIQUE;

UPDATE clients 
SET 
  upload_token = md5(random()::text || clock_timestamp()::text || id::text),
  review_token = md5(random()::text || clock_timestamp()::text || id::text)
WHERE upload_token IS NULL;
```

**Files Modified:**
- `database/migrations/add-permanent-upload-tokens.sql`
- `src/app/api/agency/clients/[id]/upload-link/route.ts`
- `src/app/api/agency/clients/route.ts`
- `src/app/api/submissions/upload/[token]/route.ts`

---

### **2. Review Page Auto-Scheduling** ✅
**Problem:** Clients had to manually schedule posts after picking favorites.

**Solution:** Auto-schedule with randomized times when clicking "Ready for Posting".

**Features:**
- Loads client schedule preferences (`default_schedule_type`, `default_posting_time`, `schedule_randomization`)
- Shows schedule info badge: "Mon/Wed/Fri at ~10:00 (±30 min) ⚠️ Anti-bot"
- Randomizes each post's time (anti-bot detection)
- Redirects to dashboard after scheduling

**Migration:**
```sql
-- Run in Supabase SQL Editor
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS default_schedule_type TEXT DEFAULT 'mwf' CHECK (default_schedule_type IN ('mwf', 'daily')),
ADD COLUMN IF NOT EXISTS default_posting_time TIME DEFAULT '10:00:00',
ADD COLUMN IF NOT EXISTS schedule_randomization INTEGER DEFAULT 30 CHECK (schedule_randomization >= 0 AND schedule_randomization <= 120);

UPDATE clients SET 
  default_schedule_type = COALESCE(default_schedule_type, 'mwf'),
  default_posting_time = COALESCE(default_posting_time, '10:00:00'),
  schedule_randomization = COALESCE(schedule_randomization, 30)
WHERE id IS NOT NULL;
```

**Files Modified:**
- `database/migrations/add-schedule-preferences.sql`
- `src/app/review/[token]/page.tsx`
- `src/app/api/posts/[id]/schedule/route.ts`

---

### **3. Upload Success Page Fix** ✅
**Problem:** "View Your Posts" button went to dashboard instead of review page.

**Solution:** Changed link to `/review/{token}` with correct copy.

**File Modified:**
- `src/app/upload/[token]/simple-page.tsx`

---

### **4. Image Optimization** ✅ (From Yesterday)
- Client-side image optimization (3MB → 0.2MB)
- Maintains aspect ratio, max 2048px
- 85% JPEG quality

**File:**
- `src/app/upload/[token]/simple-page.tsx`

---

### **5. MCP Barber Hashtags** ✅ (From Yesterday)
- Fixed JSON parsing errors from Ollama
- Added JSON recovery for malformed responses
- Barber-specific hashtags when `industry='barber'`

**Files:**
- `/home/dpmcg/image-analyzer-mcp/simple_http_server.py`
- `socialdrive-ai-upload-flow` skill

---

## 🔗 Permanent Links (After Migration)

### **No Label Academy:**
```
Upload: https://socialdrive-ai.vercel.app/upload/e6b0d7a40aca3399e2acd2aea7321331
Review: https://socialdrive-ai.vercel.app/review/{review_token}
```

**To get review token:**
1. Go to: https://socialdrive-ai.vercel.app/agency/clients
2. Click "View" on No Label Academy
3. Copy the review URL (will show after migration runs)

---

## 📊 Complete Flow (End-to-End)

```
1. Agency Dashboard
   URL: /agency/clients
   Action: Click "View" on client
   Result: Shows permanent upload + review links

2. Upload Page
   URL: /upload/{upload_token}
   Action: Upload 3-5 images + brief
   Result: 
     - Images optimized (3MB → 0.2MB)
     - MCP generates 9 captions (3 per image)
     - 9 posts created as "draft"
     - Success page with "Review & Select Favorites" button

3. Review Page
   URL: /review/{review_token}
   Action: 
     - Click heart ❤️ to select 3 favorites
     - Click "Ready for Posting"
   Result:
     - Auto-schedules with random times
     - Shows: "3 posts scheduled! Mon/Wed/Fri at ~10:00 (±30 min)"
     - Redirects to dashboard

4. Dashboard
   URL: /client/posting
   Action: View scheduled posts
   Result:
     - Shows image thumbnails
     - Platform filter (Instagram, Facebook, etc.)
     - Randomized times (9:47 AM, 10:23 AM, 10:15 AM)
     - Hashtags as blue badges (#BarberAcademy, #FadeGame)
```

---

## 🧪 Testing Checklist (Next Session)

### **Step 1: Run Migrations** (5 min)
```sql
-- 1. Permanent upload tokens
-- Copy from: database/migrations/add-permanent-upload-tokens.sql

-- 2. Schedule preferences
-- Copy from: database/migrations/add-schedule-preferences.sql
```

### **Step 2: Verify Permanent Links** (2 min)
```
1. Go to: https://socialdrive-ai.vercel.app/agency/clients
2. Click "View" on No Label Academy
3. Verify upload_url and review_url show
4. Verify links don't change on refresh
```

### **Step 3: Test Upload Flow** (5 min)
```
1. Open upload link
2. Upload 3-5 images + brief
3. Verify F12 console shows:
   - 📸 Optimized IMG_XXXX.JPG: 3.0MB → 0.2MB
   - [MCP] ✅ Generated 3 captions
   - Barber hashtags (#BarberAcademy, not #LocalBusiness)
4. Success page shows "Review & Select Favorites" button
5. Click button → goes to review page
```

### **Step 4: Test Review Page** (3 min)
```
1. Verify schedule info badge appears
2. Select 3 posts (click heart)
3. Click "Ready for Posting"
4. Verify success message shows schedule details
5. Verify redirect to dashboard
```

### **Step 5: Test Dashboard** (2 min)
```
1. Verify posts show with "scheduled" status
2. Verify randomized times (not all 10:00 AM sharp)
3. Verify image thumbnails load
4. Verify hashtags show as blue badges
5. Test platform filter
```

---

## 🐛 Known Issues / Watch Outs

### **1. Vercel Cache**
- After pushing code, wait 2-3 minutes for deploy
- Sometimes need to hard refresh (Cmd+Shift+R)
- Check Vercel dashboard for deploy status

### **2. Supabase RLS**
- Make sure service role key is used for migrations
- Client-side queries need proper RLS policies
- Test with `createAdminClient()` first

### **3. Ollama Session Limits**
- David mentioned hitting session limit yesterday
- Switch accounts if needed
- MCP server is on Railway (independent of local Ollama)

### **4. Old Data**
- Posts from before MCP fix have generic hashtags
- Test with FRESH upload to get barber hashtags
- Can clean up old data with:
  ```sql
  DELETE FROM posts WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';
  DELETE FROM submissions WHERE client_id = '4ffd9ffd-0da5-411d-8725-998f10107440';
  ```

---

## 📁 Key Files Reference

### **Frontend:**
- `/src/app/upload/[token]/simple-page.tsx` - Upload page
- `/src/app/upload/[token]/client.tsx` - Upload router (simple vs pro)
- `/src/app/review/[token]/page.tsx` - Review page (pick favorites)
- `/src/app/client/posting/page.tsx` - Dashboard
- `/src/app/client/posting/PostingQueueClient.tsx` - Dashboard UI

### **API:**
- `/src/app/api/agency/clients/route.ts` - List clients
- `/src/app/api/agency/clients/[id]/upload-link/route.ts` - Generate permanent link
- `/src/app/api/submissions/upload/[token]/route.ts` - Lookup upload token
- `/src/app/api/submissions/review/[token]/route.ts` - Lookup review token
- `/src/app/api/posts/[id]/schedule/route.ts` - Schedule post
- `/src/app/api/submissions/[id]/posts/route.ts` - Get posts for submission

### **Database:**
- `database/migrations/add-permanent-upload-tokens.sql` - Permanent links
- `database/migrations/add-schedule-preferences.sql` - Auto-scheduling

### **MCP Server:**
- `/home/dpmcg/image-analyzer-mcp/simple_http_server.py` - Caption generation

---

## 🚀 Next Steps (Priority Order)

1. **Run both migrations** (permanent tokens + schedule preferences)
2. **Test complete flow** (upload → review → dashboard)
3. **Verify random times** (anti-bot detection working)
4. **Document for clients** (how to use permanent link)
5. **Optional:** Add UI to change schedule preferences per client

---

## 💾 Skills to Load (Next Session)

```bash
# Load these skills at start of next session:
skill_view(name='socialdrive-ai-upload-flow')
skill_view(name='socialdrive-ai-submission-flow')
skill_view(name='socialdrive-ai-caption-fixes')
```

---

## 📞 Emergency Contacts / URLs

| Resource | URL |
|----------|-----|
| **Vercel Dashboard** | https://vercel.com/dashboard |
| **Supabase Dashboard** | https://supabase.com/dashboard |
| **Railway MCP** | https://social-drive-mcp-railway-production-cb81.up.railway.app/health |
| **SocialDrive AI** | https://socialdrive-ai.vercel.app |
| **GitHub Repo** | https://github.com/bizappzco-dave/socialdrive-ai |

---

## ✅ Success Criteria (Definition of Done)

**Upload flow is complete when:**
- ✅ Permanent links never change (survive cleanup)
- ✅ Image optimization works (3MB → 0.2MB)
- ✅ MCP generates barber-specific hashtags
- ✅ Review page shows schedule preferences
- ✅ Auto-scheduling with random times works
- ✅ Dashboard shows randomized times per post
- ✅ End-to-end test passes (upload → review → dashboard)

---

**Last Updated:** June 4, 2026  
**Next Session:** Continue from testing phase  
**Contact:** David (taskifiai@gmail.com)

---

**Notes for Next Session:**
- David prefers immediate documentation after work
- Save skills + memory after each significant task
- Test with fresh data (old posts have generic hashtags)
- Wait 2-3 minutes for Vercel deploys before testing
- Check F12 console for errors during upload
