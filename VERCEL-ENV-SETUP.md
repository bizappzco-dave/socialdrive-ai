# Vercel Environment Variables Setup

**Required:** Set these in Vercel Dashboard for production deployment

---

## Steps

1. Go to: https://vercel.com/social-drive-ai/socialdrive-ai/settings/environment-variables
2. Click "Add New"
3. Add each variable below for **Production** environment

---

## Environment Variables

| Name | Value |
|------|-------|
| `NEXTAUTH_URL` | `https://socialdrive-ai.vercel.app` |
| `NEXTAUTH_SECRET` | `change-this-to-a-random-string-later` (or generate new one) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://dqhnxzaktnejasqlfrjf.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaG54emFrdG5lamFzcWxmcmpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2Mzc5NDQsImV4cCI6MjA5MzIxMzk0NH0.XXdChx8pqA-KjIBGeBTBp5NLsZLoMs_YySFEsHS_RNc` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxaG54emFrdG5lamFzcWxmcmpmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzYzNzk0NCwiZXhwIjoyMDkzMjEzOTQ0fQ.fN3J5CIs5BMuSCYNFBvV0ZLPHGhyyeNdtdOjUA59soY` |

---

## After Adding Variables

1. **Redeploy** the project (Vercel will auto-redeploy when you save env vars)
2. **Wait 2-3 minutes** for build to complete
3. **Test:** https://socialdrive-ai.vercel.app/agency/clients

---

## Generate New NEXTAUTH_SECRET (Optional)

Run this command to generate a secure random secret:

```bash
openssl rand -base64 32
```

Copy the output and use it as the `NEXTAUTH_SECRET` value.

---

## Verify It Works

After redeployment:

1. Visit: https://socialdrive-ai.vercel.app/agency/clients
2. Should see the agency dashboard (no white screen error)
3. If still broken, check browser console for errors

---

**Status:** ⏳ Waiting for manual setup in Vercel dashboard
