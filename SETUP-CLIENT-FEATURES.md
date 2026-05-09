# Setup Instructions: Client Features System

## Step 1: Add Database Column

**Go to Supabase Dashboard:**
1. Open: https://supabase.com/dashboard/project/dqhnxzaktnejasqlfrjf
2. Go to **Table Editor** → **clients** table
3. Click **+ Add Column**

**Column Settings:**
```
Name: features_enabled
Type: jsonb
Default value: {}
Nullable: No (uncheck)
```

Click **Save**

---

## Step 2: Initialize Existing Clients

Run this after adding the column:

```python
cd /home/dpmcg/.openclaw/workspace/socialdrive-ai
source load-env.sh
python3 << 'EOF'
from supabase import create_client
import os

s = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

# Default features for all clients
default_features = {
    "auto_captions": True,
    "platform_optimization": False,
    "hashtags": False,
    "multi_format": True,
    "video_generation": True,
    "caption_variants": False,
    "premium_ai": False,
    "extended_context": True,
    "bulk_upload": True,
    "email_notifications": True,
    "extended_storage": False,
    "priority_processing": False,
    "team_access": False,
    "custom_templates": False,
    "white_label": False,
    "api_access": False,
    "priority_support": False
}

# Update all clients
clients = s.from_('clients').select('id, name').execute().data
print(f"Updating {len(clients)} clients with default features...\n")

for client in clients:
    s.from_('clients').update({
        'features_enabled': default_features
    }).eq('id', client['id']).execute()
    print(f"✅ {client['name']}")

print(f"\n✅ All clients updated!")
EOF
```

---

## Step 3: Create Feature Toggle UI Component

**File: `app/agency/clients/[id]/features/page.tsx`**

```tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ClientFeatures {
  auto_captions: boolean
  platform_optimization: boolean
  hashtags: boolean
  multi_format: boolean
  video_generation: boolean
  caption_variants: boolean
  premium_ai: boolean
  extended_context: boolean
  bulk_upload: boolean
  email_notifications: boolean
  extended_storage: boolean
  priority_processing: boolean
  team_access: boolean
  custom_templates: boolean
  white_label: boolean
  api_access: boolean
  priority_support: boolean
}

export default function ClientFeaturesPage({ params }: { params: { id: string } }) {
  const [features, setFeatures] = useState<ClientFeatures | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadFeatures()
  }, [])

  async function loadFeatures() {
    const { data } = await supabase
      .from('clients')
      .select('features_enabled')
      .eq('id', params.id)
      .single()

    if (data) {
      setFeatures(data.features_enabled as ClientFeatures)
    }
  }

  async function saveFeatures() {
    setSaving(true)
    await supabase
      .from('clients')
      .update({ features_enabled: features })
      .eq('id', params.id)

    setSaving(false)
    alert('Features updated!')
  }

  function toggleFeature(key: keyof ClientFeatures) {
    setFeatures(prev => prev ? { ...prev, [key]: !prev[key] } : null)
  }

  if (!features) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Client Features</h1>

      {/* Content Generation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🎨 Content Generation</h2>
        <div className="space-y-3">
          <FeatureToggle
            label="Auto Captions"
            description="AI generates captions for images"
            checked={features.auto_captions}
            onChange={() => toggleFeature('auto_captions')}
          />
          <FeatureToggle
            label="Platform Optimization"
            description="Different captions per platform (IG/TT/LI)"
            checked={features.platform_optimization}
            onChange={() => toggleFeature('platform_optimization')}
          />
          <FeatureToggle
            label="Hashtag Generation"
            description="Auto-generate relevant hashtags"
            checked={features.hashtags}
            onChange={() => toggleFeature('hashtags')}
          />
          <FeatureToggle
            label="Multi-Format Posts"
            description="Square, Story, Reel formats"
            checked={features.multi_format}
            onChange={() => toggleFeature('multi_format')}
          />
          <FeatureToggle
            label="Video/Carousel Creation"
            description="Auto-generate videos/carousels from images"
            checked={features.video_generation}
            onChange={() => toggleFeature('video_generation')}
          />
          <FeatureToggle
            label="Caption Variants"
            description="Generate 3 caption options to choose from"
            checked={features.caption_variants}
            onChange={() => toggleFeature('caption_variants')}
          />
        </div>
      </div>

      {/* AI Model */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🤖 AI Model</h2>
        <div className="space-y-3">
          <FeatureToggle
            label="Premium AI (Claude)"
            description="Better quality, ~$0.34/post"
            checked={features.premium_ai}
            onChange={() => toggleFeature('premium_ai')}
          />
          <FeatureToggle
            label="Extended Context"
            description="Use full brand profile in every caption"
            checked={features.extended_context}
            onChange={() => toggleFeature('extended_context')}
          />
        </div>
      </div>

      {/* Automation */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🔄 Automation</h2>
        <div className="space-y-3">
          <FeatureToggle
            label="Bulk Upload"
            description="Upload 50+ images at once"
            checked={features.bulk_upload}
            onChange={() => toggleFeature('bulk_upload')}
          />
          <FeatureToggle
            label="Email Notifications"
            description="Notify when content is ready"
            checked={features.email_notifications}
            onChange={() => toggleFeature('email_notifications')}
          />
        </div>
      </div>

      {/* Storage & Access */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">📁 Storage & Access</h2>
        <div className="space-y-3">
          <FeatureToggle
            label="Extended Storage"
            description="More than 1GB"
            checked={features.extended_storage}
            onChange={() => toggleFeature('extended_storage')}
          />
          <FeatureToggle
            label="Priority Processing"
            description="Jump the queue"
            checked={features.priority_processing}
            onChange={() => toggleFeature('priority_processing')}
          />
          <FeatureToggle
            label="Team Access"
            description="Multiple users per client"
            checked={features.team_access}
            onChange={() => toggleFeature('team_access')}
          />
        </div>
      </div>

      {/* Advanced */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">🎯 Advanced</h2>
        <div className="space-y-3">
          <FeatureToggle
            label="Custom Templates"
            description="Brand-specific post templates"
            checked={features.custom_templates}
            onChange={() => toggleFeature('custom_templates')}
          />
          <FeatureToggle
            label="White Label"
            description="Remove SocialDrive branding"
            checked={features.white_label}
            onChange={() => toggleFeature('white_label')}
          />
          <FeatureToggle
            label="API Access"
            description="Integrate with client's systems"
            checked={features.api_access}
            onChange={() => toggleFeature('api_access')}
          />
          <FeatureToggle
            label="Priority Support"
            description="Faster response times"
            checked={features.priority_support}
            onChange={() => toggleFeature('priority_support')}
          />
        </div>
      </div>

      <button
        onClick={saveFeatures}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Features'}
      </button>
    </div>
  )
}

function FeatureToggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-start p-4 border rounded-lg hover:bg-gray-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 text-blue-600"
      />
      <div className="ml-3">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-gray-600">{description}</div>
      </div>
    </div>
  )
}
```

---

## Step 4: Add Feature Checking Function

**File: `utils/features.ts`**

```typescript
import { createClient } from '@/utils/supabase/server'

export async function checkFeature(
  clientId: string,
  feature: string
): Promise<boolean> {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('clients')
    .select('features_enabled')
    .eq('id', clientId)
    .single()

  if (!data) return false
  return data.features_enabled[feature] === true
}

export async function getClientFeatures(clientId: string) {
  const supabase = createClient()
  
  const { data } = await supabase
    .from('clients')
    .select('features_enabled')
    .eq('id', clientId)
    .single()

  return data?.features_enabled || {}
}
```

---

## Step 5: Use Features in Caption Generation

**Update caption generation to check features:**

```typescript
import { checkFeature, getClientFeatures } from '@/utils/features'

async function generateCaptions(submissionId: string, clientId: string) {
  const features = await getClientFeatures(clientId)
  
  // Check if auto captions enabled
  if (!features.auto_captions) {
    console.log('Auto captions disabled for this client')
    return
  }
  
  // Choose AI model
  const model = features.premium_ai ? 'claude-sonnet-4' : 'ollama/qwen3.5'
  
  // Use extended context?
  const useFullProfile = features.extended_context
  
  // Generate platform-specific captions?
  const platforms = features.platform_optimization 
    ? ['instagram', 'tiktok', 'linkedin']
    : ['instagram']
  
  // Include hashtags?
  const includeHashtags = features.hashtags
  
  // Generate caption variants?
  const variantCount = features.caption_variants ? 3 : 1
  
  // ... rest of caption generation logic
}
```

---

## Testing

1. Add the column in Supabase
2. Run the init script to set default features
3. Open a client profile: `/agency/clients/[id]/features`
4. Toggle some features
5. Save
6. Verify in Supabase that `features_enabled` JSON updated
7. Test caption generation respects the flags

---

## Done! 🎉

Now you can customize each client's feature set through the UI without touching code.
