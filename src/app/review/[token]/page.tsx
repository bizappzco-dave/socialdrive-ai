'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Heart, Trash2, CheckCircle, Download, AlertCircle, Loader2, PlayCircle } from 'lucide-react'

interface Post {
  id: string
  caption_text: string
  image_url: string
  video_url?: string | null
  post_type?: 'image' | 'carousel' | 'video'
  caption_style: string
  selected: boolean
  hashtags: string[]
  emoji_count: number
}

interface Submission {
  id: string
  client_id: string
  client_name: string
  status: string
  post_count: number
}

export default function ReviewPage() {
  const params = useParams()
  const token = params.token as string
  
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadSubmission()
  }, [token])

  async function loadSubmission() {
    try {
      // Get submission info
      const subResponse = await fetch(`/api/submissions/review/${token}`)
      const subData = await subResponse.json()
      
      if (!subResponse.ok) {
        throw new Error(subData.error || 'Invalid review link')
      }
      
      setSubmission(subData)
      
      // Get posts for this submission
      const postsResponse = await fetch(`/api/submissions/${subData.id}/posts`)
      const postsData = await postsResponse.json()
      
      if (!postsResponse.ok) {
        throw new Error(postsData.error || 'Failed to load posts')
      }
      
      setPosts(postsData)
      
    } catch (err: any) {
      console.error('Failed to load submission:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSelectPost(postId: string, currentlySelected: boolean) {
    try {
      const response = await fetch(`/api/posts/${postId}/select`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selected: !currentlySelected,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to update post')
      }
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, selected: !currentlySelected }
          : p
      ))
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function deletePost(postId: string) {
    if (!confirm('Delete this post? This cannot be undone.')) return
    
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete post')
      }
      
      // Remove from local state immediately (don't wait for reload)
      setPosts(posts.filter(p => p.id !== postId))
      
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleReadyForPosting() {
    const selectedPosts = posts.filter(p => p.selected)
    
    if (selectedPosts.length === 0) {
      setError('Please select at least one post to continue')
      return
    }
    
    setProcessing(true)
    setError(null)
    
    try {
      // Mark submission as approved
      const response = await fetch(`/api/submissions/${submission?.id}/approve`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to approve submission')
      }
      
      // Download CSV (pass submissionId to filter correctly)
      const csvResponse = await fetch(`/api/export/sociamonials?clientId=${submission?.client_id}&submissionId=${submission?.id}&scheduleType=random`)
      
      if (!csvResponse.ok) {
        throw new Error('Failed to generate CSV')
      }
      
      // Trigger download
      const blob = await csvResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sociamonials_import_${submission?.client_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      alert('✅ Posts approved! CSV downloaded. Upload it to Sociamonials to publish.')
      
    } catch (err: any) {
      console.error('Approval failed:', err)
      setError(err.message)
    } finally {
      setProcessing(false)
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
            Please contact us to get a new review link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Reviewing as {submission?.client_name}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Review Your Posts
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            Select your favorite posts by clicking the heart icon. Delete any you don't want, then click "Ready for Posting" to export.
          </p>
          
          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <Heart className="h-4 w-4 text-blue-600 fill-blue-600" />
              <span className="font-medium text-gray-700">{posts.filter(p => p.selected).length} selected</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200">
              <span className="font-medium text-gray-700">{posts.length} total</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Something went wrong</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <p className="text-gray-600">No posts generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
                  post.selected
                    ? 'border-blue-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Media */}
                <div className="aspect-square relative overflow-hidden rounded-t-lg bg-gray-100">
                  {post.post_type === 'video' || post.post_type === 'carousel' ? (
                    post.video_url ? (
                      <>
                        {post.post_type === 'video' ? (
                          <video
                            src={post.video_url}
                            controls
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={post.video_url}
                            alt="Carousel"
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <PlayCircle className="h-16 w-16 text-white/80" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <p>Media generating...</p>
                      </div>
                    )
                  ) : (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Selection Button */}
                  <button
                    onClick={() => toggleSelectPost(post.id, post.selected)}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all z-10 ${
                      post.selected
                        ? 'bg-blue-500 text-white scale-110'
                        : 'bg-white/90 text-gray-400 hover:text-blue-500'
                    }`}
                  >
                    <Heart className={`h-6 w-6 ${post.selected ? 'fill-current' : ''}`} />
                  </button>
                  
                  {/* Style Badge */}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-full text-gray-700 z-10">
                    {post.caption_style.replace(/_/g, ' ')}
                  </div>
                  
                  {/* Type Badge */}
                  {(post.post_type === 'video' || post.post_type === 'carousel') && (
                    <div className="absolute bottom-3 left-3 bg-purple-600/90 backdrop-blur text-xs font-medium px-2 py-1 rounded-full text-white z-10">
                      {post.post_type === 'video' ? '🎬 Video' : '🎠 Carousel'}
                    </div>
                  )}
                </div>
                
                {/* Caption */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-4 mb-3">
                    {post.caption_text}
                  </p>
                  
                  {/* Hashtags */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {post.hashtags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      {post.emoji_count} emojis • {post.hashtags?.length || 0} hashtags
                    </div>
                    
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Delete this post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 sticky bottom-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">
                {posts.filter(p => p.selected).length} of {posts.length} posts selected
              </p>
              <p className="text-xs text-gray-500">
                Delete unwanted posts, then export your selection
              </p>
            </div>
            
            <button
              onClick={handleReadyForPosting}
              disabled={posts.filter(p => p.selected).length === 0 || processing}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
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
