'use client'

import { useState, useEffect } from 'react'

type PostItem = {
  id: string
  submission_id: string
  caption: string
  hashtags: string[]
  image_urls: string[]
  platform: string
  status: string
  scheduled_for?: string
  created_at: string
}

type Platform = {
  id: string
  name: string
  icon: string
  connected: boolean
  enabled: boolean
}

export default function PostingDashboard({ items }: { items: PostItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [selectedPosts, setSelectedPosts] = useState<string[]>([])
  const [scheduleDate, setScheduleDate] = useState<string>('')
  const [expandedSection, setExpandedSection] = useState<number>(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creating, setCreating] = useState(false)
  
  // New post form state
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [newPostImageUrl, setNewPostImageUrl] = useState<string>('')
  const [newPostCaption, setNewPostCaption] = useState<string>('')
  const [newPostHashtags, setNewPostHashtags] = useState<string>('')
  const [newPostPlatform, setNewPostPlatform] = useState<string>('instagram')
  const [newPostSchedule, setNewPostSchedule] = useState<string>('')
  
  // Platform definitions
  const platforms: Platform[] = [
    { id: 'instagram', name: 'Instagram', icon: '📸', connected: true, enabled: true },
    { id: 'tiktok', name: 'TikTok', icon: '🎵', connected: false, enabled: false },
    { id: 'youtube', name: 'YouTube', icon: '📺', connected: false, enabled: false },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼', connected: false, enabled: false },
    { id: 'facebook', name: 'Facebook', icon: '📘', connected: false, enabled: false },
    { id: 'x', name: 'X', icon: '𝕏', connected: false, enabled: false },
    { id: 'threads', name: 'Threads', icon: '🧵', connected: false, enabled: false },
    { id: 'pinterest', name: 'Pinterest', icon: '📌', connected: false, enabled: false },
    { id: 'reddit', name: 'Reddit', icon: '👽', connected: false, enabled: false },
    { id: 'bluesky', name: 'Bluesky', icon: '🦋', connected: false, enabled: false },
    { id: 'google', name: 'Google Business', icon: '🔍', connected: false, enabled: false },
  ]

  const draftCount = items.filter(p => p.status === 'draft').length
  const selectedCount = selectedPosts.length

  async function publishNow(postId: string) {
    setBusyId(postId)
    setMessage('')
    try {
      const res = await fetch('/api/client/posting/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: items.find(p => p.id === postId)?.submission_id || postId,
          post_ids: [postId],
          platforms: ['instagram'],
          mode: 'post_now',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create posting job')
      
      let successMsg = `✅ Created posting job for post ${postId.slice(0, 8)}...`
      if (data.integration_mode === 'live' && data.upload_results) {
        const result = data.upload_results.find((r: any) => r.post_id === postId)
        if (result?.success) {
          successMsg += ` - Live upload started!`
          if (result.instagram_url) {
            successMsg += ` View: ${result.instagram_url}`
          }
        } else if (result?.error) {
          successMsg += ` - Upload failed: ${result.error}`
        }
      } else if (data.message) {
        successMsg += ` - ${data.message}`
      }
      
      setMessage(successMsg)
    } catch (e: any) {
      setMessage(`❌ Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function scheduleSelected() {
    if (selectedPosts.length === 0) {
      setMessage('❌ No posts selected')
      return
    }

    if (!scheduleDate) {
      setMessage('❌ Please select a date and time')
      return
    }

    setMessage(`📅 Scheduling ${selectedPosts.length} posts...`)
    
    try {
      for (const postId of selectedPosts) {
        const res = await fetch(`/api/client/posts/${postId}/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduled_for: scheduleDate,
          }),
        })
        if (!res.ok) throw new Error(`Failed to schedule post ${postId}`)
      }

      setMessage(`✅ Scheduled ${selectedPosts.length} posts for ${new Date(scheduleDate).toLocaleString()}`)
      setSelectedPosts([])
      setScheduleDate('')
      
      setTimeout(() => window.location.reload(), 2000)
    } catch (e: any) {
      setMessage(`❌ Error: ${e.message}`)
    }
  }

  function togglePostSelection(postId: string) {
    setSelectedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  function toggleAllPosts() {
    if (selectedPosts.length === draftCount) {
      setSelectedPosts([])
    } else {
      setSelectedPosts(items.filter(p => p.status === 'draft').map(p => p.id))
    }
  }

  async function createPost() {
    if (!newPostCaption) {
      setMessage('❌ Caption is required')
      return
    }

    setCreating(true)
    setMessage('')

    try {
      // Upload image if provided
      let imageUrl = newPostImageUrl
      if (newPostImage) {
        const formData = new FormData()
        formData.append('image', newPostImage)
        formData.append('token', 'manual') // Will need to get actual token
        
        const uploadRes = await fetch('/api/upload/image', {
          method: 'POST',
          body: formData,
        })
        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          imageUrl = uploadData.url
        }
      }

      // Parse hashtags
      const hashtags = newPostHashtags
        .split(/\s+/)
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.replace(/[^#a-zA-Z0-9]/g, ''))

      // Create post
      const createRes = await fetch('/api/client/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: newPostCaption,
          hashtags: hashtags,
          image_urls: imageUrl ? [imageUrl] : [],
          platform: newPostPlatform,
          scheduled_for: newPostSchedule || null,
          status: newPostSchedule ? 'scheduled' : 'draft',
        }),
      })

      const createData = await createRes.json()
      if (!createRes.ok) throw new Error(createData.error || 'Failed to create post')

      setMessage('✅ Post created successfully!')
      setShowCreateModal(false)
      
      // Reset form
      setNewPostImage(null)
      setNewPostImageUrl('')
      setNewPostCaption('')
      setNewPostHashtags('')
      setNewPostPlatform('instagram')
      setNewPostSchedule('')
      
      // Refresh after 1.5 seconds
      setTimeout(() => window.location.reload(), 1500)
    } catch (e: any) {
      setMessage(`❌ Error: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Top Navigation */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
          <button className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md">
            Manual
          </button>
          <button className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-md">
            Shorts Uploader
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload to all platforms with one click</h1>
          <p className="mt-2 text-gray-600">
            Upload content to multiple social platforms and automate your posting workflows.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 shadow-sm"
        >
          + Create Post
        </button>
      </div>

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Main Form (70%) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Section 1: Set Up Core Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setExpandedSection(expandedSection === 1 ? 0 : 1)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50 rounded-t-xl"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Set up core content</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pick the profile, content source, and primary copy.
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                items.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {items.length > 0 ? `${items.length} posts ready` : 'Media pending'}
              </span>
            </button>
            
            {expandedSection === 1 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile
                    </label>
                    <select className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <option>No Label Academy</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Method
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input type="radio" name="uploadMethod" defaultChecked className="h-4 w-4 text-indigo-600" />
                        <span className="ml-3 text-sm text-gray-700">Use Existing Posts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Platform-Specific Settings */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setExpandedSection(expandedSection === 2 ? 0 : 2)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Platform-specific settings</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Enable each network and fine-tune channel options.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {platforms.filter(p => p.enabled).length} selected
              </span>
            </button>
            
            {expandedSection === 2 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map(platform => (
                    <div
                      key={platform.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        platform.enabled
                          ? 'border-indigo-600 bg-indigo-50'
                          : platform.connected
                          ? 'border-gray-200 hover:border-gray-300'
                          : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{platform.icon}</span>
                        {platform.connected ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Connected
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                            Not connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900">{platform.name}</p>
                      {platform.enabled && (
                        <input
                          type="checkbox"
                          defaultChecked
                          className="mt-2 h-4 w-4 text-indigo-600 rounded"
                          onChange={(e) => {
                            // Handle platform toggle
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Scheduling & Submission */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <button
              onClick={() => setExpandedSection(expandedSection === 3 ? 0 : 3)}
              className="w-full flex items-center justify-between p-6 hover:bg-gray-50"
            >
              <div className="text-left">
                <h2 className="text-lg font-semibold text-gray-900">Scheduling & submission</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Choose when to publish and finalize the request.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                {scheduleDate ? 'Scheduled' : 'Immediate'}
              </span>
            </button>
            
            {expandedSection === 3 && (
              <div className="px-6 pb-6 border-t border-gray-100 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <button
                  onClick={scheduleSelected}
                  disabled={selectedCount === 0 || !scheduleDate}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedCount > 0 
                    ? `Schedule ${selectedCount} Post${selectedCount !== 1 ? 's' : ''}`
                    : 'Select posts to schedule'}
                </button>
              </div>
            )}
          </div>

          {/* Message Display */}
          {message && (
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
              {message}
            </div>
          )}
        </div>

        {/* Right Column - Sticky Preview (30%) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-4">
            
            {/* Post Preview Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Post Preview</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Profile</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">No Label Academy</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Platforms</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {platforms.filter(p => p.enabled).map(p => (
                      <span key={p.id} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
                        {p.icon} {p.name}
                      </span>
                    ))}
                    {platforms.filter(p => p.enabled).length === 0 && (
                      <span className="text-sm text-gray-500">None selected</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {draftCount} draft{draftCount !== 1 ? 's' : ''} ready
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Scheduling</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {scheduleDate 
                      ? new Date(scheduleDate).toLocaleString()
                      : 'Immediate posting'}
                  </p>
                </div>
              </div>
            </div>

            {/* Selected Posts Summary */}
            {selectedCount > 0 && (
              <div className="bg-indigo-50 rounded-xl border border-indigo-200 p-6">
                <h4 className="text-sm font-semibold text-indigo-900 mb-3">
                  Selected Posts
                </h4>
                <p className="text-2xl font-bold text-indigo-600 mb-2">
                  {selectedCount}
                </p>
                <p className="text-xs text-indigo-700">
                  {scheduleDate 
                    ? `Will be scheduled for ${new Date(scheduleDate).toLocaleString()}`
                    : 'Ready to publish now'}
                </p>
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Posts</span>
                  <span className="text-sm font-medium text-gray-900">{items.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Draft</span>
                  <span className="text-sm font-medium text-gray-900">{draftCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Scheduled</span>
                  <span className="text-sm font-medium text-gray-900">
                    {items.filter(p => p.status === 'scheduled').length}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Published</span>
                  <span className="text-sm font-medium text-gray-900">
                    {items.filter(p => p.status === 'published').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="mt-8">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Your Posts</h3>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600">
                {selectedCount} of {draftCount} selected
              </label>
              <button
                onClick={toggleAllPosts}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedPosts.length === draftCount ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedPosts.length === draftCount && draftCount > 0}
                      onChange={toggleAllPosts}
                      className="h-4 w-4 text-indigo-600 rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Platform</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Caption</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No posts found. Posts are created during the submission review process.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedPosts.includes(item.id)}
                          onChange={() => togglePostSelection(item.id)}
                          disabled={item.status !== 'draft'}
                          className="h-4 w-4 text-indigo-600 rounded border-gray-300 disabled:opacity-50"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.image_urls && item.image_urls.length > 0 ? (
                          <img
                            src={item.image_urls[0]}
                            alt="Post thumbnail"
                            className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize">{item.platform}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          item.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                          item.status === 'published' ? 'bg-green-100 text-green-700' :
                          item.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {item.caption?.slice(0, 150) || 'No caption'}
                          {item.caption && item.caption.length > 150 && '...'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {new Date(item.created_at).toLocaleDateString()}
                        <br />
                        <span className="text-gray-400">
                          {new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => publishNow(item.id)}
                          disabled={busyId === item.id || item.status !== 'draft'}
                          className="rounded bg-indigo-600 px-3 py-1.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {busyId === item.id ? 'Posting...' : item.status === 'published' ? 'Published' : 'Post now'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    {/* Create Post Modal */}
    {showCreateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl">
            <h3 className="text-xl font-semibold text-gray-900">Create New Post</h3>
            <button
              onClick={() => setShowCreateModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {newPostImageUrl || newPostImage ? (
                  <div className="relative">
                    <img src={newPostImageUrl || URL.createObjectURL(newPostImage!)} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
                    <button onClick={() => { setNewPostImage(null); setNewPostImageUrl(''); }} className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <div>
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="mt-2 text-sm text-gray-600">Drop an image here or click to upload</p>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setNewPostImage(file); setNewPostImageUrl(URL.createObjectURL(file)); } }} className="mt-4" />
                  </div>
                )}
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select value={newPostPlatform} onChange={(e) => setNewPostPlatform(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="tiktok">TikTok</option>
                <option value="x">X (Twitter)</option>
              </select>
            </div>

            {/* Caption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Caption *</label>
              <textarea value={newPostCaption} onChange={(e) => setNewPostCaption(e.target.value)} rows={6} placeholder="Write your caption here..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <p className="mt-1 text-xs text-gray-500">{newPostCaption.length} / 2200 characters</p>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hashtags</label>
              <textarea value={newPostHashtags} onChange={(e) => setNewPostHashtags(e.target.value)} rows={3} placeholder="#barber #haircut #style" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Schedule (Optional)</label>
              <input type="datetime-local" value={newPostSchedule} onChange={(e) => setNewPostSchedule(e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              <p className="mt-1 text-xs text-gray-500">Leave empty to save as draft</p>
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-xl">
            <button onClick={() => setShowCreateModal(false)} className="flex-1 rounded-lg border border-gray-300 px-6 py-3 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
            <button onClick={createPost} disabled={creating || !newPostCaption} className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {creating ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
