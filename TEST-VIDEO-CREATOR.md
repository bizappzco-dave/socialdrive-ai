# Test Video Creator with Platforms

**Quick testing guide**

---

## ✅ Correct Command Format

The video creator needs **individual image paths**, not wildcards:

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai

python3 video-creator-platforms.py carousel \
  no-label-images/NL\ 1.jpg \
  no-label-images/NL\ 2.jpg \
  no-label-images/NL\ 3.jpg \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

**Note:** 
- Escape spaces with `\ ` or use quotes
- List each image file individually
- `--platforms` takes space-separated list
- `--output` is the base path (script adds size suffix)

---

## What This Will Generate

For `instagram` + `tiktok`:

```
/tmp/test-carousel_1080x1350.gif  ← Instagram Feed (Portrait)
/tmp/test-carousel_1080x1920.gif  ← Instagram Stories + TikTok (Vertical)
```

---

## Expected Output

```
🎬 SocialDrive AI - Video Creator
==================================================
Mode: carousel
Platforms: instagram, tiktok
Images: 3
==================================================

📱 Generating for: instagram
   Format: Portrait (4:5)
   Size: 1080x1350
✓ Created GIF: /tmp/test-carousel_1080x1350.gif
  - 3 frames
  - Size: 1080x1350
  - 800ms per frame

📱 Generating for: instagram, tiktok
   Format: Vertical (9:16)
   Size: 1080x1920
✓ Created GIF: /tmp/test-carousel_1080x1920.gif
  - 3 frames
  - Size: 1080x1920
  - 800ms per frame

==================================================
✅ Generation Complete!
==================================================

📱 instagram
   Format: Portrait
   Size: 1080x1350
   File: /tmp/test-carousel_1080x1350.gif

📱 instagram, tiktok
   Format: Vertical
   Size: 1080x1920
   File: /tmp/test-carousel_1080x1920.gif

✨ Done!
```

---

## Verify Output

```bash
# Check files were created
ls -lh /tmp/test-carousel*.gif

# Should see:
# -rw-rw-r-- 1 dpmcg dpmcg 2.5M May  6 07:50 /tmp/test-carousel_1080x1350.gif
# -rw-rw-r-- 1 dpmcg dpmcg 3.1M May  6 07:50 /tmp/test-carousel_1080x1920.gif
```

---

## Test with Different Platforms

### LinkedIn Only (Square)
```bash
python3 video-creator-platforms.py carousel \
  no-label-images/NL\ 1.jpg \
  no-label-images/NL\ 2.jpg \
  no-label-images/NL\ 3.jpg \
  --platforms linkedin \
  --output /tmp/test-linkedin
```

**Output:** `/tmp/test-linkedin_1080x1080.gif`

---

### All Platforms
```bash
python3 video-creator-platforms.py carousel \
  no-label-images/NL\ 1.jpg \
  no-label-images/NL\ 2.jpg \
  no-label-images/NL\ 3.jpg \
  --platforms instagram tiktok linkedin \
  --output /tmp/test-all
```

**Output:**
- `/tmp/test-all_1080x1350.gif` (Instagram Portrait)
- `/tmp/test-all_1080x1920.gif` (Instagram Stories + TikTok)
- `/tmp/test-all_1080x1080.gif` (LinkedIn Square)

---

## Test Video Mode (MP4)

```bash
python3 video-creator-platforms.py video \
  no-label-images/NL\ 1.jpg \
  no-label-images/NL\ 2.jpg \
  no-label-images/NL\ 3.jpg \
  no-label-images/NL\ 4.jpg \
  no-label-images/NL\ 5.jpg \
  --platforms instagram tiktok \
  --output /tmp/test-video
```

**Note:** Video mode (MP4) requires ffmpeg. If not available, it falls back to GIF.

---

## Common Errors

### ❌ "Image not found"
```bash
# Wrong: Wildcards don't work
python3 video-creator.py carousel images/*.jpg

# Right: List each file
python3 video-creator.py carousel images/1.jpg images/2.jpg images/3.jpg
```

### ❌ "No such file or directory"
```bash
# Wrong: Spaces not escaped
python3 video-creator.py carousel no-label-images/NL 1.jpg

# Right: Escape spaces
python3 video-creator.py carousel no-label-images/NL\ 1.jpg

# Or use quotes
python3 video-creator.py carousel "no-label-images/NL 1.jpg"
```

### ❌ "Pillow not installed"
```bash
# Install Pillow
pip3 install Pillow

# Or with specific Python version
pip3.11 install Pillow  # Adjust version as needed
```

---

## Next: Test Full Upload Flow

Once video creator works manually, test the full flow:

1. **Go to upload page:**
   ```
   https://socialdrive-ai.vercel.app/upload/[your-token]
   ```

2. **Select:**
   - Format: Carousel or Video
   - Platforms: Instagram + TikTok

3. **Upload:** 3-10 images

4. **Submit**

5. **Check logs:**
   - Submit route calls video creator
   - Generates multiple formats
   - Stores URLs in database

6. **Check review page:**
   - Shows generated formats
   - Can select which to export

---

**Try the command above and let me know if it works!** 🚀
