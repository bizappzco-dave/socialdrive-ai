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
  const [brief, setBrief] = useState('')
  const [prefix, setPrefix] = useState('')  // Optional: text to start every caption
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
    console.log('[MCP] Brief text:', brief || '(none)')
    
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
            brief_text: brief || '(empty)',
            brief_length: brief ? brief.length : 0,
            prefix_text: prefix || '(empty)',
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
              brief_text: brief || undefined,  // Include brief if provided
              prefix_text: prefix || undefined,  // Include prefix if provided
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
          briefText: brief,
          prefixText: prefix,  // Optional prefix for all captions
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Getting ready...</p>
        </div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Link</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please contact us to get a new upload link.
          </p>
        </div>
      </div>
    )
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Perfect! 🎉</h1>
          <p className="text-gray-600 mb-4">
            We're creating your social media posts now. You'll get a WhatsApp message with your review link in about 1-2 minutes.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              ✨ That's it! We'll handle the rest.
            </p>
          </div>
          
          {/* Review Your Posts Link */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-3">Next step: Pick your favorites</p>
            <a
              href={`/review/${token}`}
              className="inline-flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 font-semibold py-3 px-6 rounded-xl transition-all"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Review & Select Favorites
            </a>
            <p className="text-xs text-gray-500 mt-2">
              Choose 3 posts from 9 AI-generated options
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto w-full">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-gray-200 mb-3 sm:mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate max-w-[200px] sm:max-w-none">Hi {submission?.client_name}!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
            Upload Your Photos
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-md mx-auto">
            Drop 3-5 photos of what's happening this week. We'll create engaging posts for you automatically.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brief - First Box */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              📝 What's Happening This Week?
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
              Tell us about any sales, events, or news you want to share.
            </p>
            
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Examples:
• '20% off all cuts this week'
• 'New summer menu just launched'
• 'Just opened a second location in Dublin'"
              rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
            
            {/* Optional: Prefix for all captions */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                ✨ Optional: Start every caption with...
              </label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g., '🚨 FLASH SALE:' or 'NEW AT {BRAND}:'"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                This text will appear at the START of every caption (before the AI-generated content)
              </p>
            </div>
            
            {/* Optional: Additional context */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                🧠 Optional: Extra context for the AI
              </label>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g., 'Focus on the quality of our training', 'Mention we're accredited', 'Emphasize hands-on learning'..."
                rows={2}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Any additional instructions or brand guidelines for caption generation
              </p>
            </div>
          </div>

          {/* Photo Upload - Second Box */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              📸 Your Photos
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              Drop 3-5 photos here. We'll make them look amazing!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 sm:mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Pro tip:</strong> Vertical/portrait photos work best for Instagram (like phone photos). We'll optimize them automatically!
              </p>
            </div>
            
            {/* Drag & Drop Zone - Only show if no images uploaded yet */}
            {images.length === 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 sm:border-3 border-dashed border-gray-300 rounded-xl p-6 sm:p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <Upload className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg text-gray-700 font-medium mb-2">
                  Drag & drop your photos
                </p>
                <p className="text-sm sm:text-base text-gray-500">
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
                      className="w-full h-full object-cover rounded-lg shadow-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
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
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
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
                <p className="text-sm text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{images.length} photo{images.length !== 1 ? 's' : ''} ready</span>
                </p>
                {images.length > 5 && (
                  <p className="text-sm text-orange-600 font-medium">
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
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed text-lg sm:text-xl"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Processing...
              </span>
            ) : (
              '✨ Process My Posts'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            We'll create engaging social media posts based on your photos. 
            You'll get a WhatsApp message when they're ready to review!
          </p>
        </form>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Simple, fast, professional. That's SocialDrive AI.
          </p>
        </div>
      </div>
    </div>
  )
}
