'use client'

import { useState, useRef } from 'react'

type CaptionVariation = {
  id: string
  text: string
  selected: boolean
}

type ImageWithCaptions = {
  file: File | null
  url: string
  message: string
  captionVariations: CaptionVariation[]
}

export default function UploadPage() {
  const [step, setStep] = useState<'upload' | 'captions' | 'schedule' | 'done'>('upload')
  const [images, setImages] = useState<ImageWithCaptions[]>([])
  const [clientMessage, setClientMessage] = useState('')
  const [scheduleType, setScheduleType] = useState<'mwf' | 'daily'>('mwf')
  const [isGenerating, setIsGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const newImages: ImageWithCaptions[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      message: '',
      captionVariations: [],
    }))

    setImages(newImages)
    setStep('captions')
  }

  // Generate AI captions for all images
  const generateCaptions = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/public/generate-captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map(img => ({ message: img.message })),
          variations_per_image: 3,
        }),
      })

      const data = await response.json()
      
      if (data.variations) {
        setImages(prev => prev.map((img, idx) => ({
          ...img,
          captionVariations: data.variations[idx]?.map((text: string, varIdx: number) => ({
            id: `img-${idx}-var-${varIdx}`,
            text,
            selected: false,
          })) || [],
        })))
      }
    } catch (error) {
      console.error('Failed to generate captions:', error)
      alert('Failed to generate captions. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Toggle caption selection
  const toggleCaption = (imageIdx: number, variationIdx: number) => {
    setImages(prev => prev.map((img, imgIdx) => {
      if (imgIdx !== imageIdx) return img
      
      // Deselect all other captions for this image
      const newVariations = img.captionVariations.map((var_, varIdx) => ({
        ...var_,
        selected: varIdx === variationIdx,
      }))
      
      return { ...img, captionVariations: newVariations }
    }))
  }

  // Submit and schedule
  const handleSubmit = async () => {
    // Validate: each image must have a selected caption
    const hasAllSelected = images.every(img => 
      img.captionVariations.some(v => v.selected)
    )

    if (!hasAllSelected) {
      alert('Please select a caption for each image')
      return
    }

    try {
      const selectedCaptions = images.map(img => 
        img.captionVariations.find(v => v.selected)?.text || ''
      )

      const response = await fetch('/api/public/schedule-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.map((img, idx) => ({
            message: img.message,
            caption: selectedCaptions[idx],
          })),
          schedule_type: scheduleType,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setStep('done')
      } else {
        alert(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Failed to schedule posts:', error)
      alert('Failed to schedule posts. Please try again.')
    }
  }

  // Step 1: Upload
  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Social Media Posts
            </h1>
            <p className="text-gray-600">
              Upload your images and we'll generate perfect captions automatically
            </p>
          </div>

          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-indigo-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Click to upload or drag and drop
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Upload 3-5 images for your social media posts
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, GIF up to 10MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">How it works:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Upload your images (3-5 recommended)</li>
              <li>Add a message about each image</li>
              <li>AI generates 3 caption options per image</li>
              <li>Pick your favorite caption for each</li>
              <li>We auto-schedule your posts (Mon/Wed/Fri or daily)</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  // Step 2: Add messages & generate captions
  if (step === 'captions' && images.every(img => img.captionVariations.length === 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Tell Us About Your Images
            </h1>
            <p className="text-gray-600">
              Add a brief message for each image so we can generate relevant captions
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {images.map((img, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src={img.url} 
                    alt={`Upload ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Image {idx + 1} - What's this about?
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="E.g., 'This is our new product launch - eco-friendly water bottle'"
                      value={img.message}
                      onChange={(e) => {
                        const newImages = [...images]
                        newImages[idx].message = e.target.value
                        setImages(newImages)
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep('upload')}
              className="px-6 py-3 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              onClick={generateCaptions}
              disabled={isGenerating || images.some(img => !img.message.trim())}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating Captions...' : `Generate ${images.length * 3} Caption Options`}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 3: Pick favorite captions (after generation)
  if (step === 'captions' && images.some(img => img.captionVariations.length > 0)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Pick Your Favorite Captions
            </h1>
            <p className="text-gray-600">
              Select the best caption for each image
            </p>
          </div>

          <div className="space-y-6 mb-8">
            {images.map((img, imgIdx) => (
              <div key={imgIdx} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start space-x-4 mb-4">
                  <img 
                    src={img.url} 
                    alt={`Image ${imgIdx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Image {imgIdx + 1}</h3>
                    <p className="text-sm text-gray-600">{img.message}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {img.captionVariations.map((variation, varIdx) => (
                    <label
                      key={variation.id}
                      className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        variation.selected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name={`caption-${imgIdx}`}
                          checked={variation.selected}
                          onChange={() => toggleCaption(imgIdx, varIdx)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{variation.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Option {varIdx + 1}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={() => setStep('captions')}
              className="px-6 py-3 text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep('schedule')}
              disabled={!images.every(img => img.captionVariations.some(v => v.selected))}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Schedule →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 4: Schedule settings
  if (step === 'schedule') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Schedule Your Posts
          </h1>

          <div className="space-y-4 mb-8">
            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === 'mwf'}
                onChange={() => setScheduleType('mwf')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Mon/Wed/Fri at 10am</p>
                <p className="text-xs text-gray-500">Perfect for {images.length} posts per week</p>
              </div>
            </label>

            <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="scheduleType"
                checked={scheduleType === 'daily'}
                onChange={() => setScheduleType('daily')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Daily at 10am</p>
                <p className="text-xs text-gray-500">One post per day for {images.length} days</p>
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSubmit}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
            >
              Schedule {images.length} Posts
            </button>
            <button
              onClick={() => setStep('captions')}
              className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Step 5: Done
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            All Done!
          </h1>
          <p className="text-gray-600 mb-6">
            Your {images.length} posts have been scheduled successfully.
          </p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              {scheduleType === 'mwf' 
                ? 'Posting on Mon/Wed/Fri at 10am' 
                : 'Posting daily at 10am'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
          >
            Create More Posts
          </button>
        </div>
      </div>
    )
  }

  return null
}
