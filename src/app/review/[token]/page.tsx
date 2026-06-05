'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Heart, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react'

interface Post {
  id: string
  caption: string
  hashtags: string[]
  image_urls: string[]
  status: string
}

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submission, setSubmission] = useState<{
    id: string
    client_id: string
    client_name: string
    brief_text?: string
    posts: Post[]
  } | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showAllText, setShowAllText] = useState(false)  // For full text view

  useEffect(() => {
    loadSubmission()
  }, [])

  async function loadSubmission() {
    try {
      const response = await fetch(`/api/submissions/review/${params.token}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load submission')
      }
      
      console.log('=== REVIEW PAGE DEBUG ===')
      console.log('brief_text from API:', data.submission.brief_text)
      console.log('brief_text length:', data.submission.brief_text?.length)
      console.log('Number of posts:', data.submission.posts?.length)
      if (data.submission.posts?.length > 0) {
        console.log('First caption preview:', data.submission.posts[0].caption.substring(0, 100))
      }
      console.log('========================')
      
      setSubmission(data.submission)
    } catch (err: any) {
      console.error('Failed to load submission:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleFavorite(postId: string) {
    setFavorites(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    )
  }

  async function handleSubmit() {
    if (favorites.length === 0) {
      setError('Please select at least one favorite')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`/api/submissions/review/${params.token}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          favoritePostIds: favorites,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule posts')
      }

      // Redirect to success page
      router.push(`/review/success?count=${favorites.length}`)
    } catch (err: any) {
      console.error('Failed to schedule posts:', err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your posts...</p>
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
            This review link may have expired or is incorrect.
          </p>
        </div>
      </div>
    )
  }

  if (!submission) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Review for {submission.client_name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Review Your Posts
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Select your favorite versions by clicking the heart icon. We'll schedule the ones you choose.
          </p>
        </div>

        {/* Stats */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">
                {submission.posts.length} posts generated
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Select your favorites to schedule
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{favorites.length}</p>
              <p className="text-xs text-blue-600">selected</p>
            </div>
          </div>
        </div>

        {/* View All Text Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowAllText(!showAllText)}
            className="w-full bg-white border-2 border-blue-200 hover:border-blue-400 text-blue-700 font-semibold py-3 px-6 rounded-lg transition-all"
          >
            {showAllText ? '👁️ Hide Full Text View' : '📄 Show All Captions (Full Text)'}
          </button>
        </div>

        {/* Full Text View */}
        {showAllText && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📋 All Captions (Full Text)</h3>
            <div className="space-y-4">
              {submission.posts.map((post, index) => (
                <div key={post.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Post {index + 1}</span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-line">{post.caption}</p>
                  <p className="text-gray-500 text-xs mt-2">Hashtags: {post.hashtags?.join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {submission.posts.map((post, index) => (
            <div
              key={post.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
                favorites.includes(post.id)
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Image */}
              <div className="aspect-square bg-gray-100 rounded-t-xl overflow-hidden">
                {post.image_urls && post.image_urls.length > 0 ? (
                  <img
                    src={post.image_urls[0]}
                    alt={`Post ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Caption Preview */}
                <div className="mb-4">
                  <p className="text-sm text-gray-900 line-clamp-3">{post.caption}</p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      {post.hashtags.slice(0, 3).join(' ')}
                      {post.hashtags.length > 3 && ` +${post.hashtags.length - 3} more`}
                    </p>
                  )}
                </div>

                {/* Favorite Button */}
                <button
                  type="button"
                  onClick={() => toggleFavorite(post.id)}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    favorites.includes(post.id)
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Heart
                    className={`h-5 w-5 ${
                      favorites.includes(post.id) ? 'fill-white' : ''
                    }`}
                  />
                  {favorites.includes(post.id) ? 'Selected' : 'Select'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Submit Button */}
        <div className="sticky bottom-4 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {favorites.length} post{favorites.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-gray-500">
                These will be scheduled for automatic posting
              </p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={favorites.length === 0 || submitting}
              className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                favorites.length === 0 || submitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Ready for Posting
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
