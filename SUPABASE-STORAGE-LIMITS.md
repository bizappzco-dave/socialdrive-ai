# Supabase Storage - Limits & Costs

## Current Setup

**Bucket:** `submissions`  
**URL:** `https://nmebpawvnhrokouksvir.supabase.co/storage/v1/object/public/submissions/`  
**Path structure:** `{client_id}/{timestamp}-{random}.{ext}`

---

## Free Tier Limits (Supabase Free Plan)

### Storage
- **Total storage:** 1 GB
- **Bandwidth:** 5 GB/month
- **File size limit:** 50 MB per file

### Database
- **Database size:** 500 MB
- **Rows:** Unlimited (within 500 MB)

### API Calls
- **API requests:** Unlimited (rate limited to 100 req/sec)

---

## Current Usage Estimate

### Per Client Upload
- **Simple tier:** 3-5 images × ~500KB = **1.5-2.5 MB**
- **Pro tier (carousel):** 5-10 images × ~500KB = **2.5-5 MB**
- **Video:** 1 video × ~10MB = **10 MB**

### At Scale
| Clients | Uploads/Month | Storage/Month | Total Storage (6mo) |
|---------|--------------|---------------|-------------------|
| 10 | 4 each | 100 MB | 600 MB |
| 20 | 4 each | 200 MB | 1.2 GB ⚠️ |
| 50 | 4 each | 500 MB | 3 GB ❌ |

**Break-even:** ~15-20 active clients will exceed 1GB in 6 months

---

## When to Upgrade

### Pro Plan ($25/month)
- **Storage:** 100 GB
- **Bandwidth:** 250 GB/month
- **File size:** 5 GB per file

**Cost per client:** €25 / 50 clients = **€0.50/client/month**

### Team Plan ($50/month)
- **Storage:** 250 GB
- **Bandwidth:** 500 GB/month

---

## Optimization Strategies

### 1. Image Compression
- Compress uploads to max 300KB each
- Use WebP format (30% smaller than JPEG)
- **Savings:** 40-50% storage

### 2. Auto-Delete Old Submissions
- Keep only last 3 submissions per client
- Delete after 90 days
- **Savings:** 60-70% storage

### 3. Client-Based Cleanup
- Delete images after CSV export
- Keep only generated carousels (not originals)
- **Savings:** 50% storage

### 4. External Storage (Advanced)
- Cloudflare R2 (free 10 GB)
- Backblaze B2 ($0.005/GB/month)
- AWS S3 (free tier 5 GB for 12 months)

---

## Monitoring

### Check Current Usage
```sql
-- Total storage used
SELECT 
  bucket_id,
  SUM(metadata->>'size')::bigint / 1024 / 1024 AS size_mb
FROM storage.objects
GROUP BY bucket_id;

-- Count files per client
SELECT 
  split_part(name, '/', 1) as client_id,
  count(*) as file_count,
  SUM(metadata->>'size')::bigint / 1024 / 1024 as size_mb
FROM storage.objects
WHERE bucket_id = 'submissions'
GROUP BY split_part(name, '/', 1)
ORDER BY size_mb DESC;
```

### Set Up Alerts
- Monitor at 500 MB (50% of free tier)
- Alert before month-end (bandwidth reset)

---

## Recommendation

**Start:** Free tier (1 GB)  
**Monitor:** Check usage weekly  
**Upgrade trigger:** 700 MB used (70% of limit)  
**Target upgrade:** Pro plan ($25/month) at 15-20 active clients

**Revenue coverage:** At €97-197/client/month, 2 clients cover the Pro plan cost.

---

## Action Items

- [ ] Add storage monitoring query to dashboard
- [ ] Implement image compression (max 300KB)
- [ ] Add auto-cleanup policy (90 days)
- [ ] Document upgrade process in runbook
