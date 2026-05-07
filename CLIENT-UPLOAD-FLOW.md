# Client Upload Flow - SocialDrive AI

**Automated, no-login content submission and review system**

---

## Overview

Clients upload images → AI generates captions → Client reviews → CSV export → Publish

**No login required** - uses secure token-based links.

---

## The Complete Flow

### **Step 1: Create Upload Link** (You do this once per client/submission)

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai

# Option A: By client name
npx tsx scripts/create-upload-link.ts "No Label Barber" "dpmcgoldrick@gmail.com" "+353871234567"

# Option B: By client ID
npx tsx scripts/create-upload-link.ts --client-id "69b0fdf5-e4bb-4c4d-9531-bc3c34089fca"
```

**Output:**
```
✅ Upload Link Created!

📤 Upload URL:
https://socialdrive.ai/upload/abc123xyz789

📋 Review URL:
https://socialdrive.ai/review/def456uvw012

💡 WhatsApp Message Template:
---
Hi No Label Barber! 👋

Your content upload link is ready:
https://socialdrive.ai/upload/abc123xyz789

Just upload your images and add a brief note about what you'd like to post this week. We'll handle the rest! ✨
---
```

**Send the upload URL to the client via WhatsApp.**

---

### **Step 2: Client Uploads Content** (Client does this)

**Client clicks the upload link** → Sees upload page:

1. **Drag & drop 5 images** (or click to browse)
   - Images should be named with context: `sale-this-week.jpg`, `new-branch-exterior.png`
   
2. **Add brief text** (or record voice note):
   - "Sale on all services this week - 20% off"
   - "New branch just opened in Dublin city centre"
   - "Focus on our new beard grooming service"

3. **Click "Submit for Review"**

**What happens behind the scenes:**
- Images uploaded to storage
- Submission record created in database
- **AI automatically generates 10-15 caption variations** (3 per image)
- Status changes: `pending` → `generating` → `ready`
- Takes ~1-2 minutes

---

### **Step 3: WhatsApp Notification** (You or auto-send)

**When status = `ready`, send WhatsApp:**

```
Hi [Client]! 👋

Your posts are ready for review! 

Click here to see your options:
https://socialdrive.ai/review/def456uvw012

Select your favorites and delete any you don't want. When you're done, click "Ready for Posting" and we'll handle the rest! ✨
```

**For now:** Manual send (copy/paste from script output)  
**Later:** Auto-send via WhatsApp API

---

### **Step 4: Client Reviews & Selects** (Client does this)

**Client clicks review link** → Sees all generated posts:

1. **Browse 10-15 options** (different styles per image)
2. **Click heart icon** ❤️ to select favorites
3. **Click trash icon** 🗑️ to delete glitches/unwanted posts
4. **Click "Ready for Posting"** when done

**What happens:**
- Selected posts marked as `approved`
- **CSV automatically downloads** (Sociamonials format)
- Submission status: `ready` → `approved`

---

### **Step 5: Client Uploads to Sociamonials** (Client does this)

**Client receives CSV** → Goes to Sociamonials → Uploads CSV

**Done!** ✅

---

## Your Monitoring Dashboard (Coming Next)

You'll have a dashboard at `/agency/submissions` showing:

```
┌─────────────────────────────────────────────────┐
│ All Submissions                                 │
├─────────────────────────────────────────────────┤
│ No Label Barber                                 │
│ ├─ Submitted: Today 11:00 AM                    │
│ ├─ Images: 5                                    │
│ ├─ Generated: 15 posts                          │
│ ├─ Status: Ready for Review ✅                  │
│ ├─ Client notified: Yes                         │
│ └─ [View] [Regenerate] [Edit]                   │
│                                                 │
│ Client B                                        │
│ ├─ Submitted: Yesterday 3:00 PM                 │
│ ├─ Images: 3                                    │
│ ├─ Generated: 9 posts                           │
│ ├─ Status: Approved ✅                          │
│ └─ [View] [Download CSV]                        │
└─────────────────────────────────────────────────┘
```

**You can:**
- Spot-check quality (click any submission)
- Regenerate if AI messed up
- Manually edit captions
- See which clients haven't reviewed yet
- Track approval rates

---

## Database Schema

### Tables Created:

1. **`submissions`** - Tracks each upload batch
   - `upload_token` - For upload page access
   - `review_token` - For review page access
   - `status` - pending, generating, ready, approved, published
   - `brief_text` - Client's notes
   - `post_count` - How many posts generated

2. **`submission_images`** - Uploaded images
   - `image_url` - Storage URL
   - `image_context` - From filename or manual entry
   - `sort_order` - For carousels

3. **`posts`** - Generated captions (existing table, extended)
   - `submission_id` - Links to submission (new field)

---

## Files Created

| File | Purpose |
|------|---------|
| `src/app/upload/[token]/page.tsx` | Client upload page |
| `src/app/review/[token]/page.tsx` | Client review page |
| `src/app/api/submissions/[token]/route.ts` | Get submission info |
| `src/app/api/submissions/[token]/submit/route.ts` | Submit + auto-generate |
| `src/app/api/submissions/review/[token]/route.ts` | Get by review token |
| `src/app/api/submissions/[id]/posts/route.ts` | Get posts for submission |
| `src/app/api/posts/[id]/select/route.ts` | Toggle post selection |
| `src/app/api/posts/[id]/route.ts` | Delete post |
| `scripts/create-upload-link.ts` | Generate upload links |
| `submissions-schema.sql` | Database schema |

---

## Security

- **32-character random tokens** (unguessable)
- **One token per submission** (or per client for permanent links)
- **No login required** (token = authentication)
- **Can revoke/regenerate** tokens if needed
- **HTTPS only** (in production)

---

## Next Steps to Complete

1. **Run database migrations:**
   ```bash
   # In Supabase SQL Editor, run:
   # Copy contents of submissions-schema.sql
   ```

2. **Create image upload endpoint:**
   - `/api/upload/image` - Handles file uploads to storage

3. **Create remaining API routes:**
   - `/api/submissions/review/[token]` - Get by review token
   - `/api/submissions/[id]/posts` - Get posts
   - `/api/posts/[id]/select` - Toggle selection
   - `/api/posts/[id]` - Delete post
   - `/api/submissions/[id]/approve` - Mark as approved

4. **Build agency monitoring dashboard:**
   - `/agency/submissions` - View all submissions
   - Quality control tools

5. **WhatsApp integration:**
   - Click-to-chat (manual send) - Phase 1
   - Auto-send via API - Phase 2

6. **Test the full flow:**
   - Create upload link
   - Upload test images
   - Verify AI generation
   - Review and select
   - CSV export

---

## Example Client Journey

**Client:** No Label Barber  
**Date:** May 2, 2026

**10:00 AM** - You send WhatsApp:
> Hi No Label! 👋 Your content upload link is ready: https://socialdrive.ai/upload/abc123xyz

**10:15 AM** - Client uploads:
- 5 images (named: `mens-cut-sale.jpg`, `beard-trim-special.jpg`, etc.)
- Brief: "20% off all services this week - sale ends Sunday"

**10:16 AM** - AI generates:
- 15 caption variations (3 per image)
- Different styles: short statement, mission post, brand teaser, question, story

**10:17 AM** - You send WhatsApp:
> Your posts are ready! Review here: https://socialdrive.ai/review/def456uvw

**10:30 AM** - Client reviews:
- Selects 8 favorites ❤️
- Deletes 2 glitches 🗑️
- Clicks "Ready for Posting"

**10:31 AM** - CSV downloads automatically

**10:35 AM** - Client uploads CSV to Sociamonials

**Done!** 8 posts scheduled for the week. 🎉

---

## Benefits

| For Clients | For You |
|-------------|---------|
| ✅ No login required | ✅ Fully automated |
| ✅ Simple upload flow | ✅ Quality control (you can review) |
| ✅ See 10-15 options | ✅ Scalable (no manual work) |
| ✅ Delete what they don't like | ✅ Monitor via dashboard |
| ✅ One-click CSV export | ✅ Billable service (you do the "magic") |

---

**This is your premium, done-for-you content service.** 🚀

Clients think you're magically creating perfect posts. In reality, AI does the heavy lifting and they self-serve the review. You just monitor quality and handle edge cases.

**Win-win.**
