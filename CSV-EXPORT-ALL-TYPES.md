# SocialDrive AI - CSV Export for All Upload Types

## CSV Format Support

The Sociamonials CSV export now supports **all 3 upload types**:

| Column | Images | Carousel | Video |
|--------|--------|----------|-------|
| `ImageURL` | ✅ Image URL | ❌ Empty |  Empty |
| `VideoURL` | ❌ Empty | ✅ Video/GIF URL | ✅ Video URL |
| `Message` | ✅ Caption | ✅ Caption | ✅ Caption |
| `TeamNote` | `Type: image` | `Type: carousel` | `Type: video` |

---

## How It Works

### Type 1: Images Only

**CSV Row:**
```csv
Message,ImageURL,VideoURL,TeamNote
"Fresh fade for the weekend! 💈✂️",https://supabase.co/.../image1.jpg,,Type: image
```

**Result:**
- Sociamonials imports as **image post**
- Uses `ImageURL` column
- `VideoURL` is empty

---

### Type 2: Carousel

**CSV Row:**
```csv
Message,ImageURL,VideoURL,TeamNote
"Watch this transformation! 🔥",,https://supabase.co/.../carousel.gif,Type: carousel
```

**Result:**
- Sociamonials imports as **video post**
- `ImageURL` is empty
- Uses `VideoURL` column (GIF or MP4)

---

### Type 3: Video Slideshow

**CSV Row:**
```csv
Message,ImageURL,VideoURL,TeamNote
"No Label Barber - Lads Lunch Special €50! 💈",,https://supabase.co/.../promo.mp4,Type: video
```

**Result:**
- Sociamonials imports as **video post**
- `ImageURL` is empty
- Uses `VideoURL` column (MP4)

---

## Code Example

```typescript
// Generate CSV with mixed post types
const posts = [
  {
    id: '1',
    caption_text: 'Fresh fade!',
    image_url: 'https://.../image1.jpg',
    post_type: 'image'  // ← Images only
  },
  {
    id: '2',
    caption_text: 'Transformation Tuesday!',
    video_url: 'https://.../carousel.gif',
    post_type: 'carousel'  // ← Carousel
  },
  {
    id: '3',
    caption_text: 'Lads Lunch Promo!',
    video_url: 'https://.../promo.mp4',
    post_type: 'video'  // ← Video slideshow
  }
]

const csv = generateSociamonialsCSV(posts, 'No Label Barber')
```

**Output CSV:**
```csv
Message,Link,ImageURL,VideoURL,Month,Day,Year,Hour,Minute,PinTitle,Category,Watermark,HashtagGroup,VideoThumbnailURL,CTAGroup,FirstComment,Story,PinterestBoard,AltText,PostPreset,TeamNote
"Fresh fade!",,https://.../image1.jpg,,1,15,2026,14,30,,,No Label Barber,,Default,,,,,,,Type: image
"Transformation Tuesday!",,,https://.../carousel.gif,1,16,2026,11,0,,,No Label Barber,,Default,,,,,,,Type: carousel
"Lads Lunch Promo!",,,https://.../promo.mp4,1,17,2026,10,15,,,No Label Barber,,Default,,,,,,,Type: video
```

---

## Sociamonials Import Behavior

### When `ImageURL` has value:
- ✅ Imports as **image post**
- Shows image in preview
- Caption from `Message` column

### When `VideoURL` has value:
- ✅ Imports as **video post**
- Shows video player (MP4) or animated GIF
- Caption from `Message` column
- Can auto-play on supported platforms

### When both are empty:
- ⚠️ **Error** - Sociamonials requires at least one media URL

### When both have values:
- ⚠️ **Video takes priority** - Sociamonials uses `VideoURL`

---

## Best Practices

### ✅ DO:
- Set `post_type` when creating posts
- Use `video_url` for carousels and videos
- Keep `image_url` empty for video posts
- Include `TeamNote` with type for reference

### ❌ DON'T:
- Put carousel GIF in `image_url` (won't animate)
- Leave both URLs empty (import will fail)
- Mix types in same CSV without marking them

---

## Upload Type → CSV Mapping

```typescript
// Upload: Images Only
submission_type: 'images'
↓
CSV: ImageURL = post.image_url
     VideoURL = ''
     TeamNote = 'Type: image'

// Upload: Carousel
submission_type: 'carousel'
↓
CSV: ImageURL = ''
     VideoURL = post.video_url (or generated carousel path)
     TeamNote = 'Type: carousel'

// Upload: Video Slideshow
submission_type: 'video'
↓
CSV: ImageURL = ''
     VideoURL = post.video_url (generated video path)
     TeamNote = 'Type: video'
```

---

## Database Schema

```sql
-- Add post_type column to posts table
ALTER TABLE posts 
ADD COLUMN post_type TEXT DEFAULT 'image' 
CHECK (post_type IN ('image', 'carousel', 'video'));

-- Add video_url column (if not exists)
ALTER TABLE posts 
ADD COLUMN video_url TEXT;

-- For submissions, track the type
ALTER TABLE submissions 
ADD COLUMN submission_type TEXT DEFAULT 'images'
CHECK (submission_type IN ('images', 'carousel', 'video'));
```

---

## Example Workflow

### Client: No Label Barber

**1. Upload:** Selects "Video Slideshow", uploads 15 images
**2. Processing:** Creates `promo.mp4` (30 seconds)
**3. Review:** Shows video player with captions
**4. Approve:** Client selects best caption
**5. Export:** Downloads CSV

**CSV contains:**
```csv
Message,ImageURL,VideoURL,TeamNote
"No Label Barber - Book your Lads Lunch special! 💈✂️",,https://.../promo.mp4,Type: video
```

**6. Import to Sociamonials:**
- Uploads CSV
- Sees video post in preview
- Schedules for Friday at 2pm
- Posts to Instagram Reels + Facebook

---

## Testing

### Test CSV with all types:

```csv
Message,ImageURL,VideoURL,TeamNote
"Image post test",https://example.com/image.jpg,,Type: image
"Carousel test",,https://example.com/carousel.gif,Type: carousel
"Video test",,https://example.com/video.mp4,Type: video
```

**Expected in Sociamonials:**
- Row 1: Image post with static image
- Row 2: Video post with animated GIF
- Row 3: Video post with MP4 video

---

## Future Enhancements

### Phase 1 (Done):
- ✅ Support all 3 types in CSV
- ✅ Add `post_type` field
- ✅ Auto-populate correct URL column

### Phase 2 (Next):
- [ ] Add `VideoThumbnailURL` for video posts
- [ ] Support multiple images per row (carousel posts)
- [ ] Add `Story` column for Instagram Stories

### Phase 3 (Later):
- [ ] Auto-generate thumbnails from videos
- [ ] Support TikTok-specific format
- [ ] Add LinkedIn video specs

---

## Quick Reference

| Upload Type | CSV Column | File Format | Max Size | Best For |
|-------------|------------|-------------|----------|----------|
| **Images** | `ImageURL` | JPG, PNG | 5MB | Single posts |
| **Carousel** | `VideoURL` | GIF, MP4 | 10MB | Before/after, multi-angle |
| **Video** | `VideoURL` | MP4 | 100MB | Promos, recaps, Reels |

---

## Summary

✅ **All 3 upload types export correctly to CSV**
✅ **Sociamonials imports videos from `VideoURL` column**
✅ **Images use `ImageURL`, videos use `VideoURL`**
✅ **`TeamNote` column tracks the type for reference**
✅ **No manual CSV editing needed - automatic!**
