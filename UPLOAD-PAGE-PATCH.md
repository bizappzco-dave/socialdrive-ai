# Upload Page - Platform Selection Patch

**Apply these 4 changes to:** `src/app/upload/[token]/page.tsx`

---

## Change 1: Add Platform State (Line ~25)

**Find:**
```typescript
const [uploadType, setUploadType] = useState<'images' | 'carousel' | 'video'>('images')
const [images, setImages] = useState<File[]>([])
```

**Replace with:**
```typescript
const [uploadType, setUploadType] = useState<'images' | 'carousel' | 'video'>('images')
const [platforms, setPlatforms] = useState({
  instagram: true,  // Default to Instagram
  tiktok: false,
  linkedin: false,
  facebook: false,
})
const [images, setImages] = useState<File[]>([])
```

---

## Change 2: Add Platform Selector UI (After Upload Type Selector)

**Find the closing `</div>` of the Upload Type Selector section (around line 177)**

**After it, add this entire section:**

```tsx
{/* Platform Selector */}
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
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
        platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.facebook
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
        platforms.instagram && platforms.tiktok && !platforms.linkedin && !platforms.facebook
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
        platforms.linkedin && !platforms.instagram && !platforms.tiktok && !platforms.facebook
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

---

## Change 3: Add Platform Validation (In handleSubmit)

**Find (around line 220):**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (images.length === 0) {
    setError('Please upload at least one image')
    return
  }
```

**Replace with:**
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  // Validate at least one platform selected
  if (!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.facebook) {
    setError('Please select at least one platform')
    return
  }
  
  if (images.length === 0) {
    setError('Please upload at least one image')
    return
  }
```

---

## Change 4: Add Platforms to Submit Payload

**Find (around line 265):**
```typescript
// Build platform list
const selectedPlatforms = []
if (platforms.instagram) selectedPlatforms.push('instagram')
if (platforms.tiktok) selectedPlatforms.push('tiktok')
if (platforms.facebook) selectedPlatforms.push('facebook')
if (platforms.linkedin) selectedPlatforms.push('linkedin')

// Create/update submission
const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    uploadType,
    platforms: selectedPlatforms,
    briefText: brief,
    hasVoiceNote: !!voiceNote,
    images: uploadedImages,
  }),
})
```

**The "Build platform list" part might not exist yet. If not, add it before the fetch call.**

---

## Apply These Changes

**Option 1: Manual (Recommended - Fastest)**
1. Open `src/app/upload/[token]/page.tsx` in VS Code
2. Apply the 4 changes above
3. Save and test

**Option 2: Let Me Create Complete File**
I can write the entire 600-line file with all changes integrated.

---

## After Frontend: Backend Changes

Once frontend is done, we need to update:
1. `src/app/api/submissions/upload/[token]/submit/route.ts` - Accept platforms
2. `video-creator.py` - Generate based on platforms
3. Database - Store platforms (migration already ready)

---

**Which option? Manual or complete file?**
