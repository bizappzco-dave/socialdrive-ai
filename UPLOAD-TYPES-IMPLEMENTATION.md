# Upload Types Implementation - Image to Carousel & Video

**Date:** 2026-05-06  
**Status:** ✅ Ready for Testing

---

## Overview

The upload page now supports **3 upload types**:

1. **Images Only** - Individual posts (3-5 images → 3-5 separate posts with 3 caption variations each)
2. **Carousel** - Multi-image animated GIF (3-10 images → 1 carousel post)
3. **Video Slideshow** - MP4 video (3-20 images → 1 video post)

---

## User Flow

### 1. Upload Page (`/upload/[token]`)

**New Features:**
- Format selector (3 cards: Images, Carousel, Video)
- Dynamic image count guidance
- Real-time validation feedback

**Image Count Rules:**
- **Images:** 3-5 recommended (max 5)
- **Carousel:** 3-10 images
- **Video:** 3-20 images (10+ recommended for best results)

### 2. Backend Processing

**Submit Route:** `/api/submissions/upload/[token]/submit`

**What Happens:**
1. Validates upload type and image count
2. Stores images in `submission_images`
3. Generates AI captions for each image
4. **NEW:** For carousel/video, calls `video-creator.py` to generate media
5. Creates posts with correct `post_type` and `video_url`

### 3. Review Page (`/review/[token]`)

**For Image Posts:**
- Shows individual images with caption options
- User selects best caption for each

**For Carousel/Video:**
- Shows generated GIF/MP4 video player
- Single caption selection (applies to entire carousel/video)
- Preview of final output

---

## Database Changes

### New Columns

**submissions table:**
```sql
submission_type TEXT DEFAULT 'images'
  CHECK (submission_type IN ('images', 'carousel', 'video'))
```

**posts table:**
```sql
post_type TEXT DEFAULT 'image'
  CHECK (post_type IN ('image', 'carousel', 'video'))

video_url TEXT  -- URL to generated GIF/MP4
```

### Migration

Run this in Supabase SQL Editor:
```bash
# File: migrations/add-upload-types-and-video-url.sql
```

**Steps:**
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste migration SQL
3. Run
4. Verify columns exist

---

## CSV Export Mapping

When exporting to Sociamonials CSV:

| Upload Type | ImageURL Column | VideoURL Column | TeamNote |
|-------------|-----------------|-----------------|----------|
| **Images** | `post.image_url` | `''` (empty) | `Type: image` |
| **Carousel** | `''` (empty) | `post.video_url` (GIF) | `Type: carousel` |
| **Video** | `''` (empty) | `post.video_url` (MP4) | `Type: video` |

**Key Rule:** Video posts use `VideoURL` column, not `ImageURL`.

---

## Video Generation

### Script: `video-creator.py`

**Location:** `/home/dpmcg/.openclaw/workspace/socialdrive-ai/video-creator.py`

**Usage:**
```bash
# Carousel (GIF)
python3 video-creator.py carousel image1.jpg image2.jpg image3.jpg --output carousel.gif

# Video (MP4)
python3 video-creator.py video image1.jpg image2.jpg ... image10.jpg --output video.mp4
```

**Features:**
- Auto-resizes images to consistent dimensions
- Adds smooth transitions
- Sets appropriate duration per image
- Optimizes file size for social media

### Integration in Submit Route

```typescript
// For carousel/video types
const command = `cd /home/dpmcg/.openclaw/workspace/socialdrive-ai && 
  python3 video-creator.py ${type} ${imagePaths} --output ${outputPath} 2>&1`

const { stdout, stderr } = await execPromise(command, { timeout: 120000 })
```

**Timeout:** 2 minutes (120 seconds)  
**Output:** `/tmp/carousel-{id}.gif` or `/tmp/video-{id}.mp4`

---

## Testing Checklist

### ✅ Upload Page
- [ ] Format selector shows 3 options
- [ ] Clicking each type updates UI
- [ ] Image count validation works
- [ ] Helpful tips show for each type
- [ ] Drag & drop works
- [ ] File previews load correctly

### ✅ Backend Processing
- [ ] Submit route validates upload type
- [ ] Correct image count limits enforced
- [ ] `submission_type` saved to database
- [ ] `post_type` set correctly for each post
- [ ] Video generation runs for carousel/video
- [ ] Generated media URL saved to posts

### ✅ Review Page
- [ ] Image posts show individual images
- [ ] Carousel posts show GIF player
- [ ] Video posts show MP4 player
- [ ] Caption selection works for all types
- [ ] CSV export has correct columns

### ✅ CSV Export
- [ ] Image posts: `ImageURL` filled, `VideoURL` empty
- [ ] Carousel posts: `ImageURL` empty, `VideoURL` filled with GIF
- [ ] Video posts: `ImageURL` empty, `VideoURL` filled with MP4
- [ ] `TeamNote` column shows type
- [ ] Import to Sociamonials works

---

## Example Workflows

### Workflow 1: No Label Barber - Before/After Carousel

**Client Uploads:**
- Format: Carousel
- Images: 3 (before, during, after haircut)
- Brief: "Show off our signature fade service"

**System Generates:**
- 1 carousel GIF (animated before → after)
- 3 caption variations to choose from
- CSV with `VideoURL` pointing to GIF

**Client Reviews:**
- Sees animated GIF in review page
- Selects best caption
- Downloads CSV
- Imports to Sociamonials as video post

**Result:** Instagram carousel post with smooth transition

---

### Workflow 2: Restaurant - Weekly Specials Video

**Client Uploads:**
- Format: Video Slideshow
- Images: 12 (photos of different dishes)
- Brief: "Promote this week's specials, mention 20% off"

**System Generates:**
- 1 MP4 video (30 seconds, 2.5s per image)
- 1 caption variation (describes all dishes)
- CSV with `VideoURL` pointing to MP4

**Client Reviews:**
- Watches video preview
- Approves caption
- Downloads CSV
- Uploads to Sociamonials

**Result:** Facebook/Instagram Reels video showcasing menu items

---

### Workflow 3: Standard Image Posts

**Client Uploads:**
- Format: Images Only
- Images: 4 (different services)
- Brief: "General awareness posts for this week"

**System Generates:**
- 12 posts total (4 images × 3 caption variations each)
- Each post has unique caption options
- CSV with `ImageURL` for each

**Client Reviews:**
- Sees 4 image cards
- Each card has 3 caption options
- Selects favorite for each image
- Downloads CSV

**Result:** 4 individual static posts, ready to schedule

---

## File Changes

### Frontend
- ✅ `src/app/upload/[token]/page.tsx` - Added format selector, validation

### Backend
- ✅ `src/app/api/submissions/upload/[token]/submit/route.ts` - Added type handling, video generation

### Database
- ✅ `migrations/add-upload-types-and-video-url.sql` - New columns

### Documentation
- ✅ `UPLOAD-TYPES-IMPLEMENTATION.md` - This file
- ✅ `CSV-EXPORT-ALL-TYPES.md` - Updated with type mapping

### Scripts
- ✅ `video-creator.py` - Already exists, handles carousel + video

---

## Next Steps

### Phase 1 (Done):
- ✅ Upload page UI with format selector
- ✅ Backend validation and routing
- ✅ Database schema updates
- ✅ Video generation integration

### Phase 2 (Testing):
- [ ] Run database migration
- [ ] Test upload page locally
- [ ] Test carousel generation
- [ ] Test video generation
- [ ] Verify review page shows media correctly
- [ ] Test CSV export/import flow

### Phase 3 (Production):
- [ ] Deploy to Vercel
- [ ] Test with No Label Barber (real client)
- [ ] Monitor video generation performance
- [ ] Collect feedback on UI/UX
- [ ] Optimize video quality/size if needed

---

## Troubleshooting

### Video Generation Fails

**Check:**
1. Python script exists: `ls -la video-creator.py`
2. Dependencies installed: `pip3 list | grep movie`
3. Timeout not too short (increase from 120s if needed)
4. Image paths are accessible

**Logs:**
```bash
# Check submit route logs
tail -f .next/server/app/api/submissions/upload/[token]/submit/route.js
```

### Review Page Doesn't Show Video

**Check:**
1. `post_type` column exists in posts table
2. `video_url` has value (not null)
3. Review page checks for `post_type` and renders video player

**Fix:**
```tsx
// In review page
{post.post_type === 'video' || post.post_type === 'carousel' ? (
  <video src={post.video_url} controls />
) : (
  <img src={post.image_url} />
)}
```

### CSV Import Fails in Sociamonials

**Check:**
1. `VideoURL` column exists in Sociamonials import template
2. URL is publicly accessible (not localhost)
3. File format supported (GIF/MP4)
4. File size under Sociamonials limit (100MB)

---

## Summary

✅ **3 upload types now supported**  
✅ **Automatic video/GIF generation**  
✅ **Correct CSV export for all types**  
✅ **Ready for production testing**

**Migration required:** Run `migrations/add-upload-types-and-video-url.sql`  
**Test clients:** No Label Barber (premium), friendly standard clients  
**Expected impact:** Higher engagement with video/carousel content
