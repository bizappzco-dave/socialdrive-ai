# Video Creator - Correct Path

The images are in the **workspace root**, not in the socialdrive-ai folder!

---

## ✅ Correct Command

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai

python3 video-creator-platforms.py carousel \
  "../no-label-images/NL 1.jpg" \
  "../no-label-images/NL 2.jpg" \
  "../no-label-images/NL 3.jpg" \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

**Or use absolute paths:**

```bash
python3 video-creator-platforms.py carousel \
  "/home/dpmcg/.openclaw/workspace/no-label-images/NL 1.jpg" \
  "/home/dpmcg/.openclaw/workspace/no-label-images/NL 2.jpg" \
  "/home/dpmcg/.openclaw/workspace/no-label-images/NL 3.jpg" \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

---

## Why It Failed

You were in: `/home/dpmcg/.openclaw/workspace/socialdrive-ai/`

But the images are in: `/home/dpmcg/.openclaw/workspace/no-label-images/`

So you need to go **up one level** with `../` or use the full path.

---

## Quick Test

```bash
# First verify the images exist
ls -lh ../no-label-images/NL*.jpg

# Should show:
# -rw-rw-r-- 1 dpmcg dpmcg 1.2M May  4 12:39 NL 1.jpg
# -rw-rw-r-- 1 dpmcg dpmcg 1.1M May  4 12:39 NL 2.jpg
# -rw-rw-r-- 1 dpmcg dpmcg 1.3M May  4 12:39 NL 3.jpg
```

---

## Then Run

```bash
python3 video-creator-platforms.py carousel \
  "../no-label-images/NL 1.jpg" \
  "../no-label-images/NL 2.jpg" \
  "../no-label-images/NL 3.jpg" \
  --platforms instagram tiktok \
  --output /tmp/test-carousel
```

**Expected:** Two GIF files created in `/tmp/` ✅

---

Try this and let me know! 🚀
