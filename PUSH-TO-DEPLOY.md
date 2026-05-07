# Push to Deploy - Upload Types Feature

**Status:** ✅ Code committed, ready to push

---

## Quick Push Command

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
git push origin main
```

**What this will do:**
1. Push commit `f255b7e` to GitHub
2. Vercel auto-detects the push
3. Vercel deploys to production
4. New version live at https://socialdrive-ai.vercel.app/

---

## What's Being Deployed

### Commit: `f255b7e - feat: Add carousel and video upload types`

**Files Changed (11):**
- ✅ `src/app/upload/[token]/page.tsx` - Format selector UI
- ✅ `src/app/review/[token]/page.tsx` - Video player
- ✅ `src/app/api/submissions/upload/[token]/submit/route.ts` - Backend logic
- ✅ `migrations/add-upload-types-and-video-url.sql` - Database schema
- ✅ `video-creator.py` - Video/GIF generation script
- ✅ 6 documentation files

**Stats:**
- 2,418 lines added
- 60 lines removed
- 4 new files created

---

## After Push

### 1. Wait for Vercel Deploy (~2-5 minutes)

**Monitor:**
- GitHub: https://github.com/bizappzco-dave/socialdrive-ai/commits/main
- Vercel: https://vercel.com/dashboard (check deployments)

### 2. Test Production

**Upload Page:**
```
https://socialdrive-ai.vercel.app/upload/[token]
```

**Check:**
- [ ] 3 format cards visible (Images, Carousel, Video)
- [ ] Clicking each updates UI
- [ ] Image count validation works
- [ ] Submit works

**Review Page:**
```
https://socialdrive-ai.vercel.app/review/[token]
```

**Check:**
- [ ] Video posts show player
- [ ] Carousel posts show GIF
- [ ] Type badges visible (🎬 Video, 🎠 Carousel)

### 3. Test Video Generation

**Important:** Video generation calls Python script on server.

**If it works:**
- ✅ Carousel/video uploads create GIF/MP4
- ✅ Review page shows generated media
- ✅ CSV has VideoURL column

**If it fails:**
- Check Vercel function logs
- May need to adjust for serverless environment
- Fallback: Posts still created, just without media

---

## Troubleshooting

### SSH Push Fails

**Error:** `Host key verification failed`

**Fix:**
```bash
# Add GitHub to known hosts
ssh-keyscan github.com >> ~/.ssh/known_hosts

# Or use HTTPS instead
git remote set-url origin https://github.com/bizappzco-dave/socialdrive-ai.git
git push origin main
# Will prompt for GitHub credentials
```

### Vercel Deploy Fails

**Check:**
1. Vercel Dashboard → Deployments → Click failed deploy
2. View build logs
3. Look for errors

**Common issues:**
- Missing environment variables
- Build errors in TypeScript
- Python dependencies not found

### Video Generation Fails on Vercel

**Why:** Vercel serverless has limitations (disk space, execution time)

**Solutions:**
1. **Pre-generate locally** - Run script before deploy, upload to Supabase Storage
2. **Background job** - Separate API route for video generation
3. **External service** - Use AWS Lambda, Cloud Functions, etc.

**For now:** Test and see if it works. If not, we'll adjust.

---

## Rollback (If Needed)

```bash
# Revert last commit
git revert HEAD
git push origin main

# Vercel auto-deploys the revert
```

---

## Summary

**Ready to push:**
```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
git push origin main
```

**Then test:**
1. https://socialdrive-ai.vercel.app/upload/[token]
2. https://socialdrive-ai.vercel.app/review/[token]

**Expected:** New format selector visible, video generation working

---

**Let me know when you've pushed and I'll help test!** 🚀
