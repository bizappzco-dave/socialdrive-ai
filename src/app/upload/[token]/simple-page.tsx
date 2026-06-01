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
  
  // Form state
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [brief, setBrief] = useState('')
  
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
  function handleFileSelect(files: FileList | null) {
    if (!files) return
    
    const newFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/') && !images.find(img => img.name === file.name)
    )
    
    setImages(prev => [...prev, ...newFiles])
    
    // Create previews using blob URLs (much faster than base64 for large files)
    const newPreviews = newFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
  }

  // Handle drag & drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  // MCP Analysis: Analyze images and generate captions (silent, no UI)
  async function analyzeImagesWithMCP() {
    if (images.length === 0) return null
    
    try {
      // Convert first image to base64
      const file = images[0]
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      
      // Call MCP template match (production URL)
      const MCP_BASE_URL = process.env.NEXT_PUBLIC_MCP_URL || 'https://social-drive-mcp-railway-production-cb81.up.railway.app'
      const templateResponse = await fetch(`${MCP_BASE_URL}/template/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, industry: 'barber' })
      })
      
      if (!templateResponse.ok) throw new Error('MCP server unavailable')
      
      const templateData = await templateResponse.json()
      let templateMatch = null
      let captions = []
      
      if (templateData.success) {
        // templateData is already the template match object (no need to parse again)
        templateMatch = templateData.template_match || templateData
        setTemplateMatch(templateMatch)
        
        // Call MCP caption generation (production URL)
        const captionResponse = await fetch(`${MCP_BASE_URL}/generate-captions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_base64: base64,
            template_match: templateMatch,
            industry: 'barber',
            count: 3  // 3 captions per image for client to choose from
          })
        })
        
        const captionData = await captionResponse.json()
        if (captionData.success) {
          captions = captionData.captions
          setGeneratedCaptions(captionData.captions)
        }
      }
      
      // Return the results so caller can use them immediately (not from async state)
      return { templateMatch, captions }
    } catch (err: any) {
      console.error('MCP analysis failed:', err)
      // Silently continue - server will handle fallback
      return null
    }
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
    
    // MCP Analysis: Silent processing (no UI feedback)
    // IMPORTANT: We need to capture the captions directly, not from state
    // because React state updates are async and won't be ready by the time we submit
    let localCaptions = generatedCaptions
    let localTemplateMatch = templateMatch
    
    if (images.length > 0 && !templateMatch) {
      const mcpResult = await analyzeImagesWithMCP()
      if (mcpResult) {
        localCaptions = mcpResult.captions
        localTemplateMatch = mcpResult.templateMatch
      }
    }
    
    try {
      console.log('🚀 FRONTEND: Starting image upload...')
      console.log('🚀 FRONTEND: Images count:', images.length)
      console.log('🚀 FRONTEND: Brief text:', brief)
      console.log('🚀 FRONTEND: Token:', token)
      
      // Upload images to storage
      const uploadedImages = await Promise.all(
        images.map(async (file) => {
          console.log('🚀 FRONTEND: Uploading file:', file.name)
          const formData = new FormData()
          formData.append('file', file)
          formData.append('submissionToken', token)
          
          const response = await fetch('/api/upload/image', {
            method: 'POST',
            body: formData,
          })
          
          console.log('🚀 FRONTEND: Upload response:', response.status)
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          const imageData = await response.json()
          console.log('🚀 FRONTEND: Uploaded image data:', imageData)
          return imageData
        })
      )
      
      console.log('🚀 FRONTEND: All images uploaded:', uploadedImages.length)
      console.log('🚀 FRONTEND: Uploaded images:', JSON.stringify(uploadedImages, null, 2))
      console.log('🚀 FRONTEND: Calling submit API...')
      console.log('🚀 FRONTEND: Request payload:', JSON.stringify({
        uploadType: 'images',
        platforms: ['instagram'],
        briefText: brief?.substring(0, 50),
        imagesCount: uploadedImages.length,
        imageUrls: uploadedImages.map((img: any) => img.url?.substring(0, 80)),
        hasCaptions: !!localCaptions?.length,
      }, null, 2))
      
      // Create/update submission with pre-generated captions
      const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadType: 'images',
          platforms: ['instagram'],
          briefText: brief,
          hasVoiceNote: false,
          images: uploadedImages,
          templateMatch: localTemplateMatch,
          generatedCaptions: localCaptions.length > 0 ? localCaptions : null,
        }),
      })
      
      console.log('🚀 FRONTEND: Submit response status:', submitResponse.status)
      console.log('🚀 FRONTEND: Submit response headers:', Object.fromEntries(submitResponse.headers.entries()))
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        console.error('🚀 FRONTEND: Submit error:', errorData)
        throw new Error(errorData.error || 'Submission failed')
      }
      
      const submitData = await submitResponse.json()
      console.log('🚀 FRONTEND: Submit success:', submitData)
      console.log('🚀 FRONTEND: Setting uploaded=true')
      setUploaded(true)
      
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(err.message)
    } finally {
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
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              ✨ That's it! We'll handle the rest.
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
            
            {/* Drag & Drop Zone */}
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
