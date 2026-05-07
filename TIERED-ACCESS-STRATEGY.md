# SocialDrive AI - Tiered Access Strategy

**Date:** 2026-05-06  
**Status:** Planning

---

## The Problem

**Current:** All clients see the same complex upload page with:
- Format selection (Images/Carousel/Video)
- Platform selection (Instagram/TikTok/LinkedIn/Facebook)
- Format summaries (Portrait/Vertical/Square)
- Advanced options

**Reality:** 
- Family butcher just wants to upload 3 photos and get posts
- Marketing agency wants full control over every detail
- Most clients are somewhere in between

**Solution:** 3 tiers with progressive complexity

---

## Three Tiers

### Tier 1: **Simple** (Done-For-You)

**Target:** Small businesses, busy professionals, non-tech users

**Examples:**
- Family butcher shop
- Local restaurant
- Hair salon
- Trade services (plumber, electrician)

**What They See:**
```
📸 Upload Your Photos

[Drag & Drop Area]

What's happening this week?
[Text box for brief]

[Submit]

That's it! We'll handle the rest.
```

**Features:**
- ✅ Upload images only (3-5)
- ✅ Simple brief text box
- ✅ Auto-generate everything
- ✅ We choose best format (Instagram square/portrait)
- ✅ We choose platforms (based on their profile)
- ✅ No complex options
- ✅ WhatsApp notification when ready

**What's Hidden:**
- ❌ No format selection
- ❌ No platform selection
- ❌ No advanced options
- ❌ No technical details

**Pricing:** €29/month (Standard)

---

### Tier 2: **Pro** (Guided Control)

**Target:** Growing businesses, social media managers, content creators

**Examples:**
- Boutique retail shop
- Fitness studio
- Real estate agent
- Professional services

**What They See:**
```
📸 Upload Your Content

Step 1: Choose Format
[Images] [Carousel] [Video]

Step 2: Where Will You Post?
☑ Instagram (Feed + Stories)
☐ TikTok
☐ Facebook

Step 3: Upload Images
[Drag & Drop]

Step 4: Your Brief
[Text box]

[Submit]
```

**Features:**
- ✅ Format selection (Images/Carousel/Video)
- ✅ Platform selection (simplified)
- ✅ Smart recommendations
- ✅ Format preview
- ✅ Multiple caption options
- ✅ Hashtag suggestions
- ✅ Best posting times

**What's Hidden:**
- ❌ No technical specs (sizes, ratios)
- ❌ No manual format selection
- ❌ No advanced export options
- ❌ No API access

**Pricing:** €79/month (Premium)

---

### Tier 3: **Agency** (Full Control)

**Target:** Marketing agencies, multi-location businesses, power users

**Examples:**
- Marketing agency managing 10+ clients
- Restaurant chain with 5 locations
- E-commerce brand
- Franchise businesses

**What They See:**
```
📸 Advanced Upload

Format: [Dropdown: Images/Carousel/Video/Story/Reels]

Platforms: [Multi-select with advanced options]
☑ Instagram
  ☐ Feed (Portrait 4:5)
  ☐ Stories (Vertical 9:16)
  ☐ Reels (Vertical 9:16)
☑ TikTok
  ☐ Feed (Vertical 9:16)
☑ LinkedIn
  ☐ Feed (Square 1:1)
  ☐ Articles (Landscape 16:9)
☑ Facebook
☑ YouTube Shorts
☑ Pinterest

Images: [Upload with reordering]
[Image 1] [Image 2] [Image 3] ...

Advanced Options:
- Caption length: [Short/Medium/Long]
- Tone: [Professional/Casual/Witty]
- Hashtag count: [5/10/15/20]
- Emoji style: [None/Minimal/Moderate/Max]
- CTA: [Link in Bio/DM Us/Shop Now/Book Now]

Export:
☐ CSV for Sociamonials
☐ CSV for Later
☐ CSV for Buffer
☐ Direct publish (API)

[Generate]
```

**Features:**
- ✅ All formats (Images/Carousel/Video/Story/Reels)
- ✅ All platforms with granular control
- ✅ Manual format selection per platform
- ✅ Advanced caption customization
- ✅ Multiple export formats
- ✅ Direct API publishing
- ✅ White-label options
- ✅ Bulk upload (multiple clients)
- ✅ Analytics dashboard
- ✅ Team collaboration
- ✅ Approval workflows

**Pricing:** €149/month (Agency)

---

## Implementation

### Database Schema

```sql
-- Add tier column to clients
ALTER TABLE clients 
ADD COLUMN tier TEXT DEFAULT 'simple'
CHECK (tier IN ('simple', 'pro', 'agency'));

-- Add feature flags
ALTER TABLE clients
ADD COLUMN features JSONB DEFAULT '{}';

-- Example features object:
{
  "format_selection": false,      // Simple
  "platform_selection": false,    // Simple
  "advanced_customization": false, // Simple
  "bulk_upload": false,           // Pro
  "api_access": false,            // Pro
  "white_label": false,           // Agency
  "analytics": false,             // Agency
  "team_seats": 1                 // Simple (1), Pro (3), Agency (10)
}
```

---

### Upload Page Logic

```typescript
// Load client tier
const client = await getClientByToken(token)
const tier = client.tier || 'simple'

// Render based on tier
if (tier === 'simple') {
  // Show minimal upload form
  return <SimpleUpload />
} else if (tier === 'pro') {
  // Show guided upload with options
  return <ProUpload />
} else if (tier === 'agency') {
  // Show full advanced upload
  return <AgencyUpload />
}
```

---

### Simple Upload Component

```tsx
// Minimal, friendly, no complexity
export default function SimpleUpload() {
  return (
    <div>
      <h1>Upload Your Photos</h1>
      <p>Just drop your photos here and tell us what's happening this week.</p>
      
      <DropZone />
      <TextArea placeholder="E.g., 'Sale on all services this week' or 'New summer menu launched'" />
      
      <Button>Submit</Button>
      
      <p className="text-sm text-gray-500">
        We'll create engaging posts for your social media. 
        You'll get a WhatsApp message when they're ready!
      </p>
    </div>
  )
}
```

---

### Pro Upload Component

```tsx
// Guided, step-by-step, smart defaults
export default function ProUpload() {
  return (
    <div>
      <Stepper steps={['Format', 'Platforms', 'Upload', 'Brief']} />
      
      <Step1>
        <FormatSelector 
          options={['images', 'carousel', 'video']}
          recommended="carousel"
        />
      </Step1>
      
      <Step2>
        <PlatformSelector 
          platforms={['instagram', 'tiktok', 'facebook']}
          preselected={['instagram']}
          showRecommendations={true}
        />
      </Step2>
      
      <Step3>
        <DropZone maxImages={10} />
      </Step3>
      
      <Step4>
        <TextArea withSuggestions={true} />
      </Step4>
      
      <Button>Generate Posts</Button>
    </div>
  )
}
```

---

### Agency Upload Component

```tsx
// Full control, all options, power user features
export default function AgencyUpload() {
  return (
    <div>
      <Tabs tabs={['Upload', 'Bulk Upload', 'Templates', 'Analytics']} />
      
      <AdvancedForm>
        <FormatSelector advanced={true} />
        <PlatformSelector advanced={true} granular={true} />
        <ImageUploader reorderable={true} maxImages={50} />
        <CaptionCustomizer 
          length={['short', 'medium', 'long']}
          tone={['professional', 'casual', 'witty', 'urgent']}
          hashtags={[5, 10, 15, 20, 30]}
          emojis={['none', 'minimal', 'moderate', 'max']}
        />
        <ExportOptions 
          formats={['csv-sociamonials', 'csv-later', 'csv-buffer', 'api-direct']}
          whiteLabel={true}
        />
      </AdvancedForm>
      
      <Button>Generate</Button>
    </div>
  )
}
```

---

## Migration Path

### Current Clients

**Default all existing clients to "Simple" tier**
- They already work fine with minimal options
- Can upgrade to Pro/Agency if they want more features
- No disruption to current workflow

### New Clients

**Onboarding flow:**
```
Welcome to SocialDrive AI!

Which best describes you?

○ I just want to upload photos and get posts (Simple - €29/mo)
○ I want some control over formats and platforms (Pro - €79/mo)
○ I'm an agency managing multiple clients (Agency - €149/mo)

[Continue]
```

---

## Feature Matrix

| Feature | Simple | Pro | Agency |
|---------|--------|-----|--------|
| **Upload Images** | ✅ | ✅ | ✅ |
| **AI Captions** | ✅ | ✅ | ✅ |
| **Hashtags** | ✅ | ✅ | ✅ |
| **Format Selection** | ❌ (Auto) | ✅ | ✅ |
| **Platform Selection** | ❌ (Auto) | ✅ | ✅ |
| **Carousel/Video** | ❌ | ✅ | ✅ |
| **Caption Customization** | ❌ | ️ (Basic) | ✅ (Full) |
| **Export Formats** | 1 (CSV) | 2 (CSV) | 4+ (CSV + API) |
| **Bulk Upload** | ❌ |  | ✅ |
| **White Label** | ❌ | ❌ | ✅ |
| **Analytics** | ❌ | ❌ | ✅ |
| **Team Seats** | 1 | 3 | 10 |
| **API Access** | ❌ | ️ (Read) | ✅ (Full) |
| **Priority Support** | ❌ | ✅ | ✅ |
| **Dedicated Manager** | ❌ | ❌ | ✅ |

---

## Pricing Strategy

### Simple (€29/month)
- **Target:** Solopreneurs, small businesses
- **Value:** "Set it and forget it"
- **Margin:** 99% (fully automated)
- **Goal:** Volume play, entry-level

### Pro (€79/month) - **SWEET SPOT**
- **Target:** Growing businesses, serious about social
- **Value:** "Perfect posts, your way"
- **Margin:** 98% (still automated)
- **Goal:** Main revenue driver

### Agency (€149/month)
- **Target:** Agencies, multi-location, power users
- **Value:** "Everything you need to scale"
- **Margin:** 95% (some support cost)
- **Goal:** High-value, low-churn

---

## Upgrade Paths

### Simple → Pro
**Triggers:**
- Client asks "Can I choose the format?"
- Client wants to post to TikTok
- Client uploads more than 5 images regularly
- Client asks for carousel/video

**Upgrade prompt:**
```
Want more control?

Upgrade to Pro (€79/mo) to:
- Choose formats (Carousel, Video)
- Select platforms (TikTok, LinkedIn)
- Get multiple caption options
- See posting recommendations

[Upgrade Now]
```

### Pro → Agency
**Triggers:**
- Client manages multiple accounts
- Client asks for bulk upload
- Client wants white-label reports
- Client needs team access

**Upgrade prompt:**
```
Managing multiple clients?

Upgrade to Agency (€149/mo) to:
- Upload for multiple clients at once
- White-label reports (your branding)
- Direct API publishing
- Analytics dashboard
- 10 team seats

[Upgrade Now]
```

---

## Benefits

### For Clients

**Simple:**
- Zero complexity
- Fast (2 minutes to upload)
- Professional results
- No learning curve

**Pro:**
- Right amount of control
- Not overwhelming
- Smart recommendations
- Feels premium

**Agency:**
- Full control
- Scalable workflow
- Professional features
- ROI tracking

### For Us (Business)

**Simplicity:**
- Lower support costs (Simple tier)
- Fewer "how do I?" questions
- Faster onboarding
- Better retention

**Tiered Pricing:**
- Capture different market segments
- Natural upgrade path
- Higher ARPU (average revenue per user)
- Justifies price increases

**Product:**
- Cleaner UX (no one-size-fits-all compromise)
- Easier to market (right message to right segment)
- Better positioning (not "cheap AI tool")

---

## Implementation Priority

### Phase 1: Simple Tier (This Week)
- [ ] Create SimpleUpload component
- [ ] Add tier field to database
- [ ] Route clients based on tier
- [ ] Default existing clients to Simple
- [ ] Test with butcher shop example

### Phase 2: Pro Tier (Next Week)
- [ ] Create ProUpload component
- [ ] Add format/platform selection
- [ ] Smart recommendations
- [ ] Upgrade flow
- [ ] Test with Pro clients

### Phase 3: Agency Tier (Week 3)
- [ ] Create AgencyUpload component
- [ ] Advanced features
- [ ] Bulk upload
- [ ] White-label options
- [ ] Analytics dashboard

### Phase 4: Optimization (Week 4)
- [ ] A/B test upgrade prompts
- [ ] Analyze tier distribution
- [ ] Optimize conversion rates
- [ ] Refine features per tier

---

## What Do You Think?

**Does this match your vision?**

The key insight: **The butcher shop doesn't want to think about "Portrait 4:5 vs Vertical 9:16"** - they just want to upload photos of their sausages and get posts that work.

**Simple tier** = Done-for-you, zero complexity
**Pro tier** = Guided control, smart defaults
**Agency tier** = Full power, no limits

**Should I start implementing the Simple tier now?**
