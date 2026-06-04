# Review Page Auto-Scheduling - Complete ✅

**Date:** June 4, 2026  
**Time:** Morning session  
**Status:** ✅ Complete - Ready for testing

---

## 🎯 What Was Built

### **1. Database Migration**
**File:** `database/migrations/add-schedule-preferences.sql`

Added 3 columns to `clients` table:
- `default_schedule_type` - 'mwf' (Mon/Wed/Fri) or 'daily'
- `default_posting_time` - Base time (e.g., '10:00:00')
- `schedule_randomization` - Minutes of variation (±30 min default)

**To run migration:**
```bash
# Option 1: Run manually in Supabase SQL editor
# Copy contents of database/migrations/add-schedule-preferences.sql

# Option 2: Use the script (requires service role key)
export SUPABASE_SERVICE_ROLE_KEY="your-key-here"
./scripts/run-migration.sh
```

---

### **2. Review Page Updates**
**File:** `src/app/review/[token]/page.tsx`

**New Features:**

#### **A. Load Client Schedule Preferences**
```typescript
// Fetches from /api/agency/clients/{clientId}
scheduleInfo: {
  type: 'mwf' | 'daily'
  time: '10:00'
  randomization: 30
}
```

#### **B. Display Schedule Info**
Shows blue badge at top of review page:
```
🕐 Mon/Wed/Fri at ~10:00 (±30 min) ⚠️ Anti-bot
```

#### **C. Randomized Scheduling Algorithm**
```typescript
calculateRandomizedSchedule(type, time, randomization)
```

**How it works:**
1. Finds next valid date (Mon/Wed/Fri or Daily)
2. Sets base time (e.g., 10:00 AM)
3. Adds random offset: `Math.random() * (randomization * 2) - randomization`
4. Result: 9:47 AM, 10:23 AM, 10:15 AM (varies each time)

**Example:**
- Base: 10:00 AM
- Randomization: ±30 min
- Result: 9:47 AM (first post), 10:23 AM (second post), 10:15 AM (third post)

#### **D. Auto-Schedule on "Ready for Posting"**
When client clicks button:
1. Validates at least 1 post selected
2. Calculates randomized schedule for each post
3. Calls `/api/posts/{id}/schedule` for each post
4. Approves submission
5. Shows success message with schedule details
6. Redirects to `/client/posting` dashboard

**Success Message:**
```
✅ 3 posts scheduled!

Schedule: Mon/Wed/Fri at ~10:00 (±30 min)
Times vary to avoid bot detection.

Posts are ready in your dashboard!
```

---

### **3. New API Endpoint**
**File:** `src/app/api/posts/[id]/schedule/route.ts`

**Endpoint:** `POST /api/posts/{id}/schedule`

**Request:**
```json
{
  "scheduled_for": "2026-06-05T09:47:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "post_id": "abc123...",
  "scheduled_for": "2026-06-05T09:47:00.000Z"
}
```

**What it does:**
- Updates post status to 'scheduled'
- Sets `scheduled_for` timestamp
- Returns confirmation

---

## 📊 Complete Flow (End-to-End)

```
1. Client Uploads Images
   URL: /upload/53a6916397d6613af02afdfa000157fd
   Action: Upload 3-5 images + brief
   Result: 9 posts created (3 variations × 3 images)

2. Client Reviews Posts
   URL: /review/{token}
   Action: Click heart ❤️ to select favorites
   Shows: Schedule info badge (Mon/Wed/Fri at ~10:00 ±30 min)

3. Client Clicks "Ready for Posting"
   Action: Auto-schedule selected posts
   Logic: 
     - Finds next Mon/Wed/Fri dates
     - Sets base time (10:00 AM)
     - Adds random offset (±30 min)
   Result: Each post gets unique randomized time

4. Redirect to Dashboard
   URL: /client/posting
   Shows: Scheduled posts with actual times
   Example:
     - Post 1: Jun 5, 9:47 AM
     - Post 2: Jun 7, 10:23 AM
     - Post 3: Jun 9, 10:15 AM
```

---

## 🧪 Testing Checklist

### **Step 1: Run Database Migration**
```bash
# In Supabase dashboard → SQL editor
# Run: database/migrations/add-schedule-preferences.sql

# Verify columns added:
curl https://nmebpawvnhrokouksvir.supabase.co/rest/v1/clients?select=default_schedule_type,default_posting_time,schedule_randomization&id=eq.4ffd9ffd-0da5-411d-8725-998f10107440
```

**Expected:**
```json
[{
  "default_schedule_type": "mwf",
  "default_posting_time": "10:00:00",
  "schedule_randomization": 30
}]
```

---

### **Step 2: Test Review Page**

1. **Open review page:**
   ```
   https://socialdrive-ai.vercel.app/review/95fe60faf8f240cd890a610a1e383c9b
   ```

2. **Check schedule info badge appears:**
   ```
   🕐 Mon/Wed/Fri at ~10:00 (±30 min) ⚠️ Anti-bot
   ```

3. **Select 2-3 posts** (click heart icon ❤️)

4. **Click "Ready for Posting"**

5. **Verify success message:**
   ```
   ✅ 3 posts scheduled!
   Schedule: Mon/Wed/Fri at ~10:00 (±30 min)
   Times vary to avoid bot detection.
   Posts are ready in your dashboard!
   ```

6. **Verify redirect to dashboard:**
   ```
   https://socialdrive-ai.vercel.app/client/posting
   ```

---

### **Step 3: Verify Dashboard**

1. **Check posts show scheduled times:**
   - Look for posts with status "scheduled"
   - Verify times are randomized (not all 10:00 AM sharp)

2. **Expected times:**
   ```
   Post 1: Jun 5, 9:47 AM  ← Randomized
   Post 2: Jun 7, 10:23 AM ← Randomized
   Post 3: Jun 9, 10:15 AM ← Randomized
   ```

---

### **Step 4: Test Fresh Upload**

1. **Upload new images:**
   ```
   https://socialdrive-ai.vercel.app/upload/53a6916397d6613af02afdfa000157fd
   ```

2. **Wait for MCP to generate captions** (should have barber hashtags now)

3. **Go to review page** (link in success page)

4. **Select favorites → Ready for Posting**

5. **Verify complete flow works end-to-end**

---

## 🐛 Known Issues / TODO

### **1. Old Posts Have Generic Hashtags**
**Problem:** Posts from before MCP fix have `#LocalBusiness` instead of `#BarberAcademy`

**Solution:** Test with fresh upload (new posts will have barber hashtags)

---

### **2. Client Preferences Not Set Yet**
**Problem:** Migration hasn't been run, so `scheduleInfo` will be null

**Solution:** Run migration first (see Step 1 above)

---

### **3. No UI to Change Preferences**
**Problem:** Can't change schedule type/time/randomization per client

**Future Enhancement:**
- Add settings page in `/client/settings`
- Or add to agency dashboard for David to manage

---

## 📝 Files Modified

| File | Changes | Lines |
|------|---------|-------|
| `database/migrations/add-schedule-preferences.sql` | NEW - Schedule columns | 19 |
| `scripts/run-migration.sh` | NEW - Migration script | 52 |
| `src/app/review/[token]/page.tsx` | UPDATED - Auto-scheduling | +108, -21 |
| `src/app/api/posts/[id]/schedule/route.ts` | NEW - Schedule endpoint | 46 |

**Total:** 4 files, ~225 lines added

---

## 🎯 Anti-Bot Randomization Details

### **Why Randomize?**
Posting at exact same time daily is a bot signal. Platforms detect:
- Predictable patterns
- Exact minute precision
- No human variation

### **Our Solution:**
```
Base Time: 10:00 AM
Randomization: ±30 minutes
Window: 9:30 AM - 10:30 AM (60 min range)

Each post gets independent random offset:
Post 1: 10:00 - 13 min = 9:47 AM
Post 2: 10:00 + 23 min = 10:23 AM
Post 3: 10:00 + 15 min = 10:15 AM
```

### **Configurable Per Client:**
| Client Type | Randomization | Window |
|-------------|---------------|--------|
| Barber shop | ±30 min | 60 min |
| Restaurant | ±45 min | 90 min |
| Retail | ±30 min | 60 min |
| Agency | ±60 min | 120 min |
| Personal brand | ±15 min | 30 min |

**Default:** ±30 minutes (good for most clients)

---

## ✅ Success Criteria

**Review page is working when:**
- ✅ Schedule info badge appears
- ✅ Client can select posts with heart icon
- ✅ "Ready for Posting" schedules posts with random times
- ✅ Success message shows schedule details
- ✅ Redirects to dashboard
- ✅ Dashboard shows randomized times per post
- ✅ No two posts have exact same scheduled time

---

## 🚀 Next Steps (After Testing)

1. **Test with fresh upload** (to get barber hashtags)
2. **Verify randomization works** (check times in dashboard)
3. **Add UI to change preferences** (optional, nice-to-have)
4. **Document for clients** (explain why times vary)
5. **Monitor first few scheduled posts** (verify they publish correctly)

---

**Status:** ✅ Ready for testing  
**Test URL:** https://socialdrive-ai.vercel.app/review/95fe60faf8f240cd890a610a1e383c9b  
**Dashboard:** https://socialdrive-ai.vercel.app/client/posting

---

**Built by:** Hermes Agent  
**Time:** Morning session, June 4, 2026  
**Next:** David to test and verify
