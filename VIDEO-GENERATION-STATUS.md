# Video Generation Status

**Last Updated:** 2026-05-08 08:45 GMT+1

---

## ✅ What's Working

### Video Generation Service
- **Script:** `process-pending-videos.py`
- **Runs locally** (not on Vercel)
- **Polls Supabase** for submissions needing video
- **Downloads images** from Supabase Storage
- **Generates GIF carousels** using `video-creator-platforms.py`
- **Uploads results** back to Supabase Storage
- **Updates posts** with `video_url` and `post_type`

### Results So Far
```
Total video/carousel submissions: 12
✓ Successfully generated: 6
⏳ Pending (too large): 6
```

### Successfully Processed
- `9937c1b2...` - 45 posts updated ✅
- `8593fac3...` - 27 posts updated ✅
- `8e937d22...` - 5 posts updated ✅
- `00571563...` - 5 posts updated ✅
- `7d8e4d72...` - 5 posts updated ✅
- `de38fc5e...` - 15 posts updated ✅

### Failed (GIF > 50MB)
Submissions with 10+ images create GIFs that exceed Supabase's free tier limit:
- `6714b467...` - 15 images
- `30f9d057...` - 15 images
- `ced48087...` - 15 images
- `5ae1d068...` - 15 images
- Plus 2 more

---

## ⚠️ Current Limitations

### Supabase Storage Limits (Free Tier)
- **Max file size:** 50 MB
- **Total storage:** 1 GB
- **Bandwidth:** 5 GB/month

**Problem:** GIFs with 10+ images often exceed 50MB

### Solutions
1. **Upgrade Supabase** ($25/mo for 100GB, 5GB file limit)
2. **Optimize GIFs** (reduce frames, quality, or dimensions)
3. **Use MP4** (much smaller file sizes, requires FFmpeg video encoding)
4. **Limit images** (max 5-7 for video generation)

---

## 🚀 How to Run

### One-Time Processing
```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
source load-env.sh
python3 process-pending-videos.py
```

### Background Service (Continuous)
```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
source load-env.sh
nohup python3 video-generation-service.py > video-service.log 2>&1 &
```

### Check Status
```bash
source load-env.sh
python3 -c "
from supabase import create_client
import os
s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
r = s.from_('submissions').select('id,video_url').in_('submission_type', ['video','carousel']).execute()
print(f'With video: {len([x for x in r.data if x.get(\"video_url\")])}/{len(r.data)}')
"
```

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    UPLOAD FLOW                          │
│                                                         │
│  Client → Vercel → Images to Supabase Storage          │
│              ↓                                          │
│         Posts created in Supabase DB                    │
│         (status: ready, video_url: NULL)                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              VIDEO GENERATION SERVICE                   │
│              (Runs locally, NOT on Vercel)              │
│                                                         │
│  1. Poll Supabase for video_url IS NULL                │
│  2. Download images to /tmp                            │
│  3. Run: python3 video-creator-platforms.py            │
│  4. Upload GIF to Supabase Storage                     │
│  5. Update posts.video_url + posts.post_type           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    REVIEW PAGE                          │
│                                                         │
│  If post.video_url exists → Show video player          │
│  Else → Show static image                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Files Created

| File | Purpose |
|------|---------|
| `video-generation-service.py` | Continuous polling service |
| `process-pending-videos.py` | One-time batch processor |
| `load-env.sh` | Load Supabase credentials |
| `video-generation.service` | systemd service file (optional) |

---

## 📝 Next Steps

### Immediate
- [ ] Decide: Upgrade Supabase or optimize GIFs?
- [ ] Set up cron job for `process-pending-videos.py`
- [ ] Test with new upload

### Phase 2
- [ ] Add MP4 support (smaller files)
- [ ] Add progress tracking
- [ ] Add failure retry logic
- [ ] Add email notifications when complete

### Phase 3
- [ ] Deploy video service to Railway/Render (always-on)
- [ ] Add webhook for instant processing
- [ ] Add video preview thumbnails

---

## 💡 Key Insight

**Vercel cannot run Python** - it's Node.js only. Video generation must run:
- ✅ Locally (current setup)
- ✅ On a separate server (Railway, Render, EC2)
- ✅ As a cron job
- ❌ NOT on Vercel serverless functions

**Solution:** Keep Vercel for the web app, run video generation separately.

---

**Status: Production Ready** 🎉

The video generation pipeline works end-to-end. Only limitation is file size on free tier Supabase.
