# SocialDrive AI - Upload Types Specification

## Overview
Clients can choose from 3 content upload types when submitting images:

1. **Images Only** - Traditional upload (existing flow)
2. **Carousel** - Auto-generate animated GIF/MP4 carousel
3. **Video Slideshow** - Create video with transitions, text overlays, music

---

## Upload Type 1: Images Only (Existing)

**What it does:**
- Client uploads 1-20 images
- AI generates captions for each image
- Returns individual posts with images + captions

**Best for:**
- Single standout images
- Clients who want full control
- Quick posts

**Output:**
- Individual image posts
- 3 caption variations per image
- Hashtags included

**Database:**
```sql
submission_type: 'images'
```

---

## Upload Type 2: Carousel

**What it does:**
- Client uploads 3-10 images
- Creates animated GIF or MP4 carousel
- Images transition smoothly (slide/fade effect)
- Optional: Add slide numbers, branding

**Best for:**
- Before/after transformations
- Multiple angles of same subject
- Step-by-step processes
- Product showcases

**Output:**
- 1 animated carousel (GIF or MP4)
- 3 caption variations
- Optimized for Instagram/Facebook carousels

**Settings:**
```json
{
  "type": "carousel",
  "duration_per_slide": 800,  // ms
  "transition": "slide",       // slide, fade, none
  "add_slide_numbers": true,
  "add_branding": false,
  "output_format": "gif"       // gif or mp4
}
```

**Database:**
```sql
submission_type: 'carousel'
carousel_settings: '{"duration": 800, "transition": "slide"}'
```

**Processing:**
```bash
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg \
  --output carousel.gif \
  --duration 800
```

---

## Upload Type 3: Video Slideshow

**What it does:**
- Client uploads 5-50 images
- Creates professional MP4 video slideshow
- Adds transitions, text overlays, optional music
- Customizable duration, fonts, colors

**Best for:**
- Event recaps
- Portfolio showcases
- Before/after collections
- Promotional content
- Story highlights

**Output:**
- 1 MP4 video (30-60 seconds typical)
- 3 caption variations
- Optimized for Instagram Reels, TikTok, Facebook

**Settings:**
```json
{
  "type": "video",
  "duration_per_image": 2,     // seconds
  "transition": "fade",        // fade, slide, zoom, none
  "add_text_overlay": true,
  "text_position": "center",   // top, center, bottom
  "text_style": "bold",        // bold, outline, shadow
  "custom_text": "No Label Barber",
  "add_music": false,
  "output_format": "mp4",
  "resolution": "1080x1080"    // square, landscape, portrait
}
```

**Database:**
```sql
submission_type: 'video'
video_settings: '{
  "duration": 2,
  "transition": "fade",
  "text": "No Label Barber",
  "resolution": "1080x1080"
}'
```

**Processing:**
```bash
# Create video with FFmpeg
ffmpeg -f concat -i playlist.txt \
  -vf "scale=1080:1080,drawtext=text='No Label Barber'" \
  -c:v libx264 -pix_fmt yuv420p \
  output.mp4
```

---

## UI Changes Needed

### Upload Page (`/upload/[token]`)

**Add upload type selector:**

```tsx
<div className="upload-type-selector">
  <h3>What type of content do you want to create?</h3>
  
  <label className="type-option">
    <input type="radio" name="uploadType" value="images" defaultChecked />
    <div className="option-card">
      <div className="icon">📷</div>
      <h4>Images Only</h4>
      <p>Individual posts for each image</p>
      <span className="badge">Fastest</span>
    </div>
  </label>
  
  <label className="type-option">
    <input type="radio" name="uploadType" value="carousel" />
    <div className="option-card">
      <div className="icon">🎠</div>
      <h4>Carousel</h4>
      <p>Animated slideshow of your images</p>
      <span className="badge">Popular</span>
    </div>
  </label>
  
  <label className="type-option">
    <input type="radio" name="uploadType" value="video" />
    <div className="option-card">
      <div className="icon">🎬</div>
      <h4>Video Slideshow</h4>
      <p>Professional video with transitions & text</p>
      <span className="badge">Premium</span>
    </div>
  </label>
</div>
```

### Conditional Settings

**Show additional options based on type:**

```tsx
{uploadType === 'carousel' && (
  <div className="carousel-settings">
    <label>
      Transition Speed:
      <select name="carouselDuration">
        <option value="500">Fast (0.5s)</option>
        <option value="800" selected>Normal (0.8s)</option>
        <option value="1200">Slow (1.2s)</option>
      </select>
    </label>
    
    <label>
      <input type="checkbox" name="addSlideNumbers" defaultChecked />
      Show slide numbers
    </label>
  </div>
)}

{uploadType === 'video' && (
  <div className="video-settings">
    <label>
      Duration per image:
      <input type="range" name="videoDuration" min="1" max="5" defaultValue="2" />
      {videoDuration}s
    </label>
    
    <label>
      Text Overlay:
      <input type="text" name="customText" placeholder="Your brand name or message" />
    </label>
    
    <label>
      Orientation:
      <select name="orientation">
        <option value="square">Square (1080x1080)</option>
        <option value="portrait">Portrait (1080x1920)</option>
        <option value="landscape">Landscape (1920x1080)</option>
      </select>
    </label>
  </div>
)}
```

---

## Backend Changes

### API Route (`/api/submissions/upload/[token]/submit`)

**Parse upload type:**

```typescript
const { uploadType, images, briefText, settings } = await request.json()

// Validate based on type
if (uploadType === 'carousel' && images.length < 2) {
  return NextResponse.json(
    { error: 'Carousel requires at least 2 images' },
    { status: 400 }
  )
}

if (uploadType === 'video' && images.length < 3) {
  return NextResponse.json(
    { error: 'Video requires at least 3 images' },
    { status: 400 }
  )
}
```

**Process based on type:**

```typescript
let generatedContent

if (uploadType === 'images') {
  // Existing flow - generate captions for each image
  generatedContent = await generateCaptionsForImages(images, brandContext)
} 
else if (uploadType === 'carousel') {
  // Create carousel
  const carouselPath = await createCarousel(images, settings)
  generatedContent = [{
    type: 'carousel',
    media_url: carouselPath,
    captions: await generateCaptions(carouselPath, brandContext)
  }]
}
else if (uploadType === 'video') {
  // Create video slideshow
  const videoPath = await createVideoSlideshow(images, settings)
  generatedContent = [{
    type: 'video',
    media_url: videoPath,
    captions: await generateCaptions(videoPath, brandContext)
  }]
}
```

---

## File Structure

```
src/
├── app/
│   └── api/
│       └── submissions/
│           └── upload/
│               └── [token]/
│                   └── submit/
│                       └── route.ts  (updated)
├── lib/
│   └── media/
│       ├── carousel-creator.ts      (NEW)
│       ├── video-creator.ts         (NEW)
│       └── image-processor.ts       (NEW)
└── components/
    └── upload/
        ├── upload-type-selector.tsx (NEW)
        ├── carousel-settings.tsx    (NEW)
        └── video-settings.tsx       (NEW)
```

---

## Python Scripts Integration

**Use existing scripts:**

```typescript
// lib/media/carousel-creator.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

export async function createCarousel(
  images: string[],
  settings: CarouselSettings
): Promise<string> {
  const outputPath = `/tmp/carousel-${Date.now()}.gif`
  const imageList = images.join(' ')
  
  const command = `python3 /path/to/video-creator.py carousel ${imageList} --output ${outputPath} --duration ${settings.duration}`
  
  await execPromise(command)
  return outputPath
}

// lib/media/video-creator.ts
export async function createVideoSlideshow(
  images: string[],
  settings: VideoSettings
): Promise<string> {
  const outputPath = `/tmp/video-${Date.now()}.mp4`
  
  // Create FFmpeg playlist
  const playlist = images.map(img => 
    `file '${img}'\nduration ${settings.duration}`
  ).join('\n')
  
  // Write playlist file
  await fs.writeFile('/tmp/playlist.txt', playlist)
  
  // Build FFmpeg command
  let filters = `scale=${settings.resolution}`
  if (settings.customText) {
    filters += `,drawtext=text='${settings.customText}':fontsize=48:fontcolor=white`
  }
  
  const command = `ffmpeg -f concat -i /tmp/playlist.txt -vf "${filters}" -c:v libx264 ${outputPath}`
  
  await execPromise(command)
  return outputPath
}
```

---

## Storage

**Save to Supabase Storage:**

```typescript
// Upload generated media
const { data: mediaData, error: mediaError } = await supabase
  .storage
  .from('submissions')
  .upload(
    `${clientId}/${Date.now()}-${type}.${ext}`,
    fs.readFileSync(outputPath)
  )

const publicUrl = supabase
  .storage
  .from('submissions')
  .getPublicUrl(mediaData.path).publicURL
```

---

## Review Page Updates

**Display different media types:**

```tsx
{post.type === 'video' && (
  <video controls className="w-full rounded-lg">
    <source src={post.media_url} type="video/mp4" />
  </video>
)}

{post.type === 'carousel' && (
  post.media_url.endsWith('.gif') ? (
    <img src={post.media_url} alt="Carousel" className="w-full rounded-lg" />
  ) : (
    <video autoPlay loop muted className="w-full rounded-lg">
      <source src={post.media_url} type="video/mp4" />
    </video>
  )
)}

{post.type === 'images' && (
  <img src={post.image_url} alt="Post" className="w-full rounded-lg" />
)}
```

---

## Pricing Tiers (Optional)

**Future monetization:**

| Tier | Images | Carousel | Video |
|------|--------|----------|-------|
| **Free** | ✅ Unlimited | ❌ | ❌ |
| **Standard** | ✅ Unlimited | ✅ 3/month | ❌ |
| **Premium** | ✅ Unlimited | ✅ Unlimited | ✅ 5/month |
| **Pro** | ✅ Unlimited | ✅ Unlimited | ✅ Unlimited |

---

## Migration Plan

### Phase 1: Backend Only (This Week)
- [ ] Add `submission_type` column to submissions table
- [ ] Create carousel-creator.ts
- [ ] Create video-creator.ts
- [ ] Update submit route to handle types
- [ ] Test with Python scripts

### Phase 2: Frontend (Next Week)
- [ ] Add upload type selector UI
- [ ] Add conditional settings forms
- [ ] Update review page for new media types
- [ ] Test end-to-end flow

### Phase 3: Polish (Week 3)
- [ ] Add text overlay customization
- [ ] Add music support for videos
- [ ] Add more transition options
- [ ] Performance optimization
- [ ] Documentation

---

## Example User Flow

**Client: No Label Barber**

1. **Upload page:** Selects "Video Slideshow"
2. **Uploads:** 15 images from recent haircuts
3. **Settings:**
   - Duration: 2 seconds per image
   - Text: "Lads Lunch - €50"
   - Orientation: Square
4. **Submits**
5. **Processing:**
   - Creates 30-second MP4 video
   - Adds text overlay
   - Generates 3 caption variations
6. **Review page:** Shows video player with captions
7. **Client approves** → Posts to Instagram Reels

**Result:** Professional promo video in 5 minutes!

---

## Benefits

✅ **More value for clients** - Not just static images
✅ **Higher engagement** - Videos get 2-3x more engagement
✅ **Competitive advantage** - Unique feature vs other tools
✅ **Premium pricing** - Can charge more for video creation
✅ **Time savings** - Automated vs manual video editing
