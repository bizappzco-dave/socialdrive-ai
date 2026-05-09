# SocialDrive AI - Per-Client Feature Toggles

## Problem
- Currently using rigid "tiers" (simple/pro/enterprise)
- Every client is different - needs custom feature mix
- Constantly having to update settings manually

## Solution
**Feature checkboxes in client profile** - toggle exactly what each client gets.

---

## Feature Categories

### 🎨 Content Generation
- [ ] **Auto Captions** - AI generates captions for images
- [ ] **Platform Optimization** - Different captions per platform (IG/TT/LI)
- [ ] **Hashtag Generation** - Auto-generate relevant hashtags
- [ ] **Multi-Format Posts** - Square, Story, Reel formats
- [ ] **Video/Carousel Creation** - Auto-generate videos/carousels from images
- [ ] **Caption Variants** - Generate 3 caption options to choose from

### 🤖 AI Model Selection
- [ ] **Premium AI (Claude)** - Better quality, more expensive
- [ ] **Standard AI (Ollama)** - Good quality, free tier
- [ ] **Extended Context** - Use full brand profile in every caption

### 📊 Analytics & Reports
- [ ] **Performance Tracking** - Track post engagement
- [ ] **Monthly Reports** - Auto-generated content reports
- [ ] **Competitor Analysis** - Track competitor content
- [ ] **Content Calendar View** - Visual calendar of scheduled posts

### 🔄 Automation
- [ ] **Auto-Process Uploads** - Process images immediately on upload
- [ ] **Scheduled Publishing** - Direct publish to social platforms
- [ ] **Bulk Upload** - Upload 50+ images at once
- [ ] **Email Notifications** - Notify when content is ready

### 📁 Storage & Access
- [ ] **Extended Storage** - More than 1GB
- [ ] **Priority Processing** - Jump the queue
- [ ] **Team Access** - Multiple users per client
- [ ] **Brand Asset Library** - Store logos, templates, brand colors

### 🎯 Advanced Features
- [ ] **Custom Templates** - Brand-specific post templates
- [ ] **White Label** - Remove SocialDrive branding
- [ ] **API Access** - Integrate with client's systems
- [ ] **Priority Support** - Faster response times

---

## Database Schema

### Update `clients` table:
```sql
-- Add JSON column for flexible features
ALTER TABLE clients
ADD COLUMN features_enabled jsonb DEFAULT '{}'::jsonb;

-- Example data structure:
{
  "auto_captions": true,
  "platform_optimization": true,
  "hashtags": false,
  "multi_format": true,
  "video_generation": true,
  "premium_ai": false,
  "extended_context": true,
  "bulk_upload": true,
  "email_notifications": true,
  "extended_storage": false,
  "priority_processing": false,
  "team_access": false,
  "custom_templates": false,
  "white_label": false,
  "api_access": false,
  "priority_support": false
}
```

---

## UI Implementation

### Client Profile Page
```
┌─────────────────────────────────────────┐
│ LED Lights Dublin - Client Profile      │
├─────────────────────────────────────────┤
│                                          │
│ 🎨 Content Generation                   │
│ ☑ Auto Captions                         │
│ ☑ Platform Optimization                 │
│ ☐ Hashtag Generation                    │
│ ☑ Multi-Format Posts                    │
│ ☑ Video/Carousel Creation               │
│ ☐ Caption Variants (3 options)          │
│                                          │
│ 🤖 AI Model                              │
│ ○ Premium AI (Claude) - $0.34/post     │
│ ● Standard AI (Ollama) - Free          │
│ ☑ Extended Context                      │
│                                          │
│ 🔄 Automation                            │
│ ☑ Auto-Process Uploads                  │
│ ☐ Scheduled Publishing                  │
│ ☑ Bulk Upload (50+ images)              │
│ ☑ Email Notifications                   │
│                                          │
│ 📁 Storage & Access                     │
│ ☐ Extended Storage (10GB)               │
│ ☐ Priority Processing                   │
│ ☐ Team Access (multiple users)          │
│ ☐ Brand Asset Library                   │
│                                          │
│ 🎯 Advanced                              │
│ ☐ Custom Templates                      │
│ ☐ White Label                            │
│ ☐ API Access                             │
│ ☐ Priority Support                       │
│                                          │
│ [Save Features]                          │
└─────────────────────────────────────────┘
```

---

## Pricing Logic (Optional)

### Feature-Based Pricing
- **Base:** €20/month (includes auto captions, standard AI)
- **+ Premium AI:** +€15/month
- **+ Video Generation:** +€10/month
- **+ Scheduled Publishing:** +€10/month
- **+ Team Access:** +€5/user/month
- **+ White Label:** +€30/month

**OR**

### À La Carte
- Let clients pick exactly what they need
- Charge per feature enabled
- Flexible monthly billing

---

## Implementation Plan

### Phase 1: Database & Backend
1. Add `features_enabled` JSON column to `clients` table
2. Create feature checking functions
3. Update caption generation to respect feature flags

### Phase 2: UI
1. Add feature toggle section to client profile page
2. Checkboxes + descriptions for each feature
3. Save button to update features

### Phase 3: Feature Enforcement
1. Check features before processing
2. Show "Upgrade" prompts for disabled features
3. Admin dashboard to see feature usage stats

### Phase 4: Billing (Future)
1. Auto-calculate monthly price based on features
2. Stripe integration for feature-based billing
3. Usage tracking for metered features

---

## Example Use Cases

### Budget Client (Kitchens Direct)
- Auto Captions ✅
- Standard AI ✅
- Single Format ✅
- Manual Upload ✅
- **Cost:** €20/month base

### Premium Client (LED Lights Dublin)
- Auto Captions ✅
- Platform Optimization ✅
- Premium AI (Claude) ✅
- Video Generation ✅
- Bulk Upload ✅
- Email Notifications ✅
- **Cost:** €55/month

### Agency Client (Future)
- Everything ✅
- Team Access ✅
- White Label ✅
- API Access ✅
- Priority Support ✅
- **Cost:** €150/month

---

## Benefits

✅ **Flexibility** - Each client gets exactly what they need  
✅ **Upsell Path** - Easy to add features later  
✅ **Clear Value** - Clients see what they're paying for  
✅ **Simple Management** - Toggle features without code changes  
✅ **Scalable** - Add new features without schema changes  

---

## Next Steps

1. ✅ Design feature list (this doc)
2. Update database schema
3. Build feature toggle UI
4. Implement feature checks in processing code
5. Test with real clients
6. Launch! 🚀
