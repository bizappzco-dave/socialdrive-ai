# Deployment Checklist - Upload Types Feature

**Feature:** Image to Carousel & Video Upload Types  
**Date:** 2026-05-06  
**Status:**  Ready for Testing

---

## Pre-Deployment

### 1. Database Migration ⏳
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy: `migrations/add-upload-types-and-video-url.sql`
- [ ] Run migration
- [ ] Verify columns exist:
  ```sql
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'submissions' AND column_name = 'submission_type';
  
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'posts' AND column_name IN ('post_type', 'video_url');
  ```

### 2. Local Testing ⏳
- [ ] `cd socialdrive-ai`
- [ ] `npm run dev`
- [ ] Test upload page: `http://localhost:3000/upload/[token]`
- [ ] Test each format:
  - [ ] Images Only (3-5 images)
  - [ ] Carousel (3-10 images)
  - [ ] Video Slideshow (3-20 images)
- [ ] Verify format selector UI works
- [ ] Check image count validation
- [ ] Submit test upload
- [ ] Check backend logs for video generation
- [ ] Test review page: `http://localhost:3000/review/[token]`
- [ ] Verify video player shows for video posts
- [ ] Verify GIF shows for carousel posts
- [ ] Test CSV export
- [ ] Verify CSV columns correct

### 3. Video Generation Test ⏳
- [ ] Verify `video-creator.py` exists
- [ ] Check Python dependencies:
  ```bash
  pip3 list | grep -i movie
  ```
- [ ] Test manual video creation:
  ```bash
  cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
  python3 video-creator.py carousel no-label-images/NL\ 1.jpg no-label-images/NL\ 2.jpg no-label-images/NL\ 3.jpg --output /tmp/test-carousel.gif
  ```
- [ ] Check output file created
- [ ] Verify file plays correctly

### 4. Code Review ✅
- [x] Upload page updated with format selector
- [x] Review page updated with video player
- [x] Submit route handles all 3 types
- [x] Database migration created
- [x] Documentation complete

---

## Deployment

### 5. Git Commit ⏳
```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
git add .
git commit -m "feat: Add carousel and video upload types

- 3 format options: Images, Carousel, Video
- Auto-generate GIF/MP4 from images
- Updated review page with video player
- CSV export supports all types
- Database migration for post_type and video_url"
git push origin main
```

### 6. Vercel Deployment ⏳
- [ ] Vercel auto-deploys from main branch
- [ ] Check build logs for errors
- [ ] Verify deployment succeeds
- [ ] Test production URL

### 7. Environment Variables ⏳
Verify in Vercel Dashboard:
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ✅
- [ ] `ANTHROPIC_API_KEY` ✅ (for Claude)
- [ ] `PYTHON_PATH` (if needed for video generation)

**Note:** Video generation runs on serverless functions. May need to:
- Use Vercel Edge Functions
- Or move video generation to separate service
- Or pre-generate videos locally and upload

---

## Post-Deployment Testing

### 8. Production Testing ⏳
- [ ] Test upload on production URL
- [ ] Submit carousel upload
- [ ] Submit video upload
- [ ] Check review page shows media
- [ ] Download CSV
- [ ] Import to Sociamonials
- [ ] Verify video posts work in SM

### 9. Monitoring ⏳
- [ ] Check Vercel function logs
- [ ] Monitor video generation timeouts
- [ ] Track file sizes (GIF/MP4)
- [ ] Watch for errors in Supabase logs

---

## Known Considerations

### ⚠️ Video Generation on Vercel

**Challenge:** Vercel serverless functions have:
- 100GB/s bandwidth limit (team plan)
- 10 minute max execution time
- Limited disk space in `/tmp`

**Solutions:**
1. **Pre-generate locally** - Run video-creator.py on server, upload to Supabase Storage
2. **Use separate service** - Run video generation on dedicated server/VM
3. **Optimize for serverless** - Reduce timeout, file sizes

**Current Implementation:**
- Calls `video-creator.py` from submit route
- Outputs to `/tmp/` directory
- **May need adjustment for Vercel deployment**

**Recommendation:**
- Test video generation in Vercel preview
- If it fails, move to background job pattern:
  1. Submit creates posts immediately
  2. Triggers separate API route for video generation
  3. Video route runs as background task
  4. Updates posts.video_url when complete

---

## Rollback Plan

If issues occur:

### 1. Revert Code
```bash
git revert HEAD
git push origin main
```

### 2. Disable Feature
- Add feature flag in upload page
- Default to "images" only
- Hide carousel/video options

### 3. Database
- Columns are additive (no breaking changes)
- Safe to keep even if rolled back

---

## Success Metrics

### Week 1
- [ ] No critical bugs
- [ ] Video generation works >90% of time
- [ ] CSV imports successfully to Sociamonials
- [ ] Client feedback positive

### Month 1
- [ ] 20%+ of uploads use carousel/video
- [ ] Higher engagement on video posts
- [ ] Reduced manual editing time
- [ ] Positive client testimonials

---

## Support Contacts

**Developer:** Gabe (AI Assistant)  
**Documentation:** `UPLOAD-TYPES-IMPLEMENTATION.md`  
**Migration:** `migrations/add-upload-types-and-video-url.sql`  
**Video Script:** `video-creator.py`

---

## Final Checklist

- [ ] Database migration run ✅
- [ ] Local testing complete ⏳
- [ ] Video generation tested ⏳
- [ ] Git commit & push ⏳
- [ ] Vercel deployment successful ⏳
- [ ] Production testing complete ⏳
- [ ] Monitoring in place ⏳
- [ ] Client testing scheduled ⏳

---

**Ready to deploy!** 🚀

**Next Action:** Run database migration, then test locally
