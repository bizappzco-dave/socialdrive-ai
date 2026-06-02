# SocialDrive AI - Image Optimization Guide
## Next.js Image Component Best Practices

**Goal:** Optimize all client images for web performance (LCP, CLS, bandwidth)

---

## 1. Next.js Image Component Setup

### Basic Implementation

```tsx
// components/OptimizedImage.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
}

export function OptimizedImage({
  src,
  alt,
  width = 1200,
  height = 800,
  priority = false,
  className,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // Generate this
      quality={85}
      loading={priority ? 'eager' : 'lazy'}
    />
  )
}
```

---

## 2. Automatic AVIF/WebP Conversion

### Next.js Config (already handles this)

```js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nmebpawvnhrokouksvir.supabase.co',
        pathname: '/storage/v1/object/public/submissions/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
}
```

---

## 3. Responsive Image Component

```tsx
// components/ResponsiveImage.tsx
import Image from 'next/image'

interface ResponsiveImageProps {
  src: string
  alt: string
  aspectRatio?: 'square' | 'landscape' | 'portrait' | 'story'
  sizes?: string
}

const aspectRatios = {
  square: '1:1',
  landscape: '16:9',
  portrait: '4:5',
  story: '9:16',
}

const dimensions = {
  square: { width: 1080, height: 1080 },
  landscape: { width: 1200, height: 675 },
  portrait: { width: 1080, height: 1350 },
  story: { width: 1080, height: 1920 },
}

export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'landscape',
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
}: ResponsiveImageProps) {
  const { width, height } = dimensions[aspectRatio]
  
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: `${(height/width)*100}%` }}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        style={{ objectFit: 'cover' }}
        quality={85}
        placeholder="blur"
        blurDataURL="/api/blur-placeholder" // Optional: generate dynamically
        loading="lazy"
      />
    </div>
  )
}
```

---

## 4. LCP Optimization (Hero Images)

```tsx
// components/HeroImage.tsx
import Image from 'next/image'

export function HeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={true} // Critical for LCP
      sizes="100vw"
      style={{ objectFit: 'cover' }}
      quality={90}
      fetchPriority="high"
      loading="eager"
      placeholder="blur"
      blurDataURL="..." // Generate low-res placeholder
    />
  )
}
```

**Key LCP Tips:**
- ✅ Use `priority={true}` for above-fold images
- ✅ Use `loading="eager"` for hero images
- ✅ Preload critical images: `<link rel="preload" as="image" href="..." />`
- ✅ Use AVIF format (smallest file size)
- ✅ Keep hero images under 200KB

---

## 5. Blur Placeholder Generator

```tsx
// app/api/blur-placeholder/route.ts
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const imageUrl = searchParams.get('url')
  
  if (!imageUrl) {
    return NextResponse.json({ error: 'URL required' }, { status: 400 })
  }
  
  try {
    // Fetch image
    const response = await fetch(imageUrl)
    const buffer = await response.arrayBuffer()
    
    // Generate blur placeholder (10x10 pixels, base64)
    const blurred = await sharp(Buffer.from(buffer))
      .resize(10, 10, { fit: 'inside' })
      .jpeg({ quality: 50 })
      .toBuffer()
    
    const blurDataURL = `data:image/jpeg;base64,${blurred.toString('base64')}`
    
    return NextResponse.json({ blurDataURL })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate placeholder' }, { status: 500 })
  }
}
```

---

## 6. Avoid CLS (Cumulative Layout Shift)

### ❌ Bad (causes CLS):
```tsx
// Don't do this - no dimensions specified
<Image src={photo.url} alt="Client photo" />
```

### ✅ Good (prevents CLS):
```tsx
// Always specify width/height or use aspect ratio wrapper
<div style={{ position: 'relative', width: '100%', paddingTop: '75%' }}>
  <Image
    src={photo.url}
    alt="Client photo"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

### ✅ Also Good (explicit dimensions):
```tsx
<Image
  src={photo.url}
  alt="Client photo"
  width={1200}
  height={800}
  style={{ aspectRatio: '1200/800' }}
/>
```

---

## 7. Image Gallery Component

```tsx
// components/ImageGallery.tsx
import { ResponsiveImage } from './ResponsiveImage'

interface GalleryImage {
  url: string
  alt: string
  caption?: string
}

export function ImageGallery({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {images.map((image, index) => (
        <figure key={image.url} className="relative">
          <ResponsiveImage
            src={image.url}
            alt={image.alt || `Gallery image ${index + 1}`}
            aspectRatio="square"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {image.caption && (
            <figcaption className="text-sm text-gray-600 mt-2">
              {image.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  )
}
```

---

## 8. Social Media Image Generator

```tsx
// components/SocialMediaPreview.tsx
import Image from 'next/image'

const socialSizes = {
  instagram: { width: 1080, height: 1080 },
  facebook: { width: 1200, height: 630 },
  twitter: { width: 1200, height: 675 },
  linkedin: { width: 1200, height: 627 },
}

export function SocialMediaPreview({
  src,
  alt,
  platform = 'instagram',
}: {
  src: string
  alt: string
  platform?: keyof typeof socialSizes
}) {
  const { width, height } = socialSizes[platform]
  
  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        quality={90}
        sizes={`${width}px`}
      />
      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
        {platform}
      </div>
    </div>
  )
}
```

---

## 9. Performance Checklist

### Before Deploy:
- [ ] All images use Next.js `<Image>` component
- [ ] Hero/LCP images have `priority={true}`
- [ ] All images have `alt` text (accessibility)
- [ ] All images have explicit dimensions (no CLS)
- [ ] Lazy loading enabled for below-fold images
- [ ] AVIF/WebP formats enabled in next.config.js
- [ ] Image CDN configured (Supabase storage)
- [ ] Blur placeholders for large images
- [ ] Responsive `sizes` attribute set correctly

### Performance Targets:
- LCP: < 2.5 seconds
- CLS: < 0.1
- Image weight: < 200KB for hero, < 100KB for thumbnails
- Format priority: AVIF > WebP > JPEG

---

## 10. Migration Script (Legacy → Optimized)

```bash
# Find all <img> tags in codebase
grep -r "<img" src/ --include="*.tsx" --include="*.jsx"

# Manual replacement pattern:
# Before:
<img src={photo.url} alt={photo.alt} width="800" height="600" />

# After:
<Image src={photo.url} alt={photo.alt} width={800} height={600} quality={85} />
```

---

## Quick Start for SocialDrive

1. **Update `next.config.js`** (done above)
2. **Create `OptimizedImage` component** (copy from section 1)
3. **Replace all `<img>` tags** in review page, gallery, etc.
4. **Add blur placeholders** for submission images
5. **Test with Lighthouse** (Chrome DevTools → Lighthouse)

---

## Example: Review Page Update

```tsx
// app/review/[token]/page.tsx - Update image rendering
import { OptimizedImage } from '@/components/OptimizedImage'

// Replace this:
<img src={post.image_url} alt="Generated post" className="w-full h-auto" />

// With this:
<OptimizedImage
  src={post.image_url}
  alt={post.caption_text || 'Generated social media post'}
  aspectRatio="square"
  priority={index === 0} // First image is LCP
/>
```

---

**Result:** 
- 40-60% smaller image files
- Faster page loads (LCP improvement)
- No layout shift (CLS = 0)
- Better Core Web Vitals scores
- Improved SEO rankings
