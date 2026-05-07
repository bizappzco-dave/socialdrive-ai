# Upload Page Update Summary - Image to Carousel & Video

**Date:** 2026-05-06 05:55 GMT+1  
**Status:** ✅ Code Complete, Ready for Testing

---

## What We Built

Added **3 upload format options** to the SocialDrive AI upload page:

1. **Images Only** - Traditional individual posts (3-5 images)
2. **Carousel** - Multi-image animated GIF (3-10 images)
3. **Video Slideshow** - MP4 video from images (3-20 images)

---

## Files Changed

### Frontend (2 files)
1. **`src/app/upload/[token]/page.tsx`**
   - Added format selector with 3 cards
   - Dynamic image count validation
   - Real-time tips for each format
   - Icons: Image, Grid3x3, Film

2. **`src/app/review/[token]/page.tsx`**
   - Added video/carousel media display
   - Video player for MP4 posts
   - GIF display for carousel posts
   - Type badges (🎬 Video, 🎠 Carousel)
   - Play icon overlay for video content

### Backend (1 file)
3. **`src/app/api/submissions/upload/[token]/submit/route.ts`**
   - Upload type validation
   - Image count limits per type
   - `submission_type` tracking
   - `post_type` assignment
   - Video generation integration
   - Calls `video-creator.py` for carousel/video

### Database (1 migration)
4. **`migrations/add-upload-types-and-video-url.sql`**
   - `submissions.submission_type` column
   - `posts.post_type` column
   - `posts.video_url` column
   - Indexes for performance
   - Data migration for existing records

### Documentation (2 files)
5. **`UPLOAD-TYPES-IMPLEMENTATION.md`**
   - Complete implementation guide
   - User workflows
   - Testing checklist
   - Troubleshooting

6. **`UPLOAD-PAGE-UPDATE-SUMMARY.md`**
   - This file - quick reference

---

## Database Migration Required

**Run this first** in Supabase SQL Editor:

```bash
# File: migrations/add-upload-types-and-video-url.sql
```

**Steps:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy/paste migration SQL
4. Run
5. Verify columns exist

---

## How It Works

### Upload Flow

```
User selects format → Uploads images → Submits
         ↓
Backend validates type & count
         ↓
Generates AI captions for each image
         ↓
For carousel/video: calls video-creator.py
         ↓
Creates posts with correct post_type
         ↓
Stores video_url for carousel/video posts
```

### Review Flow

```
User opens review link
         ↓
Sees posts grid
         ↓
Image posts: shows static image
Carousel posts: shows animated GIF
Video posts: shows MP4 player with play button
         ↓
Selects favorite captions
         ↓
Downloads CSV with correct columns
```

### CSV Export

| Post Type | ImageURL | VideoURL | TeamNote |
|-----------|----------|----------|----------|
| Image | ✅ URL | (empty) | Type: image |
| Carousel | (empty) | ✅ GIF URL | Type: carousel |
| Video | (empty) | ✅ MP4 URL | Type: video |

---

## Testing Steps

### 1. Run Migration
```sql
-- In Supabase SQL Editor
-- Run: migrations/add-upload-types-and-video-url.sql
```

### 2. Test Upload Page Locally
```bash
cd socialdrive-ai
npm run dev
# Visit: http://localhost:3000/upload/[token]
```

**Test each format:**
- [ ] Images Only (3-5 images)
- [ ] Carousel (3-10 images)
- [ ] Video (3-20 images)

**Check:**
- Format selector shows 3 options
- Image count validation works
- Helpful tips display correctly

### 3. Test Video Generation
```bash
# After submitting carousel/video upload
# Check logs for video-creator.py execution
# Verify output file created in /tmp/
```

### 4. Test Review Page
```bash
# Visit: http://localhost:3000/review/[token]
```

**Check:**
- Image posts show normally
- Carousel posts show GIF
- Video posts show MP4 player with play button
- Type badges visible (🎬 Video, 🎠 Carousel)

### 5. Test CSV Export
- Select posts
- Click "Ready for Posting"
- Open CSV
- Verify correct columns for each type

### 6. Test Sociamonials Import
- Import CSV to Sociamonials
- Verify video posts import correctly
- Check video plays in SM preview

---

## Example Client Workflows

### No Label Barber - Before/After Carousel

**Upload:**
- Format: Carousel
- Images: 3 (before, during, after)
- Brief: "Signature fade service"

**Result:**
- 1 animated GIF carousel
- 3 caption options
- CSV with VideoURL column
- Instagram carousel post

---

### Restaurant - Weekly Specials Video

**Upload:**
- Format: Video Slideshow
- Images: 12 (dish photos)
- Brief: "20% off this week"

**Result:**
- 1 MP4 video (30 seconds)
- 1 caption describing specials
- CSV with VideoURL column
- Facebook/Instagram Reels video

---

### Standard Client - Image Posts

**Upload:**
- Format: Images Only
- Images: 4 (services)
- Brief: "General awareness"

**Result:**
- 12 posts (4 images × 3 captions each)
- CSV with ImageURL column
- 4 individual static posts

---

## Video Generation Details

### Script: `video-creator.py`

**Location:** `/home/dpmcg/.openclaw/workspace/socialdrive-ai/video-creator.py`

**Commands:**
```bash
# Carousel
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg --output carousel.gif

# Video
python3 video-creator.py video img1.jpg ... img12.jpg --output video.mp4
```

**Integration:**
- Called from submit route
- 2-minute timeout
- Output to `/tmp/` directory
- URL stored in `posts.video_url`

---

## Next Steps

### Immediate (David)
1. ✅ Review code changes
2. ⏳ Run database migration
3. ⏳ Test locally with all 3 formats
4. ⏳ Verify video generation works
5. ⏳ Test review page display
6. ⏳ Test CSV export/import

### This Week
- Deploy to Vercel
- Test with No Label Barber (real client)
- Monitor video generation performance
- Collect feedback

### Next Week
- Optimize video quality/size if needed
- Add thumbnail generation for videos
- Consider adding music/audio option
- Track engagement metrics (video vs image)

---

## Key Features

✅ **Format Selector** - Clear 3-card UI  
✅ **Smart Validation** - Different limits per type  
✅ **Auto Video Generation** - Seamless backend processing  
✅ **Review Page Support** - Video player, GIF display  
✅ **CSV Export** - Correct columns for Sociamonials  
✅ **Type Tracking** - Database schema updated  
✅ **Documentation** - Complete guides created  

---

## Questions?

**Implementation details:** See `UPLOAD-TYPES-IMPLEMENTATION.md`  
**CSV mapping:** See `CSV-EXPORT-ALL-TYPES.md`  
**Migration:** See `migrations/add-upload-types-and-video-url.sql`  
**Video script:** See `video-creator.py`

---

**Ready to test!** 🚀
