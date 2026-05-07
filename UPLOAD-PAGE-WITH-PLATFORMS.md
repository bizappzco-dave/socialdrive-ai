# Upload Page Update - Platform Selection

**Implementation Guide**

---

## What to Add

### 1. New State Variables

```typescript
// Platform selection
const [platforms, setPlatforms] = useState({
  instagram: false,
  tiktok: false,
  linkedin: false,
  facebook: false,
})

// Auto-load client's defaults from their profile
useEffect(() => {
  if (submission) {
    // Fetch client's platform preferences from database
    loadClientPlatforms()
  }
}, [submission])

async function loadClientPlatforms() {
  try {
    const response = await fetch(`/api/clients/${submission.client_id}/platforms`)
    const data = await response.json()
    
    if (data.platforms) {
      setPlatforms({
        instagram: data.platforms.includes('instagram'),
        tiktok: data.platforms.includes('tiktok'),
        linkedin: data.platforms.includes('linkedin'),
        facebook: data.platforms.includes('facebook'),
      })
    } else {
      // Default to Instagram if no preferences set
      setPlatforms({ instagram: true, tiktok: false, linkedin: false, facebook: false })
    }
  } catch (err) {
    console.error('Failed to load platform preferences:', err)
    // Default to Instagram
    setPlatforms({ instagram: true, tiktok: false, linkedin: false, facebook: false })
  }
}
```

### 2. Platform Selector UI

Add this section **after** the format selector (Images/Carousel/Video) and **before** the image upload:

```tsx
{/* Platform Selector */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
    <span className="text-xl">📱</span>
    Where Will You Post This?
  </h2>
  
  <p className="text-sm text-gray-600 mb-4">
    Select the platforms for this upload. We'll generate the perfect format for each.
  </p>
  
  {/* Quick Select Packs */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
    <button
      type="button"
      onClick={() => setPlatforms({ instagram: true, tiktok: false, linkedin: false, facebook: false })}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        platforms.instagram && !platforms.tiktok && !platforms.linkedin
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="font-medium text-gray-900">Instagram Only</p>
      <p className="text-xs text-gray-500 mt-1">Feed + Stories</p>
    </button>
    
    <button
      type="button"
      onClick={() => setPlatforms({ instagram: true, tiktok: true, linkedin: false, facebook: false })}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        platforms.instagram && platforms.tiktok && !platforms.linkedin
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="font-medium text-gray-900">Social Pack</p>
      <p className="text-xs text-gray-500 mt-1">IG + TikTok</p>
    </button>
    
    <button
      type="button"
      onClick={() => setPlatforms({ instagram: false, tiktok: false, linkedin: true, facebook: false })}
      className={`p-3 rounded-lg border-2 text-left transition-all ${
        platforms.linkedin && !platforms.instagram && !platforms.tiktok
          ? 'border-blue-600 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <p className="font-medium text-gray-900">Professional</p>
      <p className="text-xs text-gray-500 mt-1">LinkedIn + Twitter</p>
    </button>
  </div>
  
  {/* Individual Platforms */}
  <div className="space-y-3">
    {/* Instagram */}
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
      <input
        type="checkbox"
        checked={platforms.instagram}
        onChange={(e) => setPlatforms({ ...platforms, instagram: e.target.checked })}
        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Instagram</span>
          <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">Most Popular</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Feed (Portrait 4:5) + Stories/Reels (Vertical 9:16)
        </p>
      </div>
    </label>
    
    {/* TikTok */}
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
      <input
        type="checkbox"
        checked={platforms.tiktok}
        onChange={(e) => setPlatforms({ ...platforms, tiktok: e.target.checked })}
        className="mt-1 w-4 h-4 text-black rounded focus:ring-black"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">TikTok</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Vertical video (9:16) - Full screen
        </p>
      </div>
    </label>
    
    {/* Facebook */}
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
      <input
        type="checkbox"
        checked={platforms.facebook}
        onChange={(e) => setPlatforms({ ...platforms, facebook: e.target.checked })}
        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">Facebook</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Feed (Portrait 4:5) + Stories (Vertical 9:16)
        </p>
      </div>
    </label>
    
    {/* LinkedIn */}
    <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-all">
      <input
        type="checkbox"
        checked={platforms.linkedin}
        onChange={(e) => setPlatforms({ ...platforms, linkedin: e.target.checked })}
        className="mt-1 w-4 h-4 text-blue-700 rounded focus:ring-blue-700"
      />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">LinkedIn</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Square (1:1) - Professional standard
        </p>
      </div>
    </label>
  </div>
  
  {/* Format Summary */}
  {(platforms.instagram || platforms.tiktok || platforms.linkedin || platforms.facebook) && (
    <div className="mt-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
      <p className="text-sm text-blue-800 font-medium mb-2">
        📐 Formats to Generate:
      </p>
      <ul className="text-sm text-blue-700 space-y-1">
        {(platforms.instagram || platforms.facebook) && (
          <li>• Portrait (1080×1350) - Instagram/Facebook Feed</li>
        )}
        {(platforms.instagram || platforms.facebook || platforms.tiktok) && (
          <li>• Vertical (1080×1920) - Stories/Reels/TikTok</li>
        )}
        {platforms.linkedin && (
          <li>• Square (1080×1080) - LinkedIn/Twitter</li>
        )}
      </ul>
    </div>
  )}
  
  {/* Warning if nothing selected */}
  {!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.facebook && (
    <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
      <p className="text-sm text-yellow-800">
        ⚠️ Please select at least one platform so we know which formats to generate.
      </p>
    </div>
  )}
</div>
```

### 3. Update Submit Handler

Add platforms to the submit payload:

```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  // Validate at least one platform selected
  if (!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.facebook) {
    setError('Please select at least one platform')
    return
  }
  
  // ... rest of validation
  
  // Build platform list
  const selectedPlatforms = []
  if (platforms.instagram) selectedPlatforms.push('instagram')
  if (platforms.tiktok) selectedPlatforms.push('tiktok')
  if (platforms.facebook) selectedPlatforms.push('facebook')
  if (platforms.linkedin) selectedPlatforms.push('linkedin')
  
  // Submit with platforms
  const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uploadType,
      platforms: selectedPlatforms,  // ADD THIS
      briefText: brief,
      hasVoiceNote: !!voiceNote,
      images: uploadedImages,
    }),
  })
  
  // ... rest of submit logic
}
```

---

## Backend Changes

### Update Submit Route

Add platform handling to `/api/submissions/upload/[token]/submit/route.ts`:

```typescript
const { uploadType, platforms, briefText, hasVoiceNote, images } = body

// Validate platforms
if (!platforms || platforms.length === 0) {
  return NextResponse.json(
    { error: 'Please select at least one platform' },
    { status: 400 }
  )
}

// Map platforms to formats
const formatMap = {
  instagram: ['portrait', 'vertical'],  // 4:5 + 9:16
  facebook: ['portrait', 'vertical'],   // 4:5 + 9:16
  tiktok: ['vertical'],                  // 9:16 only
  linkedin: ['square'],                  // 1:1 only
}

// Get unique formats needed
const formatsNeeded = new Set()
platforms.forEach((platform: string) => {
  formatMap[platform as keyof typeof formatMap].forEach((format: string) => {
    formatsNeeded.add(format)
  })
})

console.log('Platforms:', platforms)
console.log('Formats to generate:', Array.from(formatsNeeded))

// Store in submission
await supabase
  .from('submissions')
  .update({
    status: 'generating',
    submission_type: type,
    platforms: platforms,  // NEW: Store selected platforms
    post_count: type === 'images' ? images.length * 3 : images.length,
    updated_at: new Date().toISOString(),
  })
  .eq('id', submission.id)
```

---

## Video Creator Update

Update `video-creator.py` to accept `--platforms` flag:

```python
# Add argument
parser.add_argument('--platforms', nargs='+', 
                   default=['instagram'],
                   help='Target platforms: instagram, tiktok, linkedin')

# Generate multiple formats
if 'instagram' in args.platforms or 'facebook' in args.platforms:
    create_animated_gif(images, output_portrait, size=(1080, 1350))
    
if 'tiktok' in args.platforms or 'instagram' in args.platforms:
    create_animated_gif(images, output_vertical, size=(1080, 1920))
    
if 'linkedin' in args.platforms:
    create_animated_gif(images, output_square, size=(1080, 1080))
```

---

## Testing

1. Load upload page
2. See platform selector with Instagram pre-selected
3. Try quick-select packs
4. Try individual checkboxes
5. Verify format summary updates
6. Submit with different platform combinations
7. Check backend generates correct formats
8. Verify review page shows all formats

---

**Ready to implement?**
