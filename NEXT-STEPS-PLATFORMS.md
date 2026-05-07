# Next Steps: Platform Detection & Auto-Resizing

**Created:** 2026-05-06 07:05 GMT+1

---

## Summary

**Question:** How do we know which platforms to resize for?

**Answer:** Start with **client selection** during onboarding, then auto-detect from Sociamonials later.

---

## What We Have Now

✅ **Upload types working:**
- Images Only (3-5 images)
- Carousel (3-10 images → GIF)
- Video (3-20 images → MP4)

✅ **Video creator supports:**
- Square (1080×1080) - default
- Vertical (1080×1920) - story mode
- Custom sizes via `--size` flag

✅ **Database ready:**
- `posts.post_type` column
- `posts.video_url` column
- `submissions.submission_type` column

---

## What We Need to Add

### 1. Platform Preferences (Priority: HIGH)

**Add to client onboarding:**

```
Where do you post? (select all)
☐ Instagram Feed
☐ Instagram Stories/Reels  
☐ Facebook Feed
☐ Facebook Stories
☐ TikTok
☐ LinkedIn
☐ X (Twitter)
☐ YouTube Shorts
☐ Pinterest

Primary platform: [Instagram ▼]

Generate all formats? 
○ Just primary platform (included)
○ All my platforms (+€10/month)
```

**Database migration ready:**
- File: `migrations/add-platform-preferences.sql`
- Adds: `platforms`, `primary_platform`, `generate_all_formats`

---

### 2. Smart Format Generation (Priority: HIGH)

**Based on platforms, auto-generate:**

| Platforms Selected | Formats Generated | Sizes |
|-------------------|-------------------|-------|
| Instagram only | Square | 1080×1080 |
| Instagram + TikTok | Square + Vertical | 1080×1080 + 1080×1920 |
| All platforms | Square + Vertical + Landscape | 3 formats |

**Update video-creator.py:**
```bash
python3 video-creator.py carousel images/*.jpg \
  --platforms instagram,tiktok \
  --output-square /tmp/square.gif \
  --output-vertical /tmp/vertical.mp4
```

---

### 3. Upload Page Updates (Priority: MEDIUM)

**Show platform-specific recommendations:**

```
Based on your platforms (Instagram, TikTok):

Recommended formats:
✅ Square (1080×1080) - Instagram Feed
✅ Vertical (1080×1920) - TikTok, Reels

[ ] Also generate landscape for LinkedIn (+€5)
```

---

### 4. Review Page Updates (Priority: MEDIUM)

**Show all generated formats:**

```
Your Video (3 formats generated)

📱 Square (Instagram)     [▶ Play]
📱 Vertical (TikTok)      [▶ Play]
💼 Landscape (LinkedIn)   [▶ Play]

Select which formats to export:
☑ Square
 Vertical
☐ Landscape
```

---

### 5. CSV Export Updates (Priority: LOW)

**Multiple VideoURL columns:**

```csv
Message,ImageURL,VideoURL_Square,VideoURL_Vertical,VideoURL_Landscape,TeamNote
"Caption",,https://square.gif,https://vertical.mp4,,Type: multi-format
```

**Or separate CSVs per platform:**
- `sociamonials_instagram.csv`
- `sociamonials_tiktok.csv`
- `sociamonials_linkedin.csv`

---

## Implementation Plan

### Phase 1: This Week (Core Features)

**Day 1 (Today):**
- [ ] Run platform preferences migration
- [ ] Add platform selector to brand context form
- [ ] Test database updates

**Day 2:**
- [ ] Update video-creator.py to accept `--platforms` flag
- [ ] Generate multiple formats based on platforms
- [ ] Test with No Label Barber images

**Day 3:**
- [ ] Update upload page to show platform recommendations
- [ ] Update review page to show all formats
- [ ] Test end-to-end flow

**Day 4:**
- [ ] Deploy to Vercel
- [ ] Test with real client
- [ ] Collect feedback

---

### Phase 2: Next Week (Enhancements)

**Smart Cropping:**
- Implement face detection
- Test crop quality
- Improve results

**Better UI:**
- Format comparison view
- Side-by-side preview
- Easy format selection

**Pricing:**
- Add multi-format to premium tier
- Update pricing page
- Update billing logic

---

### Phase 3: Later (Advanced)

**Auto-Detection:**
- Connect to Sociamonials API
- Sync connected accounts
- Auto-update preferences

**AI Optimization:**
- Platform-specific captions
- Auto-hashtag per platform
- Best posting times

**Analytics:**
- Track which formats perform best
- Show engagement by platform
- Recommend format changes

---

## Decision Needed

**Should I implement Phase 1 now?**

**What I'll do:**
1. Run platform preferences migration
2. Add platform selector to brand context
3. Update video-creator.py for multi-platform
4. Update upload/review pages
5. Test and deploy

**Time estimate:** 2-3 hours

**Risk:** Low (additive changes, backwards compatible)

---

## Alternative: Keep It Simple

**Option B: Just resize everything to square + vertical**

- Generate 2 formats for everyone
- No platform selection needed
- Client picks which to use
- Simpler, covers 95% of cases

**Pros:**
- No setup required
- Works immediately
- Less complexity

**Cons:**
- Generates unused formats
- Slightly more processing
- No LinkedIn landscape

---

## My Recommendation

**Do Phase 1 properly:**
- Add platform selection
- Generate based on preferences
- Give clients control

**Why:**
- Better UX (feels personalized)
- Upsell opportunity (multi-format tier)
- Future-proof (ready for auto-detect)
- Professional (shows we care about their platforms)

---

## What Do You Want to Do?

**Option A:** Implement full platform selection (Phase 1) - 2-3 hours  
**Option B:** Keep simple, just square + vertical for everyone - 30 mins  
**Option C:** Wait for Sociamonials API auto-detect - weeks (not recommended)

**My vote:** Option A - do it right now while we're in the flow

**Say "go" and I'll start implementing!** 🚀
