# Database Migrations - Run Before Deploy

These migrations add the hybrid AI system (Ollama + Claude) to SocialDrive AI.

---

## Migration 1: Add AI Tier to Clients

**File:** `migrations/add-ai-tier-to-clients.sql`

**Purpose:** Allows choosing AI model per client (standard=Ollama, premium=Claude)

**Run in Supabase SQL Editor:**
```sql
-- Add AI tier selection to clients table
ALTER TABLE clients 
ADD COLUMN ai_tier TEXT DEFAULT 'standard' CHECK (ai_tier IN ('standard', 'premium'));

ALTER TABLE clients
ADD COLUMN claude_model TEXT DEFAULT 'claude-sonnet-4-5-20250929';

-- Update existing clients to standard tier
UPDATE clients SET ai_tier = 'standard' WHERE ai_tier IS NULL;

-- Index for quick tier lookups
CREATE INDEX idx_clients_ai_tier ON clients(ai_tier);

-- Set No Label Barber to premium for testing
UPDATE clients 
SET ai_tier = 'premium' 
WHERE client_name = 'No Label Barber';
```

---

## Migration 2: Reference Posts Table

**File:** `migrations/add-reference-posts.sql`

**Purpose:** Store example posts clients love during onboarding

**Run in Supabase SQL Editor:**
```sql
-- Copy contents from migrations/add-reference-posts.sql
```

---

## After Running Migrations

1. ✅ Clients table has `ai_tier` column
2. ✅ Reference posts table created
3. ✅ No Label Barber set to premium tier (testing)
4. ✅ Ready to deploy to Vercel

---

## Testing

**Standard Tier Client (Ollama):**
- Cheap, fast generation
- Auto-filters Chinese text
- Best for: High-volume, budget clients

**Premium Tier Client (Claude):**
- Better image analysis
- More reliable English
- Can describe photo content in detail
- Best for: High-end clients, image-heavy posts
- Cost: ~$0.003 per generation vs ~$0.0001 for Ollama

---

## Pricing Recommendation

**Standard:** €29/month (unlimited Ollama generations)
**Premium:** €79/month (unlimited Claude generations)
**Enterprise:** €149/month (Claude + priority support + custom features)

At 150 clients:
- If 80% standard (120 clients) = €3,480/month
- If 20% premium (30 clients) = €2,370/month
- **Total: ~€5,850/month revenue**
- **AI Costs: ~€50-100/month** (Ollama free, Claude ~€0.003 x 50 posts/client x 30 premium clients)
- **Margin: 98%+**
