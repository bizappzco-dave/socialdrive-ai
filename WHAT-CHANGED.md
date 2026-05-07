# What Changed - Upload Types Feature

**Quick reference for developers**

---

## Frontend Changes

### Upload Page (`src/app/upload/[token]/page.tsx`)

**BEFORE:**
- Single upload type (images only)
- Upload 3-5 images
- Generate 3 caption variations per image

**AFTER:**
- 3 format options (Images, Carousel, Video)
- Different image counts per type
- Auto-generate GIF/MP4 for carousel/video
- Smart validation & tips

**New UI Components:**
```tsx
// Format selector cards
<button onClick={() => setUploadType('images')}>
  <Image /> Images Only
</button>
<button onClick={() => setUploadType('carousel')}>
  <Grid3x3 /> Carousel
</button>
<button onClick={() => setUploadType('video')}>
  <Film /> Video Slideshow
</button>
```

**New State:**
```typescript
const [uploadType, setUploadType] = useState<'images' | 'carousel' | 'video'>('images')
```

---

### Review Page (`src/app/review/[token]/page.tsx`)

**BEFORE:**
- Only showed static images
- No video player
- No type badges

**AFTER:**
- Shows video player for MP4 posts
- Shows GIF for carousel posts
- Type badges (🎬 Video,  Carousel)
- Play icon overlay

**New Logic:**
```tsx
{post.post_type === 'video' || post.post_type === 'carousel' ? (
  post.video_url ? (
    post.post_type === 'video' ? (
      <video src={post.video_url} controls />
    ) : (
      <img src={post.video_url} alt="Carousel" />
    )
  ) : (
    <p>Media generating...</p>
  )
) : (
  <img src={post.image_url} />
)}
```

**New Post Interface:**
```typescript
interface Post {
  id: string
  caption_text: string
  image_url: string
  video_url?: string | null      // NEW
  post_type?: 'image' | 'carousel' | 'video'  // NEW
  caption_style: string
  selected: boolean
  hashtags: string[]
  emoji_count: number
}
```

---

## Backend Changes

### Submit Route (`src/app/api/submissions/upload/[token]/submit/route.ts`)

**BEFORE:**
- Only handled image uploads
- Generated 3 caption variations per image
- No media generation

**AFTER:**
- Validates upload type
- Different image count limits
- Generates 1 variation for carousel/video
- Calls `video-creator.py` for media generation
- Sets `post_type` and `video_url`

**New Validation:**
```typescript
const validTypes = ['images', 'carousel', 'video']
const type = (uploadType || 'images') as 'images' | 'carousel' | 'video'

const minImages = type === 'video' ? 3 : 3
const maxImages = type === 'images' ? 5 : type === 'carousel' ? 10 : 20
```

**New Media Generation:**
```typescript
if (type === 'carousel' || type === 'video') {
  const command = `python3 video-creator.py ${type} ${imagePaths} --output ${outputPath}`
  const { stdout, stderr } = await execPromise(command, { timeout: 120000 })
  
  // Update posts with video URL
  await supabase.from('posts').update({ 
    video_url: generatedMediaUrl,
    post_type: type 
  })
}
```

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

video_url TEXT
```

**Migration File:** `migrations/add-upload-types-and-video-url.sql`

---

## CSV Export Changes

**BEFORE:**
```csv
Message,ImageURL,TeamNote
"Caption text",https://image.jpg,Type: image
```

**AFTER:**
```csv
Message,ImageURL,VideoURL,TeamNote
"Caption text",https://image.jpg,,Type: image
"Caption text",,https://carousel.gif,Type: carousel
"Caption text",,https://video.mp4,Type: video
```

**Export Logic:**
```typescript
SELECT 
  caption_text as Message,
  CASE WHEN post_type IN ('carousel', 'video') THEN '' ELSE image_url END as ImageURL,
  CASE WHEN post_type IN ('carousel', 'video') THEN video_url ELSE '' END as VideoURL,
  'Type: ' || post_type as TeamNote
FROM posts
```

---

## File Summary

### Modified Files (3)
1. `src/app/upload/[token]/page.tsx` - Format selector, validation
2. `src/app/review/[token]/page.tsx` - Video player, type badges
3. `src/app/api/submissions/upload/[token]/submit/route.ts` - Type handling, media generation

### New Files (4)
1. `migrations/add-upload-types-and-video-url.sql` - Database schema
2. `UPLOAD-TYPES-IMPLEMENTATION.md` - Implementation guide
3. `UPLOAD-PAGE-UPDATE-SUMMARY.md` - Summary document
4. `DEPLOYMENT-CHECKLIST-UPLOAD-TYPES.md` - Deployment checklist

### Existing Files (Used)
1. `video-creator.py` - Video/GIF generation (already existed)
2. `CSV-EXPORT-ALL-TYPES.md` - CSV mapping (already existed)

---

## API Changes

### Submit Request
**BEFORE:**
```json
{
  "briefText": "Sale this week",
  "hasVoiceNote": false,
  "images": [...]
}
```

**AFTER:**
```json
{
  "uploadType": "carousel",  // NEW
  "briefText": "Sale this week",
  "hasVoiceNote": false,
  "images": [...]
}
```

### Submit Response
**BEFORE:**
```json
{
  "success": true,
  "postId": 12,
  "message": "Posts generated successfully"
}
```

**AFTER:**
```json
{
  "success": true,
  "postId": 3,
  "uploadType": "carousel",  // NEW
  "mediaGenerated": true,    // NEW
  "videoUrl": "/tmp/carousel-123.gif",  // NEW
  "message": "Posts generated successfully"
}
```

---

## Data Flow

### Images Only (Unchanged)
```
Upload → Generate 3 captions per image → Create posts → Review → Export
```

### Carousel (New)
```
Upload → Generate 1 caption per image → Create GIF → Create posts with video_url → Review → Export
```

### Video (New)
```
Upload → Generate 1 caption per image → Create MP4 → Create posts with video_url → Review → Export
```

---

## Testing Commands

### Test Upload Page
```bash
cd socialdrive-ai
npm run dev
# Visit: http://localhost:3000/upload/[token]
```

### Test Video Generation
```bash
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg --output /tmp/test.gif
ls -lh /tmp/test.gif
```

### Test Database
```sql
-- Check columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'posts' AND column_name IN ('post_type', 'video_url');

-- Test data
INSERT INTO posts (client_id, image_url, post_type, video_url, caption_text)
VALUES ('uuid', 'https://img.jpg', 'video', 'https://vid.mp4', 'Test');
```

---

## Quick Diff Summary

**Lines Added:** ~300  
**Lines Modified:** ~50  
**New Files:** 4  
**Modified Files:** 3  
**Database Columns:** 3 new  
**API Routes:** 1 modified  
**UI Components:** 2 updated  

---

**That's it!** Everything else is documentation and testing. 🎉
