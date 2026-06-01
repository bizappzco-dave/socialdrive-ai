# SocialDrive AI - TaskifiAI Schema Differences

## Database Migration Notes
**Date:** 2026-05-29
**Project:** TaskifiAI (`nmebpawvnhrokouksvir.supabase.co`)

---

## Schema Differences Fixed

### submissions table
| Column | Old Schema | TaskifiAI Schema | Action Taken |
|--------|-----------|------------------|--------------|
| `post_count` | ✅ EXISTS | ❌ REMOVED | Removed from all updates |
| `submission_type` | ✅ EXISTS | ❌ REMOVED | Removed from updates |
| `generated_at` | ✅ EXISTS | ❌ REMOVED | Removed from updates |
| `status` | enum: pending,generating,ready,failed | enum: pending,processing,completed,failed | Changed 'generating'→'pending', 'ready'→'completed' |

### posts table
| Column | Old Schema | TaskifiAI Schema | Action Taken |
|--------|-----------|------------------|--------------|
| `caption_text` | ✅ | ❌ | Changed to `caption` |
| `image_url` | ✅ (string) | ❌ | Changed to `image_urls[]` (array) |
| `caption_style` | ✅ | ❌ | Removed |
| `hashtag_count` | ✅ | ❌ | Removed |
| `emoji_count` | ✅ | ❌ | Removed |
| `emojis_used` | ✅ | ❌ | Removed |
| `post_type` | ✅ | ❌ | Removed |
| `image_filename` | ✅ | ❌ | Removed |
| `selected` | ✅ | ❌ | Removed from queries |
| `deleted` | ✅ | ❌ | Removed from queries |
| `platform` | ❌ | ✅ REQUIRED | Added: 'instagram' |
| `status` | ❌ | ✅ REQUIRED | Added: 'draft' |
| `submission_id` | ❌ | ✅ REQUIRED | Added FK |

### submission_images table
| Column | Old Schema | TaskifiAI Schema | Action Taken |
|--------|-----------|------------------|--------------|
| `image_url` | ✅ | ❌ | Changed to `public_url` |
| `image_filename` | ✅ | ❌ | Changed to `file_name` |
| `image_size` | ✅ | ❌ | Changed to `file_size` |
| `image_context` | ✅ | ❌ | Removed |
| `client_id` | ❌ | ✅ REQUIRED | Added |
| `mime_type` | ❌ | ✅ | Optional |
| `storage_path` | ❌ | ✅ | Optional |
| `width/height` | ❌ | ✅ | Optional |
| `caption` | ❌ | ✅ | Optional |

---

## Files Modified

1. `src/app/api/submissions/upload/[token]/submit/route.ts`
   - Removed `post_count` updates (4 locations)
   - Removed `submission_type` update
   - Removed `generated_at` update
   - Changed status: 'generating' → 'pending', 'ready' → 'completed'
   - Fixed posts insert to match TaskifiAI schema
   - Fixed submission_images insert to match TaskifiAI schema
   - Changed `caption_text` → `caption` in filters

2. `src/app/api/submissions/[id]/posts/route.ts`
   - Changed select: `caption_text` → `caption`
   - Changed select: `image_url` → `image_urls`
   - Removed `caption_style`, `emoji_count`, `emojis_used`, `selected`, `deleted`

---

## Test Tokens to Clean Up

- `bc77eee72901bb3c04069dd6140e55df` - Final test (5 images, 70 posts)
- `06320a7209aa6dd37091aa5af0545544` - Multiple tests
- `c1cea5628a2db775b1c1c3df79c289b9` - Early tests

---

## Production Checklist

- [ ] Delete test submissions from database
- [ ] Delete test posts from database
- [ ] Delete test images from storage
- [ ] Verify no hardcoded test data in code
- [ ] Update environment docs with TaskifiAI credentials
- [ ] Document schema in Supabase dashboard

---

## Key Decisions

1. **TaskifiAI is source of truth** - syncs to SocialDrive and DS Champs
2. **3 captions per image** - not 15 (user preference)
3. **Silent MCP processing** - no UI hints about AI processing
4. **Status enum:** pending → processing → completed → failed
