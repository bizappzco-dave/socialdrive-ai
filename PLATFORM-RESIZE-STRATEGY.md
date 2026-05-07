# Platform-Specific Video & Image Resizing Strategy

**Date:** 2026-05-06  
**Status:** Planning

---

## The Challenge

Clients post to different platforms with different requirements:

| Platform | Format | Aspect Ratio | Max Size | Notes |
|----------|--------|--------------|----------|-------|
| **Instagram Feed** | Square | 1:1 | 1080×1080 | Most common |
| **Instagram Feed** | Portrait | 4:5 | 1080×1350 | More screen space |
| **Instagram Stories/Reels** | Vertical | 9:16 | 1080×1920 | Full screen |
| **Instagram Carousel** | Square/Portrait | 1:1 or 4:5 | 1080×1080/1350 | Mixed OK |
| **Facebook Feed** | Square/Landscape | 1:1 or 1.91:1 | 1200×1200 | Flexible |
| **Facebook Stories** | Vertical | 9:16 | 1080×1920 | Same as IG |
| **TikTok** | Vertical | 9:16 | 1080×1920 | Required |
| **LinkedIn** | Square/Landscape | 1:1 or 1.91:1 | 1200×627 | Professional |
| **X (Twitter)** | Landscape/Square | 16:9 or 1:1 | 1200×675 | Preview matters |
| **YouTube Shorts** | Vertical | 9:16 | 1080×1920 | Required |
| **Pinterest** | Portrait | 2:3 or 9:16 | 1000×1500 | Tall performs better |

---

## Current Approach

**What we have:**
- `video-creator.py` supports multiple sizes
- Default: 1080×1080 (Instagram square)
- Story mode: 1080×1920 (vertical)
- Manual size selection via `--size` flag

**What's missing:**
- Platform detection (how do we know where they post?)
- Auto-generate multiple formats
- Smart cropping (not just resize)

---

## Solution Options

### Option 1: Ask Client During Onboarding ✅ RECOMMENDED

**Add to brand context form:**

```markdown
### Where do you post? (Select all that apply)

- [ ] Instagram Feed (square posts)
- [ ] Instagram Stories/Reels (vertical)
- [ ] Facebook Feed
- [ ] Facebook Stories
- [ ] TikTok
- [ ] LinkedIn
- [ ] X (Twitter)
- [ ] YouTube Shorts
- [ ] Pinterest

### Primary platform?
[Dropdown: Instagram, Facebook, TikTok, LinkedIn, X, Other]

### Want us to auto-generate all formats?
- [ ] Yes, create versions for all my platforms (+€10/month)
- [ ] No, just my primary platform (included)
```

**Database:**
```sql
ALTER TABLE clients 
ADD COLUMN platforms TEXT[] DEFAULT '{}',
ADD COLUMN primary_platform TEXT DEFAULT 'instagram',
ADD COLUMN auto_generate_formats BOOLEAN DEFAULT false;
```

**Benefits:**
- Clear client preference
- Upsell opportunity (multi-format)
- No guessing

**Implementation:**
- Add to brand context page
- Store in `clients` table
- Use in video generation

---

### Option 2: Detect from Sociamonials API (Waiting)

**Once we have API access:**

```typescript
// Fetch connected accounts from Sociamonials
const accounts = await sociamonials.getConnectedAccounts(clientId)

// Extract platforms
const platforms = accounts.map(acc => acc.platform)
// ['instagram', 'facebook', 'tiktok']

// Auto-detect primary (most frequent posts)
const primary = accounts.sort((a, b) => b.posts - a.posts)[0].platform
```

**Benefits:**
- Automatic, no client input
- Always up-to-date
- Can detect changes

**Drawbacks:**
- Waiting on API access
- Some clients manual post (won't detect)
- Doesn't know future plans

---

### Option 3: Smart Defaults + Override

**Default behavior:**
- Generate **2 formats** for all clients:
  1. **Square (1080×1080)** - Instagram/FB/LinkedIn feed
  2. **Vertical (1080×1920)** - Stories/Reels/TikTok/Shorts

**Client can override:**
- "Just square please" → saves cost
- "Also need landscape for LinkedIn" → add it

**Benefits:**
- Covers 95% of use cases
- No setup needed
- Simple

**Drawbacks:**
- Generates unused formats (waste)
- Extra processing time
- More storage

---

## Recommended Implementation

### Phase 1: Add Platform Selection (This Week)

**1. Update Brand Context Form**

Add section: "Where do you post?"

**2. Update Database**

```sql
-- File: migrations/add-platform-preferences.sql
ALTER TABLE clients 
ADD COLUMN platforms TEXT[] DEFAULT '{"instagram"}',
ADD COLUMN primary_platform TEXT DEFAULT 'instagram',
ADD COLUMN generate_all_formats BOOLEAN DEFAULT false;
```

**3. Update Upload Page**

Show format options based on client's platforms:

```tsx
// If client has TikTok → show "Vertical (9:16)" option
// If client has Instagram → show "Square (1:1)" option
// If client has LinkedIn → show "Landscape (16:9)" option
```

**4. Update Video Generator**

```bash
# Generate for all client's platforms
python3 video-creator.py carousel images/*.jpg \
  --output-square /tmp/square.gif \
  --output-vertical /tmp/vertical.gif \
  --output-landscape /tmp/landscape.gif \
  --platforms instagram,tiktok,linkedin
```

---

### Phase 2: Smart Cropping (Next Week)

**Problem:** Simple resize looks bad (cuts off heads, text)

**Solution:** Smart crop with AI

```python
# Detect focal point (face, text, product)
# Crop intelligently, not just center

def smart_crop(image, target_size):
    # Use OpenCV face detection
    # Or use CLIP to find important region
    # Or use saliency detection
    
    # Return cropped image
    return cropped
```

**Tools:**
- OpenCV (face detection)
- CLIP (semantic understanding)
- PIL (basic cropping)

---

### Phase 3: Multi-Format Generation (Later)

**For clients who want all formats:**

```typescript
// Submit route
if (client.generate_all_formats) {
  // Generate 3 versions
  await generateVideo(images, 'square', '1080x1080')
  await generateVideo(images, 'vertical', '1080x1920')
  await generateVideo(images, 'landscape', '1920x1080')
  
  // Store all URLs
  post.video_url_square = squareUrl
  post.video_url_vertical = verticalUrl
  post.video_url_landscape = landscapeUrl
}
```

**CSV Export:**
```csv
Message,ImageURL,VideoURL_Square,VideoURL_Vertical,VideoURL_Landscape,TeamNote
"Caption",,https://square.gif,https://vertical.mp4,https://landscape.mp4,Multi-format
```

---

## What Should We Do Now?

### Immediate (Today/Tomorrow)

**1. Add Platform Field to Database**
```sql
ALTER TABLE clients ADD COLUMN platforms TEXT[] DEFAULT '{"instagram"}';
ALTER TABLE clients ADD COLUMN primary_platform TEXT DEFAULT 'instagram';
```

**2. Update Brand Context Page**
- Add platform selector (checkboxes)
- Add primary platform dropdown
- Save to database

**3. Update Video Generator**
- Accept `--platforms` flag
- Generate appropriate sizes
- Default to square + vertical

**4. Update Upload Page**
- Show recommended formats based on platforms
- "Based on your platforms, we recommend:"
  - ✅ Square (Instagram)
  - ✅ Vertical (TikTok, Reels)

---

### Short-term (This Week)

**5. Update Review Page**
- Show all generated formats
- Let client select which to use
- Download all or specific format

**6. Update CSV Export**
- Multiple VideoURL columns
- Or separate CSVs per platform

---

### Medium-term (Next Week)

**7. Smart Cropping**
- Implement face detection
- Test with client images
- Improve crop quality

**8. Sociamonials Integration**
- When API available, auto-detect platforms
- Sync connected accounts
- Update client preferences automatically

---

## Example Client Flow

### Client: No Label Barber

**Platforms:** Instagram (primary), Facebook, TikTok

**Onboarding:**
- Selects: Instagram, Facebook, TikTok
- Primary: Instagram
- Generate all formats: No (just primary + TikTok)

**Upload:**
- Format: Video Slideshow
- Images: 10 photos
- Brief: "Lads Lunch special"

**Generation:**
- Square (1080×1080) for Instagram/FB
- Vertical (1080×1920) for TikTok

**Review:**
- Sees both versions
- Selects caption
- Downloads CSV with both URLs

**Result:**
- Posts square to Instagram/FB
- Posts vertical to TikTok
- Same caption, perfect format for each

---

## Questions to Decide

1. **Do we charge for multi-format?**
   - Free: Include 2 formats (square + vertical)
   - Paid: €10/month for all formats

2. **Default behavior?**
   - Generate all for everyone? (simple but wasteful)
   - Generate based on selection? (requires setup)
   - Generate square only, upsell others? (conservative)

3. **Smart cropping priority?**
   - High (quality matters)
   - Medium (can wait)
   - Low (simple resize OK for now)

---

## Recommendation

**Start simple:**

1. ✅ Add platform selection to onboarding
2. ✅ Generate 2 formats by default (square + vertical)
3. ✅ Let client choose which to use
4. ✅ Include in standard price (no extra charge yet)

**Then improve:**

1. Add smart cropping
2. Add more formats (landscape for LinkedIn)
3. Consider premium tier for unlimited formats
4. Auto-detect from Sociamonials when API available

---

**What do you think? Should I implement the platform selection now?**
