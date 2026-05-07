# SocialDrive CLI Scripts

Quick command-line tools for managing SocialDrive clients.

## Prerequisites

Make sure you have `.env.local` in the project root with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Scripts

### `create-client.sh` - Create a New Client

Creates a client account with upload/review links in one command.

**Usage:**
```bash
./scripts/create-client.sh "Client Name" "Industry" [tier]
```

**Examples:**
```bash
# Simple tier (€29) - posts only
./scripts/create-client.sh "LED Lights Dublin" "Retail" simple

# Pro tier (€79) - format/platform selection
./scripts/create-client.sh "No Label Barber" "Barber Salon" pro

# Agency tier (€149) - all features
./scripts/create-client.sh "Big Agency" "Marketing" agency

# Defaults to simple tier if not specified
./scripts/create-client.sh "Test Client" "Other"
```

**Output:**
- Creates client in database
- Generates upload token
- Generates review token
- Prints both URLs ready to share

**Tiers:**
- `simple` (€29) - Posts only, Instagram default, max 5 photos
- `pro` (€79) - Format selection, platform selection, 3 team seats
- `agency` (€149) - All features including bulk upload, API access, white label, analytics, 10 team seats

## Manual Fallback

If the script fails, you can do it manually:

1. **Create client:**
```sql
INSERT INTO clients (user_id, name, industry, tier, is_active)
VALUES ('6edb897e-6882-4698-925c-2f9693787242', 'Client Name', 'Industry', 'simple', true);
```

2. **Generate tokens** (use any random hex generator):
```sql
INSERT INTO submissions (client_id, upload_token, review_token, client_name, status)
VALUES ('client-uuid-here', 'random-hex-32-chars', 'random-hex-32-chars', 'Client Name', 'pending');
```

3. **Construct URLs:**
```
Upload: https://socialdrive-ai.vercel.app/upload/{upload_token}
Review: https://socialdrive-ai.vercel.app/review/{review_token}
```

## Automation Future

Eventually, account creation can be automated via DMChamp:
- User sends client details via chat
- Script runs automatically
- Links returned in chat
- Optional: auto-send welcome email to client

But for now, the CLI script is your fastest option!
