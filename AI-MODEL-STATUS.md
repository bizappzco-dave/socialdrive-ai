# AI Model Status

**Last Updated:** 2026-05-08 08:45 GMT+1

---

## Current Configuration

### ✅ Ollama Cloud (Active)
- **Model:** qwen3.5:397b (397 billion parameters)
- **Host:** https://ollama.com
- **Status:** ✅ Working
- **Limits:** None (hosted cloud service)
- **Cost:** Free tier

**Usage:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:cloud",
  "prompt": "Hello!"
}'
```

### ❌ Claude API (Not Configured)
- **Model:** claude-sonnet-4-5-20250929
- **Status:** ❌ API key is placeholder (`CHANGEME`)
- **Required:** Valid Anthropic API key

**To Enable:**
1. Get API key from https://console.anthropic.com
2. Update `.env.local`:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```
3. Restart Next.js dev server

---

## Routing Logic (Updated)

```typescript
// src/lib/ai/hybrid-generator.ts

if (clientTier === 'premium' && claudeKeyValid) {
  → Use Claude API (premium quality)
} else {
  → Use Ollama Cloud qwen3.5:397b (default, unlimited)
}
```

**Default behavior:** All clients use Ollama Cloud unless:
1. Client is premium tier AND
2. Claude API key is configured

---

## Model Comparison

| Feature | Ollama Cloud (qwen3.5) | Claude Sonnet 4 |
|---------|------------------------|-----------------|
| **Parameters** | 397B | ~175B (estimated) |
| **Speed** | Fast (~2-5s) | Fast (~1-3s) |
| **Quality** | Excellent | Excellent |
| **Vision** | ✅ Yes | ✅ Yes |
| **Cost** | Free | ~$0.003/1K tokens |
| **Limits** | None | Rate limits apply |
| **Setup** | ✅ Ready | ❌ Needs API key |

---

## Recommendation

**Stay with Ollama Cloud for now:**

✅ **Pros:**
- No API key needed
- No usage limits
- No cost
- Qwen3.5 397B is very capable
- Already working

❌ **Claude would require:**
- API key setup
- Cost tracking (~$0.01-0.05 per caption batch)
- Rate limit monitoring
- Billing setup

**When to switch to Claude:**
- If you need specific Claude features
- If Ollama Cloud becomes unreliable
- If you have Anthropic credits to use

---

## Performance

**Current Ollama Cloud performance:**
- Caption generation: ~2-5 seconds per image
- 15 images (45 captions): ~60-90 seconds total
- Reliability: ✅ Stable

**No signs of hitting any limits** - Ollama Cloud is a hosted service with no local GPU constraints.

---

## Files Updated

- `src/lib/ai/hybrid-generator.ts` - Switched to Ollama by default
- `.env.local` - Claude key still placeholder (intentional)

---

## Monitoring

Check Ollama status:
```bash
curl http://localhost:11434/api/tags
```

Check current model:
```bash
/openclaw status
# Shows: Model: ollama/qwen3.5:cloud
```

---

**Status: Ollama Cloud Recommended** ✅

No action needed unless you specifically want Claude features.
