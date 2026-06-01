'use client'

import { useState } from 'react'

type QueueItem = {
  id: string
  client_name: string
  status: string
  created_at: string
}

export default function PostingQueueClient({ items }: { items: QueueItem[] }) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string>('')

  async function publishNow(submissionId: string) {
    setBusyId(submissionId)
    setMessage('')
    try {
      const res = await fetch('/api/client/posting/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission_id: submissionId,
          mode: 'post_now',
          platforms: ['instagram'],
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create posting jobs')
      setMessage(`Created ${data.jobs?.length || 0} posting job(s) for submission ${submissionId.slice(0, 8)}...`)
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
          No approved/completed submissions ready for manual posting yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Submission</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => publishNow(item.id)}
                      disabled={busyId === item.id}
                      className="rounded bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busyId === item.id ? 'Creating...' : 'Post now'}
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
