'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Submission {
  id: string
  client_name: string
  status: string
}

export default function SimpleUploadPage() {
  const params = useParams()
  const token = params.token as string
  
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  
  // MCP state
  const [analyzing, setAnalyzing] = useState(false)
  const [generatingCaptions, setGeneratingCaptions] = useState(false)
  const [templateMatch, setTemplateMatch] = useState<any>(null)
  const [generatedCaptions, setGeneratedCaptions] = useState<any[]>([])
  const [mcpError, setMcPError] = useState<string | null>(null)
  const [analyzed, setAnalyzed] = useState(false)
  
  // Form state
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [startText, setStartText] = useState('')  // Text to start every caption (e.g., "🚨 FLASH SALE: Free cuts this week")
  const [context, setContext] = useState('')  // Optional: additional context for AI
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load submission info
  useEffect(() => {
    loadSubmission()
  }, [token])

  async function loadSubmission() {
    try {
      const response = await fetch(`/api/submissions/upload/${token}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid upload link')
      }
      
      setSubmission(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle file selection
  async function handleFileSelect(files: FileList | null) {
    if (!files) return
    
    // Optimize images before adding
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB original limit
    const MAX_DIMENSION = 2048 // Max width/height for optimization
    const JPEG_QUALITY = 0.85 // 85% quality for compression
    const validFiles: File[] = []
    const rejectedFiles: {name: string, reason: string}[] = []
    
    for (const file of Array.from(files)) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        rejectedFiles.push({ name: file.name, reason: 'Not an image file' })
        continue
      }
      
      // Check if already added
      if (images.find(img => img.name === file.name)) {
        rejectedFiles.push({ name: file.name, reason: 'Already added' })
        continue
      }
      
      // Optimize image if needed
      try {
        const optimizedFile = await optimizeImage(file, MAX_DIMENSION, JPEG_QUALITY)
        
        // Check optimized size
        if (optimizedFile.size > MAX_SIZE) {
          rejectedFiles.push({ 
            name: file.name, 
            reason: `File still too large after optimization (${(optimizedFile.size / 1024 / 1024).toFixed(1)}MB, max 10MB)` 
          })
          continue
        }
        
        validFiles.push(optimizedFile)
      } catch (err: any) {
        rejectedFiles.push({ name: file.name, reason: `Failed to process: ${err.message}` })
      }
    }
    
    // Show warnings for rejected files
    if (rejectedFiles.length > 0) {
      const messages = rejectedFiles.map(r => `${r.name}: ${r.reason}`).join('\n')
      console.warn('⚠️ Rejected files:', messages)
      setError(`Some files were rejected:\n${messages}`)
    }
    
    if (validFiles.length === 0) return
    
    setImages(prev => [...prev, ...validFiles])
    
    // Create previews using blob URLs (much faster than base64 for large files)
    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
    
    // Note: MCP analysis runs when user clicks "Process My Posts"
    // This gives them time to do branding edits first if needed
  }
  
  // Optimize image: resize and compress
  async function optimizeImage(file: File, maxDimension: number, quality: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      
      img.onload = () => {
        URL.revokeObjectURL(url)
        
        // Calculate new dimensions (maintain aspect ratio)
        let width = img.width
        let height = img.height
        
        if (width > height && width > maxDimension) {
          height = Math.round(height * (maxDimension / width))
          width = maxDimension
        } else if (height > maxDimension) {
          width = Math.round(width * (maxDimension / height))
          height = maxDimension
        }
        
        // Create canvas and resize
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas not supported'))
          return
        }
        
        ctx.drawImage(img, 0, 0, width, height)
        
        // Compress and convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            
            // Create new file with optimized content
            const ext = file.name.split('.').pop() || 'jpg'
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            
            const originalSize = (file.size / 1024 / 1024).toFixed(1)
            const newSize = (optimizedFile.size / 1024 / 1024).toFixed(1)
            const reduction = ((1 - optimizedFile.size / file.size) * 100).toFixed(1)
            
            console.log(`📸 Optimized ${file.name}: ${originalSize}MB → ${newSize}MB (${reduction}% smaller, ${width}x${height})`)
            resolve(optimizedFile)
          },
          'image/jpeg',
          quality
        )
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load image'))
      }
      
      img.src = url
    })
  }

  // Handle drag & drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  // MCP Analysis: Analyze ALL images and generate captions (silent, no UI)
  async function analyzeImagesWithMCP() {
    if (images.length === 0) {
      console.log('[MCP] No images to analyze')
      return null
    }
    
    console.log('[MCP] Starting analysis of', images.length, 'images...')
    console.log('[MCP] Start text:', startText || '(none)')
    console.log('[MCP] Context:', context || '(none)')
    
    const allCaptions = []
    let templateMatch = null
    
    // Analyze each image separately
    for (let i = 0; i < images.length; i++) {
      const file = images[i]
      console.log(`[MCP] Analyzing image ${i + 1}/${images.length}:`, file.name)
      
      try {
        // Convert image to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        
        console.log('[MCP] Base64 length:', base64.length, 'chars')
        
        // Call MCP template match (production URL)
        const MCP_BASE_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://social-drive-mcp-railway-production-cb81.up.railway.app'
        
        const templateResponse = await fetch(`${MCP_BASE_URL}/template/match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64, industry: 'barber' })
        })
        
        if (!templateResponse.ok) throw new Error('MCP server unavailable')
        
        const templateData = await templateResponse.json()
        
        if (templateData.success) {
          // Use first image's template match for all
          if (i === 0) {
            templateMatch = templateData.template_match || templateData
            setTemplateMatch(templateMatch)
          }
          
          // Call MCP caption generation
          console.log('[MCP] Calling caption generation for image', i + 1)
          console.log('[MCP] Request payload:', JSON.stringify({
            image_base64: base64.substring(0, 50) + '...',
            template_match: templateMatch ? 'present' : 'missing',
            industry: 'barber',
            count: 3,
            start_text: startText || '(empty)',
            additional_context: context || '(empty)'
          }, null, 2))
          const captionResponse = await fetch(`${MCP_BASE_URL}/generate-captions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image_base64: base64,
              template_match: templateMatch,
              industry: 'barber',
              count: 3,  // 3 captions per image
              start_text: startText || undefined,  // Include start text if provided
              additional_context: context || undefined  // Include additional context if provided
            })
          })
          
          console.log('[MCP] Caption response status:', captionResponse.status)
          const captionData = await captionResponse.json()
          console.log('[MCP] Caption response data:', JSON.stringify(captionData, null, 2).substring(0, 500))
          
          if (captionData.success) {
            const imageCaptions = captionData.captions
            allCaptions.push(...imageCaptions)
            console.log(`[MCP] ✅ Image ${i + 1}: Generated`, imageCaptions.length, 'captions')
          }
        }
      } catch (err: any) {
        console.error(`[MCP] ❌ Failed to analyze image ${i + 1}:`, err.message)
      }
    }
    
    setGeneratedCaptions(allCaptions)
    console.log('[MCP] ✅ Total captions generated:', allCaptions.length)
    
    // Return the results so caller can use them immediately (not from async state)
    return { templateMatch, captions: allCaptions }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (images.length === 0) {
      setError('Please upload at least one photo')
      return
    }
    
    if (images.length > 5) {
      setError('Please upload no more than 5 photos')
      return
    }
    
    setUploading(true)
    setError(null)
    
    try {
      // Step 0: Run MCP analysis if not done yet (generate captions with barber hashtags)
      let finalCaptions = generatedCaptions
      let finalTemplateMatch = templateMatch
      
      if (finalCaptions.length === 0 && images.length > 0) {
        console.log('[MCP] No pre-generated captions, running analysis now...')
        const mcpResult = await analyzeImagesWithMCP()
        if (mcpResult) {
          finalCaptions = mcpResult.captions
          finalTemplateMatch = mcpResult.templateMatch
          console.log('[MCP] ✅ Generated', finalCaptions.length, 'captions')
        } else {
          console.log('[MCP] ⚠️ Analysis failed, will use server-side generation')
        }
      }
      
      // Step 1: Upload images to storage
      console.log('[Upload] Starting upload of', images.length, 'images')
      
      const uploadedImages = await Promise.all(
        images.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('submissionToken', token)
          
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          })
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error('[Upload] Failed:', response.status, errorText)
            throw new Error(`Failed to upload ${file.name}: ${errorText}`)
          }
          
          const imageData = await response.json()
          console.log('[Upload] Uploaded:', imageData)
          return imageData
        })
      )
      
      console.log('[Upload] All images uploaded, creating submission...')
      
      // Step 2: Create submission
      const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadType: 'images',
          platforms: ['instagram'],
          startText: startText,  // Text to start every caption
          additionalContext: context,  // Optional context for AI
          hasVoiceNote: false,
          images: uploadedImages,
          templateMatch: finalTemplateMatch,
          generatedCaptions: finalCaptions.length > 0 ? finalCaptions : null,
        }),
      })
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        console.error('[Submit] Failed:', submitResponse.status, errorData)
        throw new Error(errorData.error || 'Submission failed')
      }
      
      const submitData = await submitResponse.json()
      console.log('=== SUBMIT RESPONSE (simple-page) ===')
      console.log('Status:', submitResponse.status)
      console.log('reviewToken present:', !!submitData.reviewToken)
      console.log('reviewToken:', submitData.reviewToken ? submitData.reviewToken.substring(0, 12) + '...' : 'NONE')
      
      // Redirect to review page with the review token
      if (submitData.reviewToken) {
        console.log('🎉 REDIRECTING to review page with token:', submitData.reviewToken)
        console.log('⏳ Redirecting in 3 seconds... (check console for upload logs)')
        console.log('Upload path:', uploadedImages[0]?.path || 'N/A')
        setTimeout(() => {
          window.location.href = `/review/${submitData.reviewToken}`
        }, 3000)  // 3 second delay to see logs
        return  // Don't set uploaded state, we're redirecting
      }
      
      console.warn('⚠️ No reviewToken in response, showing success message')
      setUploaded(true)
      
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message || 'Upload failed. Please try again.')
      setUploading(false)
    }
  }

  // Remove image
  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="font-semibold text-slate-900">Preparing your upload link</p>
          <p className="mt-1 text-sm text-slate-500">This only takes a moment.</p>
        </div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-950">Invalid upload link</h1>
          <p className="mb-4 text-slate-600">{error}</p>
          <p className="text-sm text-slate-500">
            Please contact us to get a new upload link.
          </p>
        </div>
      </div>
    )
  }

  if (uploaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-slate-950">Upload received</h1>
          <p className="mb-4 text-slate-600">
            We are creating your social media posts now. You will get a review link shortly.
          </p>
          <div className="mb-6 rounded-xl bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-900">
              Your photos and notes are safely in the queue.
            </p>
          </div>
          
          {/* Review Your Posts Link */}
          <div className="border-t border-gray-200 pt-6">
            <p className="mb-3 text-sm text-slate-600">Next step: pick your favorites</p>
            <a
              href={`/review/${token}`}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Review & Select Favorites
            </a>
            <p className="mt-2 text-xs text-slate-500">
              Choose 3 posts from 9 AI-generated options
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <aside className="lg:sticky lg:top-8">
          <div className="rounded-2xl border border-slate-200 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected as {submission?.client_name}
            </div>
            <p className="text-sm font-bold uppercase text-emerald-700">SocialDrive AI</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Send us your photos. We will shape them into posts.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Upload 3-5 recent photos and add any promotion or message you want included. SocialDrive turns them into
              ready-to-review social media captions.
            </p>
            <div className="mt-8 hidden gap-3 sm:grid">
              {[
                ['1', 'Add your offer or announcement'],
                ['2', 'Upload clear phone photos'],
                ['3', 'Review the generated post options'],
              ].map(([step, label]) => (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200" key={step}>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-sm font-bold text-emerald-700 shadow-sm">
                    {step}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Caption context */}
          <div className="rounded-2xl border border-emerald-900 bg-emerald-950 p-5 shadow-lg shadow-emerald-950/20 sm:p-7">
            <h2 className="mb-2 text-xl font-bold text-white">
              Caption context, optional
            </h2>
            <p className="mb-4 text-sm leading-6 text-emerald-50">
              Add anything current that should appear at the start of every caption. This could be an offer, event,
              new service, seasonal message, recent update, or simply what you want customers to notice.
            </p>
            
            <textarea
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              placeholder="Enter text here...

Examples:
New appointments available this week
We are taking bookings for summer projects
Mention our free consultation
Highlight our new service or product range"
              rows={4}
              className="w-full rounded-xl border-2 border-emerald-800 bg-white px-4 py-3 text-slate-900 shadow-lg shadow-emerald-900/10 outline-none transition placeholder:text-slate-500 focus:border-emerald-900 focus:bg-white focus:shadow-xl focus:shadow-emerald-900/15 focus:ring-4 focus:ring-emerald-700/15"
            />
            
            {/* Optional: Additional context */}
            <div className="mt-4 border-t border-emerald-800 pt-4">
              <label className="mb-1 block text-sm font-semibold text-white">
                Optional extra instructions
              </label>
              <p className="mb-3 text-sm leading-6 text-emerald-50">
                Use this if the AI needs more background: what is happening in the business right now, who the post is
                aimed at, what tone to use, or anything the company wants mentioned or avoided.
              </p>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Enter text here...

Examples:
Keep the tone friendly and local
Mention that we work with homeowners and trade customers
Focus on quality, reliability and quick turnaround
Do not mention prices in this post"
                rows={2}
                className="w-full rounded-xl border-2 border-emerald-800 bg-white px-4 py-2.5 text-slate-900 shadow-lg shadow-emerald-900/10 outline-none transition placeholder:text-slate-500 focus:border-emerald-900 focus:bg-white focus:shadow-xl focus:shadow-emerald-900/15 focus:ring-4 focus:ring-emerald-700/15"
              />
              <p className="mt-2 text-xs text-emerald-100">
                Leave this blank if the photos already tell the story.
              </p>
            </div>
          </div>

          {/* Photo Upload - Second Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <h2 className="mb-2 text-xl font-bold text-slate-950">
              Your photos
            </h2>
            <p className="mb-4 text-sm leading-6 text-slate-600">
              Drop 3-5 photos here. We'll make them look amazing!
            </p>
            <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-sm leading-6 text-emerald-900">
                <strong>Tip:</strong> Vertical phone photos work best for Instagram. We will optimize them automatically.
              </p>
            </div>
            
            {/* Drag & Drop Zone - Only show if no images uploaded yet */}
            {images.length === 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center transition-all hover:border-emerald-500 hover:bg-emerald-50"
              >
                <Upload className="mx-auto mb-4 h-14 w-14 text-slate-400" />
                <p className="mb-2 text-lg font-semibold text-slate-800">
                  Drag & drop your photos
                </p>
                <p className="text-sm text-slate-500">
                  or click to browse
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            )}

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="h-full w-full rounded-xl object-cover shadow-sm ring-1 ring-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white shadow-lg hover:bg-red-600"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add More Button - Only show if images already uploaded */}
            {images.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add more photos
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />
              </div>
            )}

            {images.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{images.length} photo{images.length !== 1 ? 's' : ''} ready</span>
                </p>
                {images.length > 5 && (
                  <p className="text-sm font-medium text-amber-600">
                    Max 5 photos please
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Process Button */}
          <button
            type="submit"
            disabled={uploading || images.length === 0 || images.length > 5}
            className="w-full rounded-2xl bg-slate-950 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:py-5"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing...
              </span>
            ) : (
              'Process my posts'
            )}
          </button>

          <p className="text-center text-xs leading-5 text-slate-500">
            We will create engaging social media posts from your photos and send a review link when they are ready.
          </p>
        </form>
      </div>
    </div>
  )
}
