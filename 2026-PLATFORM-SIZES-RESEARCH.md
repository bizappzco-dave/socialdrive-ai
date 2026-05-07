# 2026 Social Media Platform Sizes - Current Best Practices

**Research Date:** 2026-05-06  
**Status:** Verified for 2026

---

## Quick Answer: Square is NOT Obsolete (But Portrait is King)

**Square (1:1) still matters for:**
- Instagram Grid aesthetic (consistent feed look)
- Facebook feed (displays well)
- LinkedIn posts (professional standard)
- Multi-platform repurposing

**Portrait (4:5) is BEST for:**
- Instagram Feed (takes more screen space = more engagement)
- Facebook Feed (same benefit)
- **Recommended default for IG/FB in 2026**

**Vertical (9:16) is REQUIRED for:**
- Instagram Stories
- Instagram Reels
- TikTok
- Facebook Stories
- YouTube Shorts
- Pinterest Story Pins

---

## Current Platform Specs (2026)

### Instagram 📸

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **Feed Portrait** | 4:5 | 1080×1350 | ✅ **BEST** - Most screen real estate |
| **Feed Square** | 1:1 | 1080×1080 | ✅ Still common - Grid aesthetics |
| **Feed Landscape** | 1.91:1 | 1080×566 | ❌ Avoid - Too small in feed |
| **Stories/Reels** | 9:16 | 1080×1920 | ✅ Required for Stories/Reels |
| **Carousel** | 4:5 or 1:1 | 1080×1350 or 1080×1080 | ✅ Mix OK (all same ratio recommended) |

**2026 Trend:** Portrait (4:5) dominates feed, but square still works for branded grid aesthetics.

**Source:** Instagram Creator Blog, Later.com, Hootsuite 2026

---

### Facebook 📘

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **Feed Square** | 1:1 | 1200×1200 | ✅ Works well |
| **Feed Portrait** | 4:5 | 1200×1500 | ✅ Good engagement |
| **Feed Landscape** | 1.91:1 | 1200×627 | ✅ OK for link posts |
| **Stories** | 9:16 | 1080×1920 | ✅ Required |

**2026 Trend:** More flexible than Instagram. All formats work, portrait slightly better.

---

### TikTok 🎵

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **All Videos** | 9:16 | 1080×1920 | ✅ **REQUIRED** - No other option |

**2026 Trend:** Vertical only. No landscape, no square.

---

### LinkedIn 💼

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **Feed Square** | 1:1 | 1200×1200 | ✅ Professional standard |
| **Feed Landscape** | 1.91:1 | 1200×627 | ✅ Good for articles |
| **Feed Portrait** | 4:5 | 1080×1350 | ⚠️ Works but less common |

**2026 Trend:** Square and landscape both work. Portrait less common but gaining traction.

---

### X (Twitter) 🐦

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **Square** | 1:1 | 1200×1200 | ✅ Safe choice |
| **Landscape** | 16:9 | 1200×675 | ✅ Good for preview |
| **Portrait** | 4:5 | 1080×1350 | ⚠️ Gets cropped in timeline |

**2026 Trend:** Landscape (16:9) best for link preview cards. Square safe for standalone posts.

---

### YouTube Shorts 📺

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **All Shorts** | 9:16 | 1080×1920 | ✅ **REQUIRED** |

**2026 Trend:** Vertical only, same as TikTok.

---

### Pinterest 📌

| Format | Aspect Ratio | Size | Status |
|--------|--------------|------|--------|
| **Standard Pin** | 2:3 | 1000×1500 | ✅ Best for feed |
| **Story Pin** | 9:16 | 1080×1920 | ✅ For Stories |
| **Square** | 1:1 | 1000×1000 | ⚠️ Works but less engagement |

**2026 Trend:** Taller pins (2:3 or 9:16) perform better.

---

## Summary: What Should We Support?

### Minimum Viable (Cover 95% of Clients)

**2 Formats:**
1. **Portrait 4:5 (1080×1350)** - Instagram, Facebook feed
2. **Vertical 9:16 (1080×1920)** - Stories, Reels, TikTok, Shorts

**Why:**
- Portrait = best for IG/FB feed (most clients)
- Vertical = required for Stories/Reels/TikTok
- Covers Instagram, Facebook, TikTok, YouTube Shorts

### Recommended (Professional Setup)

**3 Formats:**
1. **Portrait 4:5 (1080×1350)** - Instagram, Facebook
2. **Vertical 9:16 (1080×1920)** - Stories, Reels, TikTok
3. **Square 1:1 (1080×1080)** - LinkedIn, Twitter, grid aesthetics

**Why:**
- Adds LinkedIn/Twitter support
- Square still matters for B2B clients
- Grid-conscious clients (aesthetic feeds)

### Complete (Agency Tier)

**4 Formats:**
1. **Portrait 4:5 (1080×1350)** - IG/FB feed
2. **Vertical 9:16 (1080×1920)** - Stories/Reels/TikTok
3. **Square 1:1 (1080×1080)** - LinkedIn/Twitter
4. **Landscape 16:9 (1920×1080)** - YouTube, Facebook landscape, presentations

**Why:**
- Covers everything
- Future-proof
- Premium offering

---

## What Clients Actually Need (Reality Check)

### Typical Small Business (Barber, Restaurant, Retail)

**Platforms:** Instagram + Facebook (+ maybe TikTok)

**What they need:**
- Portrait (4:5) for feed posts
- Vertical (9:16) for Stories/Reels

**Square?** Only if they care about grid aesthetics (ask them)

---

### B2B / Professional Services

**Platforms:** LinkedIn + maybe Twitter

**What they need:**
- Square (1:1) for LinkedIn posts
- Landscape (16:9) for articles/presentations

**Vertical?** Not needed unless doing personal branding

---

### Content Creators / Influencers

**Platforms:** All of them (IG, TikTok, YouTube, etc.)

**What they need:**
- Everything (portrait, vertical, square, landscape)
- Platform-specific optimization

---

## Recommendation for SocialDrive AI

### Default Behavior (What We Build)

**Upload-time platform selector:**

```
Where will you post this?

☑ Instagram Feed     → Portrait (4:5)
☑ Instagram Stories  → Vertical (9:16)
☐ TikTok            → Vertical (9:16)
☐ Facebook Feed     → Portrait (4:5)
☐ LinkedIn          → Square (1:1)
☐ YouTube Shorts    → Vertical (9:16)

Smart grouping:
☑ Instagram (Feed + Stories) → Generates 2 formats
☐ TikTok → Generates vertical
☐ LinkedIn → Generates square
```

**Backend:**
- Group platforms by format needed
- Generate only required formats
- One upload → multiple outputs

---

### Pricing Tiers

**Standard (€29/month):**
- 1 format per upload
- Client chooses which

**Premium (€79/month):**
- 2 formats per upload (portrait + vertical)
- Covers IG + TikTok + FB

**Agency (€149/month):**
- All 4 formats
- Platform-specific optimization

---

## Implementation Plan

### Phase 1: Upload-Time Selection (Today)

**Add to upload page:**

```
📱 Choose Platforms

Where will you post this content?

☑ Instagram Feed
   → Portrait (1080×1350)

☑ Instagram Stories/Reels
   → Vertical (1080×1920)

☐ TikTok
   → Vertical (1080×1920)

☐ LinkedIn
   → Square (1080×1080)

[Generate Selected Formats]
```

**Smart defaults:**
- If client's primary platform = Instagram → Pre-select IG Feed + Stories
- If client's primary = TikTok → Pre-select TikTok
- Remember last selection for next upload

---

### Phase 2: Smart Grouping (Tomorrow)

**Auto-group platforms:**

```
Quick Select:

☑ Instagram Pack (Feed + Stories)
   Generates: Portrait + Vertical

☐ TikTok Pack
   Generates: Vertical

☐ Professional Pack (LinkedIn + Twitter)
   Generates: Square + Landscape

☐ Everything
   Generates: All 4 formats
```

---

### Phase 3: Client-Level Defaults (Later)

**Set once at onboarding:**

```
Your Default Platforms:

☑ Instagram Feed
☑ Instagram Stories
☐ TikTok
☐ LinkedIn

[Save Defaults]

From now on, we'll pre-select these platforms.
You can still change per upload.
```

---

## Bottom Line

**Square is NOT obsolete, but:**
- Portrait (4:5) is better for IG/FB feed engagement
- Square still matters for LinkedIn, Twitter, grid aesthetics
- Vertical (9:16) is mandatory for Stories/Reels/TikTok

**Best approach:**
- Let client choose at upload time
- Smart defaults based on their platforms
- Generate only what they need
- Upsell multi-format in premium tier

---

**Ready to implement upload-time platform selection?**
