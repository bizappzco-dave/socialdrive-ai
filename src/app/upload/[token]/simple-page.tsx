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
    
    // Create previews
    newFiles.forEach(file => {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setImagePreviews(prev => [...prev, e.target!.result as string])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle drag & drop
  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
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
      // Upload images to storage
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
            throw new Error(`Failed to upload ${file.name}`)
          }
          
          return await response.json()
        })
      )
      
      // Create/update submission (Simple tier defaults)
      const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadType: 'images',  // Simple tier: always images
          platforms: ['instagram'],  // Simple tier: Instagram only
          briefText: brief,
          hasVoiceNote: false,
          images: uploadedImages,
        }),
      })
      
      if (!submitResponse.ok) {
        const errorData = await submitResponse.json()
        console.error('Submit error:', errorData)
        throw new Error(errorData.error || 'Submission failed')
      }
      
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
          {/* Photo Upload */}
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

          {/* Brief */}
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
• '20% off all sausages this week'
• 'New summer menu just launched'
• 'Just opened a second location in Dublin'"
              rows={4}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
            
            <p className="text-sm text-gray-500 mt-3">
              Optional but helpful! We'll write great captions either way.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Oops, something went wrong</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || images.length === 0 || images.length > 5}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="hidden sm:inline">Creating your posts...</span>
                <span className="sm:hidden">Creating...</span>
              </span>
            ) : (
              <span className="block sm:inline">✨ Create My Posts</span>
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
