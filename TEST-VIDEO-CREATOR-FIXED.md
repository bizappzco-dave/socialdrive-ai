# Video Creator - Fixed Command

**Issue:** Image paths with spaces need quotes

---

## ✅ Working Command

**Option 1: Use Quotes (Easiest)**

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai

python3 video-creator-platforms.py carousel \
  "no-label-images/NL 1.jpg" \
  "no-label-images/NL 2.jpg" \
  "no-label-images/NL 3.jpg" \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

**Option 2: Escape Spaces**

```bash
python3 video-creator-platforms.py carousel \
  no-label-images/NL\ 1.jpg \
  no-label-images/NL\ 2.jpg \
  no-label-images/NL\ 3.jpg \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

**Option 3: Use Tab Completion**

Type `no-label-images/NL` then press `Tab` - it will auto-complete with proper escaping!

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

## Verify Files Created

```bash
ls -lh /tmp/test-carousel*.gif
```

Should show:
```
-rw-rw-r-- 1 dpmcg dpmcg 2.5M May  6 09:20 /tmp/test-carousel_1080x1350.gif
-rw-rw-r-- 1 dpmcg dpmcg 3.1M May  6 09:20 /tmp/test-carousel_1080x1920.gif
```

---

## Quick Checklist

**First:** Run SQL migration in Supabase (see `RUN-THIS-IN-SUPABASE.md`)

**Then:** Test video creator with command above

**Expected:** Two GIF files created in `/tmp/`

**Then:** Test upload page with Simple tier client

---

**Try the quoted version first - it's the most reliable!** 🚀
