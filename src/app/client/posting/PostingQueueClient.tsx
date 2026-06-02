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
      setMessage(`Created posting job for post ${postId.slice(0, 8)}... - ${data.message || ''}`)
    } catch (e: any) {
      setMessage(`Error: ${e.message}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700">{message}</div>
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
                      'bg-blue-100 text-blue-700'
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
