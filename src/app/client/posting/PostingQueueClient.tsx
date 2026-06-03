'use client'

import { useState } from 'react'

type PostItem = {
  id: string
  submission_id: string
  caption: string
  hashtags: string[]
  image_urls: string[]
  platform: string
  status: string
  created_at: string
}

export default function PostingQueueClient({ items }: { items: PostItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleType, setScheduleType] = useState<'mwf' | 'daily'>('mwf')
  const [platformFilter, setPlatformFilter] = useState<string>('all')
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null)
  
  // Filter items by platform
  const filteredItems = items.filter(item => 
    platformFilter === 'all' ? true : item.platform === platformFilter
  )
  
  // Get unique platforms for filter dropdown
  const platforms = ['all', ...Array.from(new Set(items.map(item => item.platform)))]

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
      
      let successMsg = `Created posting job for post ${postId.slice(0, 8)}...`
      if (data.integration_mode === 'live' && data.upload_results) {
        const result = data.upload_results.find((r: any) => r.post_id === postId)
        if (result?.success) {
          successMsg += ` - Live upload started! Request ID: ${result.request_id?.slice(0, 8)}...`
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
      setMessage(`Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  async function scheduleAll() {
    const draftPosts = items.filter(p => p.status === 'draft')
    if (draftPosts.length === 0) {
      setMessage('No draft posts to schedule')
      return
    }

    setMessage(`Scheduling ${draftPosts.length} posts...`)
    
    try {
      const now = new Date()
      const scheduledDates: string[] = []
      
      if (scheduleType === 'mwf') {
        // Mon/Wed/Fri at 10am
        let scheduled = new Date(now)
        scheduled.setHours(10, 0, 0, 0)
        
        for (let i = 0; i < draftPosts.length; i++) {
          // Find next Mon/Wed/Fri
          let day = scheduled.getDay()
          while (day !== 1 && day !== 3 && day !== 5) {
            scheduled.setDate(scheduled.getDate() + 1)
            day = scheduled.getDay()
          }
          scheduledDates.push(scheduled.toISOString())
          scheduled.setDate(scheduled.getDate() + 2) // Skip to next Mon/Wed/Fri
        }
      } else {
        // Daily at 10am
        for (let i = 0; i < draftPosts.length; i++) {
          const scheduled = new Date(now)
          scheduled.setDate(scheduled.getDate() + i)
          scheduled.setHours(10, 0, 0, 0)
          scheduledDates.push(scheduled.toISOString())
        }
      }

      // Update each post with scheduled date
      for (let i = 0; i < draftPosts.length; i++) {
        const res = await fetch(`/api/client/posts/${draftPosts[i].id}/schedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduled_for: scheduledDates[i],
          }),
        })
        if (!res.ok) throw new Error(`Failed to schedule post ${draftPosts[i].id}`)
      }

      setMessage(`✅ Scheduled ${draftPosts.length} posts (${scheduleType === 'mwf' ? 'Mon/Wed/Fri' : 'Daily'} at 10am)`)
      setShowScheduleModal(false)
      
      // Refresh page after 2 seconds
      setTimeout(() => window.location.reload(), 2000)
      
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    }
  }

  const draftCount = items.filter(p => p.status === 'draft').length

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">{message}</div>
      )}

      {/* Bulk Actions */}
      {draftCount > 0 && (
        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-900">{draftCount} draft post{draftCount !== 1 ? 's' : ''} ready</p>
            <p className="text-xs text-gray-500">Schedule all posts automatically</p>
          </div>
          <button
            onClick={() => setShowScheduleModal(true)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Schedule All
          </button>
        </div>
      )}

      {/* Filters */}
      {items.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Filter by platform:</label>
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform === 'all' ? 'All Platforms' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-600">
              Showing {filteredItems.length} of {items.length} posts
            </p>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Posts</h3>
            <p className="text-sm text-gray-600 mb-4">
              How would you like to schedule {draftCount} post{draftCount !== 1 ? 's' : ''}?
            </p>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === 'mwf'}
                  onChange={() => setScheduleType('mwf')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Mon/Wed/Fri at 10am</p>
                  <p className="text-xs text-gray-500">Perfect for 3 posts per week</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="scheduleType"
                  checked={scheduleType === 'daily'}
                  onChange={() => setScheduleType('daily')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Daily at 10am</p>
                  <p className="text-xs text-gray-500">One post per day until all are scheduled</p>
                </div>
              </label>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={scheduleAll}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Schedule Posts
              </button>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No posts found. Posts are created during the submission review process.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Image</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Caption</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  {/* Image Thumbnail */}
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
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.caption?.slice(0, 150) || 'No caption'}
                        {item.caption && item.caption.length > 150 && '...'}
                      </p>
                      {item.hashtags && item.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.hashtags.slice(0, 3).map((tag: string, i: number) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                          {item.hashtags.length > 3 && (
                            <span className="text-xs text-gray-400">+{item.hashtags.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(item.created_at).toLocaleDateString()}
                    <br />
                    <span className="text-gray-400">{new Date(item.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => publishNow(item.id)}
                      disabled={busyId === item.id || item.status === 'published'}
                      className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {busyId === item.id ? (
                        <span className="flex items-center gap-1">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Posting...
                        </span>
                      ) : item.status === 'published' ? (
                        'Published'
                      ) : (
                        'Post now'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
