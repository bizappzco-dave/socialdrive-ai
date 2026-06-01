# SocialDrive AI - Railway Deployment Guide

**Last Updated:** June 1, 2026
**Status:** Ready for deployment

---

## 📦 Railway Project

**Project:** `aware-simplicity`  
**Project ID:** `afa5edc7-d90e-4d08-99e7-aaf3b70e8865`

---

## 🏗️ Architecture (All-in-One Railway)

```
Railway Project: aware-simplicity
├─ Service 1: distinguished-elegance (Ollama template)
│   ├─ Internal URL: http://distinguished-elegance:11434
│   ├─ Public URL: https://ollama-production-6ab6.up.railway.app (optional)
│   └─ Model: llama3.2:latest
│
├─ Service 2: social-drive-mcp-railway (GitHub: bizappzco-dave/social-drive-MCP-Railway)
│   ├─ Internal URL: http://social-drive-mcp-railway-production:8080
│   ├─ Public URL: https://social-drive-mcp-railway-production-cb81.up.railway.app
│   └─ Env Vars:
│       - OLLAMA_BASE_URL=http://distinguished-elegance:11434
│       - OLLAMA_MODEL=llama3.2
│
└─ Service 3: socialdrive-ai (GitHub: bizappzco-dave/socialdrive-ai)
    ├─ Public URL: https://socialdrive-ai-production.up.railway.app
    └─ Env Vars:
        - NEXT_PUBLIC_MCP_URL=http://social-drive-mcp-railway-production:8080
        - NEXT_PUBLIC_SUPABASE_URL=https://nmebpawvnhrokouksvir.supabase.co
        - SUPABASE_SERVICE_ROLE_KEY=***
        - ANTHROPIC_API_KEY=***
```

---

## 🚀 Deployment Steps

### Step 1: Deploy Frontend Service

1. Go to https://railway.com/project/afa5edc7-d90e-4d08-99e7-aaf3b70e8865
2. Click **"New"** → **"GitHub Repo"**
3. Select: **`bizappzco-dave/socialdrive-ai`**
4. Railway will auto-detect `railway.toml` → uses Dockerfile

### Step 2: Set Environment Variables (Frontend)

In Railway dashboard → Frontend service → **Variables** tab:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://nmebpawvnhrokouksvir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...s1Lo
SUPABASE_URL=https://nmebpawvnhrokouksvir.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...ePtg

# AI Services (INTERNAL Railway URLs - faster, more reliable)
NEXT_PUBLIC_MCP_URL=http://social-drive-mcp-railway-production:8080
ANTHROPIC_API_KEY=sk-ant-***

# App Settings
NODE_ENV=production
PORT=3000
```

⚠️ **CRITICAL:** Use internal URLs (not `.up.railway.app` public URLs):
- ✅ `http://social-drive-mcp-railway-production:8080`
- ❌ `https://social-drive-mcp-railway-production-cb81.up.railway.app`

### Step 3: Update MCP Service Env Vars

In Railway dashboard → MCP service → **Variables** tab:

```bash
# Change OLLAMA_BASE_URL from public to internal
OLLAMA_BASE_URL=http://distinguished-elegance:11434
OLLAMA_MODEL=llama3.2
```

This uses Railway's private network instead of public HTTP.

### Step 4: Generate Public Domain (Frontend)

1. Click frontend service → **"Settings"** tab
2. Scroll to **"Domains"**
3. Click **"Generate Domain"**
4. Copy the domain (e.g., `socialdrive-ai-production.up.railway.app`)

### Step 5: Redeploy Services

**Option A: Via Dashboard**
- Click each service → **"Deployments"** → **"Redeploy"**

**Option B: Via API**
```bash
TOKEN="IfkppiwbQEQJfuDIIfA_qtxd655xPIumF6RP4j2t0a_"
ENV_ID="9e9dfaff-f582-41c0-b592-675907870e25"

# Redeploy MCP
curl -X POST https://backboard.railway.app/graphql/v2 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { serviceInstanceRedeploy(serviceId: \"5201592b-fefb-4953-9a6f-044ec07e0e1b\", environmentId: \"'$ENV_ID'\") }"}'

# Redeploy Frontend (after GitHub push triggers auto-deploy)
```

---

## 🧪 Testing Checklist

### 1. Health Checks

```bash
# Frontend (your Railway domain)
curl https://socialdrive-ai-production.up.railway.app

# MCP Server
curl https://social-drive-mcp-railway-production-cb81.up.railway.app/health
# Expected: {"status":"healthy","ollama_url":"http://distinguished-elegance:11434","model":"llama3.2"}

# Ollama
curl https://ollama-production-6ab6.up.railway.app/api/tags
# Expected: {"models":[{"name":"llama3.2:latest",...}]}
```

### 2. Upload Flow Test

1. Go to Railway frontend domain
2. Navigate to `/agency/clients`
3. Create test client or use existing upload link
4. Upload 3-5 images
5. Add brief
6. Submit

**Expected:**
- ✅ Images upload to Supabase
- ✅ MCP analyzes with Ollama (internal network)
- ✅ 3 captions generated per image
- ✅ Posts created in database
- ✅ "Upload Complete!" screen shown

### 3. Check Logs

In Railway dashboard → Each service → **"Logs"** tab:

**Frontend logs should show:**
```
✓ Ready in XXXms
GET /upload/xxx 200
POST /api/submissions/upload/xxx/submit 200
```

**MCP logs should show:**
```
✓ Template match successful
✓ Caption generation successful
```

**Ollama logs should show:**
```
llama3.2: loading model
ready
```

---

## 🔍 Troubleshooting

### Frontend can't reach MCP

**Symptom:** Upload fails with "MCP server unavailable"

**Check:**
1. Frontend env var `NEXT_PUBLIC_MCP_URL` = `http://social-drive-mcp-railway-production:8080`
2. MCP service is running (green status in Railway)
3. MCP service name matches the URL (check Railway dashboard)

**Fix:** Update env var with correct service name

### MCP can't reach Ollama

**Symptom:** "Ollama API error: connection refused"

**Check:**
1. MCP env var `OLLAMA_BASE_URL` = `http://distinguished-elegance:11434`
2. Ollama service is running (green status)
3. Ollama service name matches the URL

**Fix:** Update env var with correct service name

### Build fails on Railway

**Symptom:** "npm run build" fails

**Check logs for:**
- Missing env vars during build
- TypeScript errors
- Memory limits (may need to upgrade Railway plan)

**Fix:**
- Add missing env vars
- Fix TypeScript errors locally first
- Consider using `output: 'standalone'` in next.config.js (already configured)

---

## 💰 Cost Estimate

| Service | Railway Plan | Monthly Cost |
|---------|-------------|--------------|
| Ollama (2GB RAM) | Hobby | ~$5 |
| MCP Server (512MB) | Hobby | ~$2 |
| Frontend (1GB RAM) | Hobby | ~$3 |
| **Total** | | **~$10/month** |

**Savings vs Ollama Cloud API:** ~$40-50 → ~$10 = **80% reduction**

---

## 📝 Service Names (Railway Auto-Generated)

Railway generates random service names. Verify in dashboard:

| Service | Likely Name | Verify By |
|---------|------------|-----------|
| Ollama | `distinguished-elegance` | Curl `/` → "Ollama is running" |
| MCP | `social-drive-mcp-railway-production` | Curl `/health` → JSON |
| Frontend | `socialdrive-ai-production` | Curl `/` → HTML with "SocialDrive" |

**Always use the actual service name from Railway dashboard in internal URLs.**

---

## 🎯 Internal vs Public URLs

**Internal (service-to-service):**
- Format: `http://<service-name>:<port>`
- Examples:
  - `http://distinguished-elegance:11434`
  - `http://social-drive-mcp-railway-production:8080`
- ✅ Faster (private network)
- ✅ More reliable (no external DNS)
- ✅ Free (no bandwidth charges)
- ❌ Only works within Railway project

**Public (user-facing):**
- Format: `https://<service-name>.up.railway.app`
- Examples:
  - `https://ollama-production-6ab6.up.railway.app`
  - `https://socialdrive-ai-production.up.railway.app`
- ✅ Accessible from internet
- ❌ Slower (public HTTP)
- ❌ Counts against bandwidth

**Rule of thumb:**
- Frontend → MCP: **Internal**
- MCP → Ollama: **Internal**
- User → Frontend: **Public**

---

## ✅ Deployment Complete Checklist

- [ ] Frontend deployed to Railway
- [ ] Frontend env vars set (Supabase, MCP internal URL)
- [ ] MCP env vars updated (Ollama internal URL)
- [ ] Public domain generated for frontend
- [ ] Health checks passing
- [ ] Upload flow tested end-to-end
- [ ] Logs show no errors
- [ ] Posts created in Supabase
- [ ] Review page accessible

---

**Ready to deploy?** Follow the steps above in the Railway dashboard! 🚀
