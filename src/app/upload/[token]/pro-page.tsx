'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Upload, Image, FileText, Mic, CheckCircle, AlertCircle, Loader2, Film, Grid3x3 } from 'lucide-react'

interface Submission {
  id: string
  client_name: string
  status: string
}

export default function UploadPage() {
  const params = useParams()
  const token = params.token as string
  
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  
  // Form state
  const [uploadType, setUploadType] = useState<'images' | 'carousel' | 'video'>('images')
  const [platforms, setPlatforms] = useState<string[]>(['instagram']) // Default to Instagram
  const [images, setImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [brief, setBrief] = useState('')
  const [recording, setRecording] = useState(false)
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

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

  // Handle voice recording
  async function toggleRecording() {
    if (recording) {
      // Stop recording
      mediaRecorderRef.current?.stop()
      setRecording(false)
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder
        audioChunksRef.current = []
        
        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data)
        }
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
          setVoiceNote(audioBlob)
        }
        
        mediaRecorder.start()
        setRecording(true)
      } catch (err: any) {
        setError('Could not access microphone: ' + err.message)
      }
    }
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (images.length === 0) {
      setError('Please upload at least one image')
      return
    }
    
    // Validate image count based on upload type
    if (uploadType === 'images' && images.length > 5) {
      setError('Simple tier supports up to 5 images. Please remove ' + (images.length - 5) + ' image(s).')
      return
    }
    
    if (uploadType === 'carousel' && images.length > 10) {
      setError('Carousels support maximum 10 images (Instagram/Facebook limit). Please remove ' + (images.length - 10) + ' image(s).')
      return
    }
    
    if (uploadType === 'carousel' && images.length < 3) {
      setError('Carousels require minimum 3 images. Please add ' + (3 - images.length) + ' more image(s).')
      return
    }
    
    if (uploadType === 'video' && images.length < 3) {
      setError('Video slideshows require minimum 3 images. Please add ' + (3 - images.length) + ' more image(s).')
      return
    }
    
    if (platforms.length === 0) {
      setError('Please select at least one platform')
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
      
      // Create/update submission
      const submitResponse = await fetch(`/api/submissions/upload/${token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadType,
          platforms,
          briefText: brief,
          hasVoiceNote: !!voiceNote,
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your upload link...</p>
        </div>
      </div>
    )
  }

  if (error && !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Complete!</h1>
          <p className="text-gray-600 mb-4">
            We're generating your social media posts now. You'll receive a WhatsApp message with your review link shortly.
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800 font-medium">
              ⏱️ This usually takes 1-2 minutes
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Connected as {submission?.client_name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Content
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Choose your format and upload images. We'll generate engaging captions and create your content automatically.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Type Selector */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Choose Format
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Images Only */}
              <button
                type="button"
                onClick={() => setUploadType('images')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  uploadType === 'images'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image className={`h-6 w-6 mb-2 ${
                  uploadType === 'images' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <p className="font-medium text-gray-900">Images Only</p>
                <p className="text-sm text-gray-500 mt-1">
                  3-5 individual posts
                </p>
              </button>
              
              {/* Carousel */}
              <button
                type="button"
                onClick={() => setUploadType('carousel')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  uploadType === 'carousel'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Grid3x3 className={`h-6 w-6 mb-2 ${
                  uploadType === 'carousel' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <p className="font-medium text-gray-900">Carousel</p>
                <p className="text-sm text-gray-500 mt-1">
                  Multi-image post (GIF)
                </p>
              </button>
              
              {/* Video Slideshow */}
              <button
                type="button"
                onClick={() => setUploadType('video')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  uploadType === 'video'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Film className={`h-6 w-6 mb-2 ${
                  uploadType === 'video' ? 'text-blue-600' : 'text-gray-500'
                }`} />
                <p className="font-medium text-gray-900">Video Slideshow</p>
                <p className="text-sm text-gray-500 mt-1">
                  10+ images → MP4 video
                </p>
              </button>
            </div>
            
            {uploadType === 'video' && (
              <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Video slideshows work best with 10+ images. Minimum 3 images required.
                </p>
              </div>
            )}
          </div>

          {/* Platform Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Select Platform
              {uploadType === 'carousel' || uploadType === 'video' ? (
                <span className="block text-sm font-normal text-gray-500 mt-1">
                  Carousels and videos are optimized for one platform at a time
                </span>
              ) : (
                <span className="block text-sm font-normal text-gray-500 mt-1">
                  Choose where you want to post these images
                </span>
              )}
            </h2>
            
            <div className="space-y-3">
              {/* Instagram */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                {uploadType === 'carousel' || uploadType === 'video' ? (
                  <input
                    type="radio"
                    name="platform"
                    value="instagram"
                    checked={platforms[0] === 'instagram'}
                    onChange={() => setPlatforms(['instagram'])}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={platforms.includes('instagram')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPlatforms([...platforms, 'instagram'])
                      } else {
                        setPlatforms(platforms.filter(p => p !== 'instagram'))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}
                <span className="font-medium text-gray-900">Instagram</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {uploadType === 'carousel' ? '1080×1350 (Portrait) ⭐' : uploadType === 'video' ? '1080×1920 (Vertical)' : 'Feed posts'}
                </span>
              </label>
              
              {/* Facebook */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                {uploadType === 'carousel' || uploadType === 'video' ? (
                  <input
                    type="radio"
                    name="platform"
                    value="facebook"
                    checked={platforms[0] === 'facebook'}
                    onChange={() => setPlatforms(['facebook'])}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={platforms.includes('facebook')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPlatforms([...platforms, 'facebook'])
                      } else {
                        setPlatforms(platforms.filter(p => p !== 'facebook'))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}
                <span className="font-medium text-gray-900">Facebook</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {uploadType === 'carousel' ? '1080×1350 (Portrait)' : uploadType === 'video' ? '1080×1920 (Vertical)' : 'Feed posts'}
                </span>
              </label>
              
              {/* TikTok */}
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                {uploadType === 'carousel' || uploadType === 'video' ? (
                  <input
                    type="radio"
                    name="platform"
                    value="tiktok"
                    checked={platforms[0] === 'tiktok'}
                    onChange={() => setPlatforms(['tiktok'])}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="checkbox"
                    checked={platforms.includes('tiktok')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setPlatforms([...platforms, 'tiktok'])
                      } else {
                        setPlatforms(platforms.filter(p => p !== 'tiktok'))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                )}
                <span className="font-medium text-gray-900">TikTok</span>
                <span className="text-sm text-gray-500 ml-auto">
                  {uploadType === 'carousel' || uploadType === 'video' ? '1080×1920 (Vertical)' : 'Video posts'}
                </span>
              </label>
            </div>
            
            {platforms.length === 0 && (
              <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-3 rounded-r-lg">
                <p className="text-sm text-red-800">
                  ⚠️ Please select at least one platform
                </p>
              </div>
            )}
            
            {(uploadType === 'carousel' || uploadType === 'video') && platforms.length > 1 && (
              <div className="mt-3 bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro tip:</strong> For carousels and videos, select one platform for optimal dimensions. You can upload again for other platforms.
                </p>
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Image className="h-5 w-5 text-blue-600" />
              {uploadType === 'images' && 'Upload Images (3-5)'}
              {uploadType === 'carousel' && 'Upload Images for Carousel (3-10)'}
              {uploadType === 'video' && 'Upload Images for Video (3-20)'}
            </h2>
            
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
            >
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                Drag & drop images here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                JPG, PNG, WebP • {uploadType === 'images' && '3-5 images'}{uploadType === 'carousel' && '3-10 images'}{uploadType === 'video' && '3-20 images'}
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
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
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
              <div className="mt-3 space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  {images.length} image{images.length !== 1 ? 's' : ''} ready
                </p>
                {uploadType === 'images' && images.length > 5 && (
                  <p className="text-sm text-orange-600">
                    ⚠️ You have {images.length} images. For individual posts, we recommend 3-5 images.
                  </p>
                )}
                {uploadType === 'carousel' && (images.length < 3 || images.length > 10) && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Carousels work best with 3-10 images. You have {images.length}.
                  </p>
                )}
                {uploadType === 'video' && images.length < 3 && (
                  <p className="text-sm text-orange-600">
                    ⚠️ Minimum 3 images required for video. You have {images.length}.
                  </p>
                )}
                {uploadType === 'video' && images.length >= 3 && images.length < 10 && (
                  <p className="text-sm text-blue-600">
                    💡 Tip: Add more images (10+) for a longer, smoother video.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Brief/Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Your Brief
            </h2>
            
            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Tell us about this week's content...
              
Examples:
- 'Sale on all services this week - 20% off'
- 'New branch just opened in Dublin city centre'
- 'Focus on our new beard grooming service'"
              rows={4}
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <p className="text-sm text-gray-500 mt-2">
              Mention any promotions, events, new services, or specific messaging you want included.
            </p>
          </div>

          {/* Voice Note (Optional) */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mic className="h-5 w-5 text-blue-600" />
              Voice Note (Optional)
            </h2>
            
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  recording
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
              
              {voiceNote && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>Voice note recorded</span>
                </div>
              )}
            </div>
            
            {recording && (
              <div className="mt-4 flex items-center gap-2 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                <span>Recording... Click "Stop Recording" when done</span>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mt-2">
              Prefer to speak instead of type? Record a quick voice note with your brief.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Something went wrong</p>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={uploading || images.length === 0}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Uploading...
              </span>
            ) : (
              'Submit for Review'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            By submitting, you agree to let us create social media content based on your images and brief.
          </p>
        </form>
      </div>
    </div>
  )
}
