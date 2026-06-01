'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Clock, CheckCircle, Loader2, AlertCircle, ExternalLink, Trash2 } from 'lucide-react'

interface Submission {
  id: string
  client_name: string
  client_id: string
  status: string
  post_count: number
  created_at: string
  submitted_at: string | null
  generated_at: string | null
  approved_at: string | null
  review_token: string
  upload_token: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      const response = await fetch('/api/agency/submissions')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load submissions')
      }
      
      setSubmissions(data)
    } catch (err: any) {
      console.error('Failed to load submissions:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteSubmission(id: string) {
    if (!confirm('Delete this submission? This will remove all generated posts and images. This cannot be undone.')) {
      return
    }
    
    setDeleting(id)
    try {
      const response = await fetch(`/api/agency/submissions/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete submission')
      }
      
      // Remove from list
      setSubmissions(prev => prev.filter(sub => sub.id !== id))
      console.log('✓ Submission deleted:', id)
    } catch (err: any) {
      console.error('Delete failed:', err)
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeleting(null)
    }
  }

  function getStatusBadge(status: string) {
    const badges: Record<string, { color: string; icon: any; label: string }> = {
      pending: { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Pending Upload' },
      uploaded: { color: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'Generating' },
      generating: { color: 'bg-blue-100 text-blue-700', icon: Loader2, label: 'Generating' },
      ready: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Ready for Review' },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Completed' },
      approved: { color: 'bg-purple-100 text-purple-700', icon: CheckCircle, label: 'Approved' },
      error: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Error' },
    }

    const badge = badges[status] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="h-3 w-3" />
        {badge.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Failed to load submissions</p>
          <p className="text-gray-600 text-sm mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Submissions</h1>
              <p className="text-gray-600 mt-1">Monitor client uploads and AI generation</p>
            </div>
            <Link
              href="/agency/clients"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              ← Back to Clients
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">No submissions yet</p>
            <Link
              href="/agency/clients"
              className="text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block"
            >
              Create your first upload link →
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Posts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sub.client_name}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {sub.post_count || 0} posts
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sub.submitted_at ? (
                        <div className="text-sm text-gray-900">
                          {new Date(sub.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {(sub.status === 'ready' || sub.status === 'completed') && sub.post_count > 0 && (
                          <Link
                            href={`/review/${sub.review_token}`}
                            className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                          >
                            View
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        {sub.status === 'approved' && (
                          <span className="text-gray-500">Completed</span>
                        )}
                        {(sub.status === 'pending' || sub.status === 'uploaded' || sub.status === 'generating') && (
                          <span className="text-gray-400">Waiting...</span>
                        )}
                        {sub.status === 'error' && (
                          <button
                            onClick={() => deleteSubmission(sub.id)}
                            className="text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
                            disabled={deleting === sub.id}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                        {sub.status !== 'error' && (
                          <button
                            onClick={() => deleteSubmission(sub.id)}
                            className="text-gray-400 hover:text-red-600 font-medium inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={deleting === sub.id}
                            title="Delete submission"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
