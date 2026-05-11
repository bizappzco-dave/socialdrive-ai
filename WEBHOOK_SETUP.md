# DM Champ Webhook Setup Guide

Setting up webhooks to automatically receive onboarding conversation data from DM Champ.

---

## Webhook URL

```
POST https://socialdrive-ai.vercel.app/api/webhooks/dmchamp/onboarding
```

---

## Configuration Steps

### 1. In DM Champ Dashboard

1. Go to **Settings → Integrations → Webhooks**
2. Click **Add Webhook**
3. Fill in the webhook details:

| Field | Value |
|-------|-------|
| **Webhook URL** | `https://socialdrive-ai.vercel.app/api/webhooks/dmchamp/onboarding` |
| **Events** | ✓ flow.completed<br>✓ contact.tagged (optional)<br>✓ contact.updated (optional) |
| **Secret** (if required) | Generate a secret and add to `DMCHAMP_WEBHOOK_SECRET` env var |
| **Active** | ✓ Enabled |

4. Save and test the webhook

---

## Environment Variables

Add these to your `.env.local` and Vercel dashboard:

```bash
# DM Champ Webhook Secret (optional)
DMCHAMP_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## Expected Webhook Payload

When a client completes the onboarding flow, DM Champ sends:

```json
{
  "event": "flow.completed",
  "contact": {
    "id": "dmchamp_123456",
    "phone": "+353871234567",
    "first_name": "David",
    "custom_fields": {
      "business_name": "No Label Barber",
      "website_url": "https://nolabel.ie",
      "instagram_handle": "nolabelbarber",
      "facebook_handle": "",
      "linkedin_handle": "",
      "target_audience": "Men 25-45, professionals who care about grooming",
      "brand_tone": "Professional & polished",
      "usps": "Master barbers, 20+ years experience, Dublin location",
      "competitors": "Blade & Barrel, The Grafton Barber",
      "words_to_use": "Dublin, craftsmanship, master barber",
      "words_to_avoid": "cheap, discount, budget",
      "content_preferences": "Before/after photos, Team spotlights"
    }
  }
}
```

---

## What Happens When Webhook Runs

```
DM Champ sends webhook
       ↓
Find client by phone (search metadata)
       ↓
If not found → Create new client
       ↓
Map custom fields → brand_contexts table
       ↓
Generate upload token
       ↓
Log to onboarding_logs table
       ↓
Return: { clientId, uploadToken, success }
```

---

## Database Tables

### onboarding_logs
Audit trail for all onboarding attempts:
- `client_id` - Link to client
- `event` - Webhook event type
- `phone` - Normalized phone number
- `raw_data` - Full webhook payload
- `status` - success, pending, failed

### onboarding_conversations
Stores full conversations for data extraction:
- `client_id`
- `phone`
- `conversation_json` - Full message history
- `extracted_data` - Processed fields
- `processing_status` - pending, ready, processed

### webhook_endpoints (optional)
Tracks configured webhooks:
- `name`, `path`, `provider`, `events`
- `is_active`

---

## Testing the Webhook

### Method 1: DM Champ Test Button
1. In DM Champ, click "Test Webhook"
2. Send sample payload
3. Check Vercel function logs for 200 response

### Method 2: cURL

```bash
curl -X POST https://socialdrive-ai.vercel.app/api/webhooks/dmchamp/onboarding \
  -H "Content-Type: application/json" \
  -d '{
    "event": "flow.completed",
    "contact": {
      "id": "test_123",
      "phone": "+353871234567",
      "first_name": "Test",
      "custom_fields": {
        "business_name": "Test Business",
        "website_url": "https://example.com",
        "target_audience": "Test customers"
      }
    }
  }'
```

### Method 3: Local Testing

```bash
# Start local dev server
npm run dev

# Send test webhook
curl -X POST http://localhost:3000/api/webhooks/dmchamp/onboarding \
  -H "Content-Type: application/json" \
  -d @webhook-payload.json
```

---

## Troubleshooting

### 404 Error
- Webhook not deployed yet → Deploy to Vercel

### 401 Error  
- Webhook secret mismatch → Check `DMCHAMP_WEBHOOK_SECRET`

### 500 Error
- Database migration not run → Run SQL migration
- Check Vercel function logs

### Client Not Found
- Phone number format mismatch → Check normalization logic

---

## Migration Deploy

Run the SQL migration to create tables:

```bash
# Via Supabase CLI
supabase db push

# Or copy SQL to Supabase SQL Editor
# File: /supabase/migrations/20250510_onboarding_webhook.sql
```

---

## Future Enhancements

- [ ] Full conversation storage (every message, not just final data)
- [ ] AI-powered conversation parsing (extract from unstructured chat)
- [ ] Manual conversation upload (for non-DM Champ sources)
- [ ] Webhook retry queue (for failed deliveries)
- [ ] Payload validation schema
- [ ] Rate limiting per client

---

## Support

Questions? Check the logs:
- Vercel Functions logs (real-time)
- `onboarding_logs` table (history)
- `webhook_endpoints` table (configuration)
