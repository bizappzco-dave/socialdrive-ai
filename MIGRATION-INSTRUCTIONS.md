# Apply Database Migration - June 2, 2026

## What This Migration Does

Adds three new tables to support manual posting dashboard and team access:

1. **client_members** - Multi-user team access with roles (owner/manager/editor/viewer)
2. **posting_jobs** - Posting job queue and status tracking
3. **posting_job_results** - Per-platform posting results

Also seeds existing clients into client_members table as owners.

## Steps to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard
2. Select your project: `nmebpawvnhrokouksvir`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy the entire content from:
   `/home/dpmcg/.openclaw/workspace/socialdrive-ai/migrations/20260601_posting_and_client_members.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Ctrl+Enter)
8. Verify: Should see "Success. No rows returned"

### Option 2: Via Command Line (if psql configured)

```bash
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai

# Get your database URL from Supabase dashboard:
# Settings → Database → Connection string → URI

psql "your-connection-string-here" < migrations/20260601_posting_and_client_members.sql
```

## Verification After Migration

Run these queries in SQL Editor to verify tables were created:

```sql
-- Check client_members table
SELECT COUNT(*) as member_count FROM client_members;
-- Should show number of existing clients (seeded as owners)

-- Check posting_jobs table
SELECT COUNT(*) as job_count FROM posting_jobs;
-- Should return 0 (empty table, ready for jobs)

-- Check posting_job_results table
SELECT COUNT(*) as result_count FROM posting_job_results;
-- Should return 0 (empty table, ready for results)
```

## Rollback (if needed)

If something goes wrong, run this to undo:

```sql
BEGIN;
DROP TABLE IF EXISTS posting_job_results CASCADE;
DROP TABLE IF EXISTS posting_jobs CASCADE;
DROP TABLE IF EXISTS client_members CASCADE;
COMMIT;
```

## Next Steps After Migration

1. Test the dashboard: https://socialdrive-ai.vercel.app/client/posting
2. Verify posting jobs can be created
3. Test team management: https://socialdrive-ai.vercel.app/client/team

---

**Migration file location:**
`/home/dpmcg/.openclaw/workspace/socialdrive-ai/migrations/20260601_posting_and_client_members.sql`
