'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UploadPage() {
  const supabase = createClient()
  const [activeSection, setActiveSection] = useState<'content' | 'platforms' | 'schedule'>('content')
  
  // Form state
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'text'>('file')
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [firstComment, setFirstComment] = useState('')
  const [mediaUrls, setMediaUrls] = useState<string[]>([])
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram'])
  const [asyncUpload, setAsyncUpload] = useState(true)
  const [scheduledDate, setScheduledDate] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [addToQueue, setAddToQueue] = useState(false)

  // Platform connection status (would fetch from DB in real app)
  const platforms = [
    { id: 'tiktok', name: 'TikTok', connected: false, icon: '🎵' },
    { id: 'instagram', name: 'Instagram', connected: true, icon: '📸' },
    { id: 'youtube', name: 'YouTube', connected: false, icon: '📹' },
    { id: 'linkedin', name: 'LinkedIn', connected: false, icon: '💼' },
    { id: 'facebook', name: 'Facebook', connected: false, icon: '📘' },
    { id: 'x', name: 'X', connected: false, icon: '𝕏' },
    { id: 'threads', name: 'Threads', connected: false, icon: '🧵' },
    { id: 'pinterest', name: 'Pinterest', connected: false, icon: '📌' },
    { id: 'reddit', name: 'Reddit', connected: false, icon: '👽' },
    { id: 'bluesky', name: 'Bluesky', connected: false, icon: '🦋' },
    { id: 'google_business', name: 'Google Business', connected: false, icon: '🏢' },
  ]

  const handlePlatformToggle = (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId)
    if (!platform?.connected) return
    
    setSelectedPlatforms(prev => 
      prev.includes(platformId) 
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    )
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/client/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          caption,
          first_comment: firstComment,
          media_urls: mediaUrls,
          platforms: selectedPlatforms,
          upload_method: uploadMethod,
          async_upload: asyncUpload,
          scheduled_date: scheduledDate || null,
          timezone,
          add_to_queue: addToQueue,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        // Redirect to posting dashboard
        window.location.href = '/client/posting'
      } else {
        alert(`Error: ${result.error || 'Failed to create post'}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to create post. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 py-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-2 bg-white rounded-md text-sm font-medium text-gray-900 shadow-sm">
                Manual
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                Shorts Uploader
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Upload to all platforms with one click
        </h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          Upload content to multiple social platforms simultaneously and automate your social media workflows.
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Main Form (70%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Set Up Core Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveSection('content')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">1</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Set up core content</h3>
                    <p className="text-sm text-gray-500">Pick the profile, content source, and primary copy.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                    Media pending
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {activeSection === 'content' && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                  {/* Profile Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile
                    </label>
                    <select className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                      <option>Taskifi-AI</option>
                    </select>
                  </div>

                  {/* Upload Method */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Method
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="uploadMethod"
                          checked={uploadMethod === 'file'}
                          onChange={() => setUploadMethod('file')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Upload Media File</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="uploadMethod"
                          checked={uploadMethod === 'url'}
                          onChange={() => setUploadMethod('url')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Use Media URL(s)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="uploadMethod"
                          checked={uploadMethod === 'text'}
                          onChange={() => setUploadMethod('text')}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700">Text-Only Post</span>
                      </label>
                    </div>
                  </div>

                  {/* Media Upload */}
                  {uploadMethod === 'file' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Media Files
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-500 transition-colors cursor-pointer">
                        <div className="space-y-1 text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <div className="flex text-sm text-gray-600">
                            <span className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                              Upload a file
                            </span>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4 up to 100MB</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadMethod === 'url' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Media URLs
                      </label>
                      <textarea
                        rows={3}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="https://example.com/image.jpg (one URL per line)"
                        value={mediaUrls.join('\n')}
                        onChange={(e) => setMediaUrls(e.target.value.split('\n').filter(url => url.trim()))}
                      />
                    </div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title / Caption
                    </label>
                    <textarea
                      rows={3}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Write your caption here..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                    />
                  </div>

                  {/* First Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Comment (optional)
                    </label>
                    <textarea
                      rows={2}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      placeholder="Auto-post as first comment..."
                      value={firstComment}
                      onChange={(e) => setFirstComment(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Section 2: Platform-Specific Settings */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveSection('platforms')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">2</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Platform-specific settings</h3>
                    <p className="text-sm text-gray-500">Enable each network and fine-tune channel options.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {selectedPlatforms.length} selected
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {activeSection === 'platforms' && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {platforms.map((platform) => (
                      <div
                        key={platform.id}
                        className={`relative p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          selectedPlatforms.includes(platform.id)
                            ? 'border-indigo-500 bg-indigo-50'
                            : platform.connected
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                        }`}
                        onClick={() => handlePlatformToggle(platform.id)}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-2">{platform.icon}</div>
                          <div className="text-sm font-medium text-gray-900">{platform.name}</div>
                          <div className="mt-2">
                            {platform.connected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                ✓ Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Not connected
                              </span>
                            )}
                          </div>
                          {platform.connected && (
                            <input
                              type="checkbox"
                              checked={selectedPlatforms.includes(platform.id)}
                              onChange={() => {}}
                              className="absolute top-3 right-3 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: Scheduling & Submission */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveSection('schedule')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">3</span>
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Scheduling & submission</h3>
                    <p className="text-sm text-gray-500">Choose when to publish and finalize the request.</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    Immediate
                  </span>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {activeSection === 'schedule' && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                  {/* Async Upload */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="asyncUpload"
                      checked={asyncUpload}
                      onChange={(e) => setAsyncUpload(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="asyncUpload" className="ml-2 block text-sm text-gray-700">
                      Async Upload (process in background)
                    </label>
                  </div>

                  {/* Schedule Post */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Schedule Post
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                    />
                  </div>

                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="Europe/Dublin">Europe/Dublin</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                    </select>
                  </div>

                  {/* Add to Queue */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="addToQueue"
                      checked={addToQueue}
                      onChange={(e) => setAddToQueue(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="addToQueue" className="ml-2 block text-sm text-gray-700">
                      Add to Queue (next available slot)
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                  >
                    Upload to Platforms
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Right Column - Sticky Preview Panel (30%) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Preview</h3>
                
                <div className="space-y-4">
                  {/* Profile Info */}
                  <div className="flex items-center space-x-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">TA</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">Taskifi-AI</div>
                      <div className="text-xs text-gray-500">
                        {selectedPlatforms.length} platform{selectedPlatforms.length !== 1 ? 's' : ''} selected
                      </div>
                    </div>
                  </div>

                  {/* Selected Platforms */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Platforms
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedPlatforms.map(platformId => {
                        const platform = platforms.find(p => p.id === platformId)
                        return platform ? (
                          <span key={platformId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {platform.icon} {platform.name}
                          </span>
                        ) : null
                      })}
                    </div>
                  </div>

                  {/* Content Type */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Content Type
                    </div>
                    <div className="text-sm text-gray-900">
                      {uploadMethod === 'text' ? 'Text-only' : uploadMethod === 'url' ? 'Media URLs' : 'File Upload'}
                    </div>
                  </div>

                  {/* Scheduling */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Schedule
                    </div>
                    <div className="text-sm text-gray-900">
                      {scheduledDate ? new Date(scheduledDate).toLocaleString() : 'Immediate'}
                    </div>
                  </div>

                  {/* Title Preview */}
                  {title && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Title Preview
                      </div>
                      <div className="text-sm text-gray-900 line-clamp-2">{title}</div>
                    </div>
                  )}

                  {/* Caption Preview */}
                  {caption && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                        Caption Preview
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-3">{caption}</div>
                    </div>
                  )}

                  {/* Media Preview */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Media Preview
                    </div>
                    {mediaUrls.length > 0 ? (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        <img src={mediaUrls[0]} alt="Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">
                        Add media to see preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
