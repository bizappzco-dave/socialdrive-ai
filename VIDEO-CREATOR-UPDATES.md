# Video Creator Updates ⚡

## New Feature: Total Duration Control

You can now specify the **total video length** and the script automatically calculates the per-slide duration!

### Examples

**Old way (per-slide duration):**
```bash
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg --output carousel.gif --duration 1000
# Each slide shows for 1000ms (1 second)
# Total: 3 seconds
```

**New way (total duration):**
```bash
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg --output carousel.gif --total-duration 30
# Total video is 30 seconds
# Each slide shows for 10 seconds (30s ÷ 3 images)
```

### Use Cases

#### 15 slides in 30 seconds:
```bash
python3 video-creator.py carousel *.jpg --output carousel.gif --total-duration 30
# Result: 2 seconds per slide (30s ÷ 15 = 2s)
```

#### 15 slides in 20 seconds:
```bash
python3 video-creator.py carousel *.jpg --output carousel.gif --total-duration 20
# Result: 1.33 seconds per slide (20s ÷ 15 = 1.33s)
```

#### Fast-paced 10-slide carousel in 15 seconds:
```bash
python3 video-creator.py carousel *.jpg --output fast-carousel.gif --total-duration 15
# Result: 1.5 seconds per slide
```

---

## Carousels: Swipe vs Auto-Rotate

**Current behavior:** GIFs **auto-rotate** (loop continuously)

**Instagram carousels** are **swipe-based** (user controls navigation)

### Options:

#### Option 1: Keep as Auto-Rotating GIF ✅ (Current)
- **Pros:** Works everywhere, no special player needed
- **Cons:** Can't pause, might loop too fast/slow
- **Best for:** Quick previews, email embeds

#### Option 2: Add Swipe Indicators (Visual Only)
- Add "Swipe →" text on first slide
- Add "← End" on last slide
- Still auto-rotates but **looks** like swipe UI
- **Best for:** Instagram-style aesthetic

#### Option 3: Create Interactive HTML Carousel (Future)
- Actual swipe/touch support
- Pause on hover
- Navigation dots/arrows
- **Requires:** Web player, not a GIF
- **Best for:** Review pages, web embedding

---

## Recommended Settings

### Instagram Posts (Square):
```bash
python3 video-creator.py carousel img1.jpg img2.jpg img3.jpg \
  --output instagram.gif \
  --size 1080x1080 \
  --total-duration 15
# 5 seconds per slide for 3 images
```

### Instagram Stories (Vertical):
```bash
python3 video-creator.py story img1.jpg img2.jpg \
  --output story.gif \
  --size 1080x1920 \
  --total-duration 10
# 5 seconds per slide
```

### Fast Product Showcase:
```bash
python3 video-creator.py carousel *.jpg \
  --output showcase.gif \
  --total-duration 20
# ~1.3 seconds per slide (15 images in 20s)
```

---

## Command Reference

```bash
# Basic carousel
python3 video-creator.py carousel img1.jpg img2.jpg --output carousel.gif

# With custom duration per slide
python3 video-creator.py carousel img1.jpg img2.jpg --output carousel.gif --duration 2000

# With total video duration (NEW!)
python3 video-creator.py carousel img1.jpg img2.jpg --output carousel.gif --total-duration 30

# Custom size (Instagram Story)
python3 video-creator.py carousel img1.jpg --output story.gif --size 1080x1920 --total-duration 10

# Process entire folder
python3 video-creator.py carousel ./images/*.jpg --output folder-carousel.gif --total-duration 30
```

---

## Next Steps (Optional Enhancements)

- [ ] Add actual swipe support (HTML5/JS player)
- [ ] Add background music (ffmpeg)
- [ ] Add transitions (fade, slide, zoom)
- [ ] Add text overlays per slide
- [ ] Create MP4 instead of GIF (smaller file size)
