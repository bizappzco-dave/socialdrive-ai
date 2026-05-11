# Onboarding Questions Configuration

Complete guide to configuring mandatory questions and capturing answers.

---

## Required Question Structure

### Core Questions (Must Have)

| # | Question | Field Name | Required | Type |
|---|----------|------------|----------|------|
| 1 | Business name | `business_name` | ✓ Yes | Single text |
| 2 | Website URL | `website_url` | ✗ No | URL or "none" |
| 3 | Social media handles | `instagram_handle`, `facebook_handle`, `linkedin_handle` | ✗ No | Instagram/Facebook/LinkedIn |
| 4 | Target audience | `target_audience` | ✓ Yes | Single text |
| 5 | Brand tone/style | `brand_tone` | ✓ Yes | Single choice or text |
| 6 | What makes you different (USPs) | `usps` | ✓ Yes | Multi-item list |
| 7 | Main competitors | `competitors` | ✗ No | Multi-item list |
| 8 | Words/phrases to ALWAYS use | `words_to_use` | ✗ No | Multi-item list |
| 9 | Words to AVOID | `words_to_avoid` | ✗ No | Multi-item list |
| 10 | Content types that work | `content_preferences` | ✓ Yes | Multi-select |
| 11 | Location | `location` | ✗ No | City/Region |
| 12 | Industry | `industry` | ✗ No | Single text |

**Total Required: 5 questions minimum**  
**Recommended: All 12 for best AI content**

---

## DM Champ Chat Flow Configuration

### Step-by-Step Message Setup

**Message 1: Welcome (Auto-send)**
```
👋 Hi {{first_name}}! Welcome to {{agency_name}}!

To create content that perfectly matches your brand, I need to ask you {{question_count}} quick questions.

This will take about 3-4 minutes. Ready? Just reply "Yes" to start!
```

**Message 2: Q1 - Business Name (Wait for reply)**
```
1️⃣ What's your business name?

This is how we'll refer to you in content.

Example: "No Label Barber" or "Dublin LED Solutions"
```
*Wait condition: Wait for reply*  
*Store in custom field: `business_name`*  
*Validation: Required - if empty, re-prompt "Please tell me your business name"*

**Message 3: Q2 - Website (Wait for reply)**
```
2️⃣ What's your website?

If you don't have one, just reply "none".
```
*Store in: `website_url`*  
*Validation: Accept "none" or "no website" as valid*

**Message 4: Q3 - Social Media (Wait for reply)**
```
3️⃣ What social media are you active on?

Tell me your handles:
• Instagram: {{instagram_handle}}
• Facebook: {{facebook_handle}}
• LinkedIn: {{linkedin_handle}}

Skip any you don't use.
```
*Store in 3 separate fields*  
*Validation: Optional - can be blank*

**Message 5: Q4 - Target Audience (Wait for reply)**
```
4️⃣ Who's your ideal customer?

Tell me age, demographics, what they care about. The more specific, the better your content will be.

Example: "Men 25-45, professionals who value quality over price, Dublin
city center area"
```
*Required field*  
*If vague: "Can you be more specific? For example, what age range or location?"*

**Message 6: Q5 - Brand Tone (Wait for reply)**
```
5️⃣ How would you describe your brand's personality?

Pick one OR describe your own:
🔘 Professional & polished
🔘 Friendly & approachable
🔘 Bold & edgy
🔘 Luxurious & exclusive
🔘 Fun & playful
🔘 Other: _______
```
*Required field*  
*Use quick reply buttons if DM Champ supports them*

**Message 7: Q6 - USPs (Wait for reply)**
```
6️⃣ What makes you different from competitors?

Your unique selling points - things only you offer or do better.

Separate with commas:
Example: "Master barbers with 20 years experience, premium products only,
Dublin city center location"
```
*Required field*  
*Parse commas into array*

**Message 8: Q7 - Competitors (Wait for reply)**
```
7️⃣ Who are your main competitors?

Name 2-3 businesses you compete with. This helps us position you correctly.

Example: "Blade & Barrel, The Grafton Barber, local barbers"
```
*Optional field*

**Message 9: Q8 - Words to Use (Wait for reply)**
```
8️⃣ Any words or phrases you ALWAYS want in content?

These will appear regularly in your posts.

Example: "Dublin, master craftsmanship, book now, premium quality"
```
*Optional*  
*Parse into key_messages array*

**Message 10: Q9 - Words to Avoid (Wait for reply)**
```
9️⃣ Any words to AVOID?

Words you never want mentioned, or that don't fit your brand.

Example: "cheap, discount, budget, competitor names"
```
*Optional*  
*Parse into avoid_words array*

**Message 11: Q10 - Content Preferences (Wait for reply)**
```
🔟 What type of content works best for you?

Select all that apply:
☐ Before/after photos
☐ Team/person spotlights
☐ Promotions and offers
☐ Educational tips
☐ Behind the scenes
☐ Customer testimonials
☐ Product showcases
☐ Local community content
```
*Required field*  
*Use checkboxes or number list*

**Message 12: Completion**
```
✨ Perfect! That's everything we need.

📋 **Summary:**
• Business: {{business_name}}
• Website: {{website_url}}
• Instagram: @{{instagram_handle}}

Your brand profile is being set up now. You'll receive your content upload link within the next 24 hours.

Questions? Just reply and our team will help.
```
*Tag contact: "Onboarded - Brand Profile"*  
*Trigger webhook*  

---

## Field Mapping to SocialDrive

### Direct Field Mapping

| DM Champ Field | SocialDrive Field | Notes |
|----------------|-------------------|-------|
| `business_name` | `brand_name` | Primary brand name |
| `website_url` | `website` | URL or null |
| `instagram_handle` | `instagram_handle` + platforms[] | Adds "instagram" to platforms |
| `facebook_handle` | `facebook_handle` + platforms[] | Adds "facebook" to platforms |
| `linkedin_handle` | `linkedin_handle` + platforms[] | Adds "linkedin" to platforms |
| `target_audience` | `target_audience` | Text preserved |
| `brand_tone` | `tone` + `personality` | Maps to both fields |
| `usps` | `usps[]` | Split by comma; array |
| `competitors` | `competitor_brands[]` | Split by comma; array |
| `words_to_use` | `key_messages[]` | Split by comma; array |
| `words_to_avoid` | `avoid_words[]` | Split by comma; array |
| `content_preferences` | `products_services[]` + context | Split by comma; array |
| `location` | `location` | City/region |
| `industry` | `industry` | Sector/niche |

### Validation Rules (SocialDrive Webhook)

```typescript
// Field validation rules
const VALIDATION = {
  business_name: { 
    required: true, 
    minLength: 2,
    maxLength: 100 
  },
  target_audience: { 
    required: true,
    rejectIf: ['everyone', 'anyone', 'all people'] // Too vague
  },
  brand_tone: { 
    required: true,
    allowed: ['Professional', 'Friendly', 'Bold', 'Luxurious', 'Fun', 'Other']
  },
  usps: { 
    required: true,
    minItems: 1,
    maxItems: 10
  },
  content_preferences: {
    required: true,
    minItems: 1
  }
}
```

### Array Fields (Comma-Separated)

These DM Champ fields are split into arrays:

```typescript
// List fields - split on comma or semicolon
const ARRAY_FIELDS = [
  'usps',
  'competitors', 
  'words_to_use',
  'words_to_avoid',
  'content_preferences',
  'hashtags'
]

// Splitting logic
const parseList = (value: string): string[] => {
  if (!value) return []
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 1) // Remove single chars
}
```

---

## Data Access Patterns

### Query Onboarding Data

```typescript
// Get all conversations for a client
const { data } = await supabase
  .from('onboarding_conversations')
  .select('*')
  .eq('client_id', 'client-uuid')
  .single()

// Raw conversation contents:
// data.conversation_json = {
//   event: "flow.completed",
//   contact: { phone, first_name, custom_fields: {...} }
// }

// Extracted fields:
// data.extracted_data = { brand_name, usps: [...], ... }
```

### Query by Phone Number

```typescript
// Find client by phone from onboarding
const { data } = await supabase
  .from('onboarding_conversations')
  .select('client_id, phone, extracted_data')
  .eq('phone', '353871234567')
  .single()
```

### Audit Trail

```typescript
// Check onboarding status
const { data: logs } = await supabase
  .from('onboarding_logs')
  .select('*')
  .eq('client_id', 'client-uuid')
  .order('processed_at', { ascending: false })
  
// Gives you complete history:
// - when webhook received
// - status: success/pending/failed
// - raw payload
// - processing timestamp
```

---

## Required vs Optional Summary

### Absolute Required (Client blocked without these)

| Field | Why Required |
|-------|--------------|
| `business_name` | Can't create content without naming the business |
| `target_audience` | Required for content targeting and tone |
| `brand_tone` | AI needs to know voice/personality |
| `usps` | Key differentiators for unique content |
| `content_preferences` | Determined content strategy/types |

### Optional But Good to Have

| Field | Why Optional |
|-------|--------------|
| Website | Some clients don't have one |
| Social handles | Not everyone is on all platforms |
| Competitors | Some clients don't know them |
| Location | Digital-only businesses |
| Industry | Can be inferred from description |

---

## Handling Incomplete Onboarding

### Validation Failures

```typescript
// If required field missing
if (!customFields.business_name) {
  // 1. Log as incomplete
  await supabase.from('onboarding_logs').insert({
    status: 'incomplete',
    error_message: 'Missing required field: business_name'
  })
  
  // 2. Optionally notify VA to follow up
  // 3. Can still create client record but flag it
}
```

### Re-engagement Strategy

**24-hour reminder** (DM Champ auto-flow):
```
Hey {{first_name}}! You started your brand setup but didn't finish a few questions.

Can you quickly tell me:
[Missing questions listed]

This helps us create much better content for you!
```

---

## Testing the Question Flow

### DM Champ Test Contact

1. Add yourself as a test contact
2. Trigger onboarding flow
3. Answer all questions
4. Verify webhook receives payload
5. Check SocialDrive client created

### SocialDrive Verification

```bash
# Check webhook processing
curl https://socialdrive-ai.vercel.app/api/webhooks/dmchamp/onboarding \
  -X GET

# Returns: { status: "ok", version: "1.0.0", ... }
```

---

## Next Steps

1. **Configure DM Champ chat flow** with the 12 messages above
2. **Set up custom fields** in DM Champ for each question
3. **Add webhook URL** pointing to SocialDrive
4. **Test with sample contact**
5. **Deploy database migration** (already created)
6. **Launch for real clients**
