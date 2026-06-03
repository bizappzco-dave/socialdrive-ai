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
                <th className="px-4 py-3 text-left font-medium text-gray-600">Post ID</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Platform</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Caption Preview</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 font-mono text-xs">{item.id.slice(0, 8)}...</td>
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
                  <td className="px-4 py-3 max-w-xs truncate text-xs text-gray-600">
                    {item.caption?.slice(0, 80) || 'No caption'}
                  </td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => publishNow(item.id)}
                      disabled={busyId === item.id || item.status === 'published'}
                      className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busyId === item.id ? 'Creating...' : item.status === 'published' ? 'Published' : 'Post now'}
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
