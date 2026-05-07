# Platform Selection Implementation - Step by Step

**Status:** Ready to implement

---

## What I Need to Do

### 1. Add Platform State to Upload Page

**File:** `src/app/upload/[token]/page.tsx`

**Add after line 24 (after uploadType state):**

```typescript
const [platforms, setPlatforms] = useState({
  instagram: true,  // Default to Instagram
  tiktok: false,
  linkedin: false,
  facebook: false,
})
```

### 2. Add Platform Selector UI

**Add after the Upload Type Selector div (around line 178), before Image Upload section:**

Copy the entire platform selector section from:
`src/app/upload/[token]/page.tsx.platform-selection`

### 3. Add Platform Validation

**File:** `src/app/upload/[token]/page.tsx`

**In handleSubmit function, add after line 220:**

```typescript
// Validate at least one platform selected
if (!platforms.instagram && !platforms.tiktok && !platforms.linkedin && !platforms.facebook) {
  setError('Please select at least one platform')
  return
}
```

### 4. Add Platforms to Submit Payload

**In handleSubmit, update the body JSON to include:**

```typescript
body: JSON.stringify({
  uploadType,
  platforms: selectedPlatforms,  // ADD THIS
  briefText: brief,
  hasVoiceNote: !!voiceNote,
  images: uploadedImages,
})
```

Where `selectedPlatforms` is built like:

```typescript
const selectedPlatforms = []
if (platforms.instagram) selectedPlatforms.push('instagram')
if (platforms.tiktok) selectedPlatforms.push('tiktok')
if (platforms.facebook) selectedPlatforms.push('facebook')
if (platforms.linkedin) selectedPlatforms.push('linkedin')
```

---

## Manual Implementation (Fastest)

Since the file is large and complex, here's the fastest way:

### Option A: I Create Complete New File

I'll write the complete updated `page.tsx` with all changes integrated.

**Time:** 2 minutes  
**Risk:** Low (we have backup)

### Option B: You Edit Manually

**Steps:**
1. Open `src/app/upload/[token]/page.tsx` in VS Code
2. Add platform state after line 24
3. Paste platform selector UI after upload type selector
4. Add validation in handleSubmit
5. Add platforms to submit payload

**Time:** 5 minutes  
**Risk:** Very low

---

## Backend Changes (After Frontend)

### Update Submit Route

**File:** `src/app/api/submissions/upload/[token]/submit/route.ts`

**Add after line 25 (after body parsing):**

```typescript
const { uploadType, platforms, briefText, hasVoiceNote, images } = body

// Validate platforms
if (!platforms || platforms.length === 0) {
  return NextResponse.json(
    { error: 'Please select at least one platform' },
    { status: 400 }
  )
}
```

**Update submission update (around line 70) to include:**

```typescript
await supabase
  .from('submissions')
  .update({
    status: 'generating',
    submission_type: type,
    platforms: platforms,  // Store platforms
    post_count: type === 'images' ? images.length * 3 : images.length,
    updated_at: new Date().toISOString(),
  })
  .eq('id', submission.id)
```

---

## My Recommendation

**Let me create the complete updated upload page file.**

I'll write it all at once with:
- ✅ Platform state
- ✅ Platform selector UI
- ✅ Validation logic
- ✅ Submit payload update

Then you can:
1. Review the changes
2. Test locally
3. Deploy to Vercel

**Shall I create the complete file now?**

---

## Testing Checklist

After implementation:

- [ ] Upload page loads
- [ ] Platform selector shows
- [ ] Instagram pre-selected
- [ ] Quick-select packs work
- [ ] Individual checkboxes work
- [ ] Format summary updates
- [ ] Warning shows if nothing selected
- [ ] Submit validates platforms
- [ ] Backend receives platforms
- [ ] Database stores platforms
- [ ] Video creator generates correct formats

---

**Ready for me to create the complete file?**
