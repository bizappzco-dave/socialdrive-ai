# DM Champ Onboarding Setup Guide

**Automate client onboarding with WhatsApp chat**

---

## 🎯 The Workflow

```
1. VA adds client to DM Champ
   ↓
2. Automated onboarding chat starts
   ↓
3. Client answers 10 questions (conversational)
   ↓
4. VA copies responses from DM Champ
   ↓
5. VA pastes into SocialDrive AI Brand Profile
   ↓
6. Upload link sent
   ↓
7. AI generates content with full brand context
```

---

## 📋 Step 1: Set Up DM Champ Onboarding Chat

### **Create the Chat Flow:**

In DM Champ, create an automated sequence called **"Client Onboarding"**

**Trigger:** When contact is added to "New Clients" list

**Messages:**

```
Message 1 (Immediate):
👋 Hi {{first_name}}! Welcome to SocialDrive AI!

I'm going to ask you a few quick questions so we can 
create content that perfectly matches your brand.

Ready? Let's start!
```

```
Message 2 (Wait for reply, then send):
1️⃣ What's your business name?
(e.g., "No Label Barber")
```

```
Message 3:
2️⃣ What's your website URL?
(If you don't have one, just say "none")
```

```
Message 4:
3️⃣ Which social media are you active on?

- Instagram: {{instagram}}
- Facebook: {{facebook}}
- LinkedIn: {{linkedin}}

(Skip any you don't use)
```

```
Message 5:
4️⃣ Who's your ideal customer?
(e.g., "Men 25-45, professionals, care about grooming")
```

```
Message 6:
5️⃣ How would you describe your brand tone?

Pick one or describe your own:
• Professional & polished
• Friendly & approachable
• Bold & edgy
• Luxurious & exclusive
• Fun & playful
```

```
Message 7:
6️⃣ What makes you different from competitors?
(Your unique selling points)
```

```
Message 8:
7️⃣ Who are your main competitors?
(Name 2-3 businesses you compete with)
```

```
Message 9:
8️⃣ Any words or phrases you ALWAYS want included?
(e.g., "Dublin", "master craftsmanship", "book now")
```

```
Message 10:
9️⃣ Any words to AVOID?
(e.g., "cheap", "discount", competitor names)
```

```
Message 11:
🔟 What type of content works best for you?

• Before/after photos
• Team spotlights
• Promotions/offers
• Educational tips
• Behind the scenes
• Customer testimonials
```

```
Message 12 (Final):
✨ Awesome! That's everything we need.

Our team will review your answers and set up your 
personal content portal. You'll get an upload link 
within 24 hours.

Any questions before we wrap up?
```

---

## 📊 Step 2: Map Responses to Custom Fields

In DM Champ, create custom fields for each answer:

| Field Name | Type | Maps To |
|------------|------|---------|
| `business_name` | Text | Client name |
| `website_url` | Text | Website URL |
| `instagram_handle` | Text | Instagram |
| `facebook_handle` | Text | Facebook |
| `linkedin_handle` | Text | LinkedIn |
| `target_audience` | Text | Target audience |
| `brand_tone` | Text | Brand tone |
| `usps` | Text | Unique selling points |
| `competitors` | Text | Competitors |
| `words_to_use` | Text | Words to use |
| `words_to_avoid` | Text | Words to avoid |
| `content_preferences` | Text | Content types |

**Set up auto-tagging:**
- Tag contacts who complete onboarding as "Onboarded - Brand Profile"
- Tag contacts who start but don't finish as "Onboarding Incomplete"

---

## 🔄 Step 3: VA Workflow (Manual for Now)

### **When Client Completes Onboarding:**

1. **VA opens DM Champ dashboard**
   - Go to contacts tagged "Onboarded - Brand Profile"
   - Open client profile
   - View all custom fields

2. **VA goes to SocialDrive AI**
   - Navigate to `/agency/clients`
   - Find the client (or create if not exists)
   - Click "Brand Profile"

3. **VA copies data from DM Champ → SocialDrive AI**
   - Copy each field
   - Paste into corresponding field
   - Click "Save Brand Profile"

4. **VA sends upload link**
   - Click "Copy WhatsApp"
   - Send to client

**Time per client:** ~5 minutes

---

## 🔌 Step 4: API Integration (Future - Optional)

**Automate the data transfer:**

### **DM Champ Webhook → SocialDrive AI API**

**Webhook URL:** `https://your-socialdrive.ai/api/dmchamp/webhook`

**Payload:**
```json
{
  "contact_id": "dmchamp_123",
  "phone": "+353871234567",
  "custom_fields": {
    "business_name": "No Label Barber",
    "website_url": "https://nolabel.ie",
    "instagram_handle": "nolabelbarber",
    "target_audience": "Men 25-45...",
    "brand_tone": "Professional & polished",
    "usps": "Master barbers...",
    "competitors": "Blade & Barrel...",
    "words_to_use": "Dublin, craftsmanship",
    "words_to_avoid": "Cheap, discount",
    "content_preferences": ["Before/after", "Team spotlights"]
  }
}
```

**API Endpoint Logic:**
1. Find client by phone number
2. Update brand profile fields
3. Mark as `dmchamp_onboarded: true`
4. Generate upload link automatically
5. Send back to DM Champ (optional auto-reply)

**Benefit:** Zero manual work, fully automated

---

## 📱 Example Client Experience

**Client receives:**
```
👋 Hi David! Welcome to SocialDrive AI!

I'm going to ask you a few quick questions so we can 
create content that perfectly matches your brand.

Ready? Let's start!
```

**Client replies:** "Ready!"

```
1️⃣ What's your business name?
```

**Client:** "No Label Barber"

```
2️⃣ What's your website URL?
```

**Client:** "https://nolabel.ie"

... (continues through all 10 questions) ...

```
✨ Awesome! That's everything we need.

Our team will review your answers and set up your 
personal content portal. You'll get an upload link 
within 24 hours.
```

**Client feels:** Cared for, premium service, no friction

---

## 🎯 Best Practices

### **Chat Flow Design:**

✅ **One question at a time** - Don't overwhelm  
✅ **Conversational tone** - Feels like chatting, not a form  
✅ **Examples provided** - Shows what kind of answer you want  
✅ **Skip option** - "If you don't have one, just say 'none'"  
✅ **Progress indicators** - "Question 3 of 10"

### **Follow-Up:**

✅ **Incomplete onboarding** - Send reminder after 24h  
✅ **Complete onboarding** - Send upload link within 24h  
✅ **Questions?** - VA available to clarify via WhatsApp

---

## 📊 Tracking & Metrics

**In DM Champ Dashboard:**

| Metric | Target |
|--------|--------|
| Onboarding start rate | 100% (all new clients) |
| Onboarding completion rate | 80%+ |
| Average completion time | <10 minutes |
| Time to upload link | <24 hours |

**In SocialDrive AI:**

| Metric | Target |
|--------|--------|
| Brand profiles completed | 100% of onboarded clients |
| Data accuracy | VA spot-checks 10% |
| Time to paste data | <5 minutes per client |

---

## 🆘 Troubleshooting

**Client stops mid-onboarding:**
- DM Champ auto-sends: "Hey! Noticed you didn't finish. Want to complete the last few questions?"
- If no reply after 24h: VA sends personal message

**Client gives vague answers:**
- VA follows up: "Thanks! Could you tell me a bit more about [specific question]?"
- Better data = better AI output

**Client asks questions:**
- DM Champ can't answer: VA notified, responds personally
- Common questions: Add to chat flow as conditional branches

---

## ✅ Setup Checklist

- [ ] Create DM Champ account
- [ ] Set up "New Clients" contact list
- [ ] Build onboarding chat flow (12 messages)
- [ ] Create custom fields (12 fields)
- [ ] Set up auto-tagging
- [ ] Test with dummy contact
- [ ] Train VA on copy/paste workflow
- [ ] Create first real client onboarding
- [ ] (Optional) Build API webhook integration

---

## 💡 Pro Tips

1. **Personalize the intro** - Use client's first name
2. **Add emojis** - Makes it feel friendly, not robotic
3. **Keep it conversational** - "How would you describe..." not "Enter your..."
4. **Offer help** - "Any questions?" at the end
5. **Set expectations** - "You'll get your link within 24 hours"

---

## 🔄 Webhook Integration (API)

DM Champ supports full webhook functionality for automated data sync.

### Supported Webhooks

**Outbound (DM Champ → External):**
- `contact.created` - New contact added
- `contact.updated` - Contact details changed
- `contact.tagged` - Tag applied to contact
- `message.received` - Incoming WhatsApp message
- `message.sent` - Outbound message delivered
- `flow.completed` - Chat flow finished

**Inbound (External → DM Champ):**
- Send message to contact
- Update contact custom fields
- Add/remove tags
- Trigger chat flow

### SocialDrive Integration Enpoints

**SocialDrive → DM Champ:**
```
POST https://dmchamp-api.com/v1/contacts
{
  "phone": "+353871234567",
  "first_name": "David",
  "custom_fields": {
    "client_id": "uuid-from-socialdrive",
    "upload_url": "https://socialdrive-ai.vercel.app/upload/abc123",
    "content_ready": true
  },
  "tags": ["SocialDrive Client"]
}
```

**DM Champ → SocialDrive (Webhook):**
```
POST https://socialdrive-ai.vercel.app/api/webhooks/dmchamp
{
  "event": "flow.completed",
  "contact": {
    "phone": "+353871234567",
    "custom_fields": {
      "business_name": "No Label Barber"
    }
  }
}
```

### Use Cases

1. **Auto-create contact in DM Champ** when a client signs up in SocialDrive
2. **Auto-update brand profile** in SocialDrive when onboarding completes in DM Champ
3. **Send WhatsApp notification** from DM Champ when content is ready in SocialDrive
4. **Sync tags** across both platforms (e.g., "Premium Client", "Onboarded")

### Setup

1. In DM Champ: Settings → Integrations → Webhooks
2. Add SocialDrive webhook URL
3. Select events to listen for
4. Test with sample payload
5. Verify data flows correctly

---

**This is your secret weapon for premium positioning.** 🎯

Clients think you're doing deep brand discovery. In reality, it's automated and takes 10 minutes.

**Set this up, and you're ready to scale!** 🚀
