'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Check, Download, Loader2, Upload, Settings, Sparkles } from 'lucide-react'

interface Post {
  id: string
  caption_text: string
  image_url: string
  selected: boolean
  rss_added: boolean
  scheduled_for?: string
  generated_at: string
}

interface Client {
  id: string
  name: string
  industry?: string
  drive_folder_url?: string
}

interface ClientPreferences {
  preferred_days?: number[]
  preferred_hours?: string[]
}

export default function ClientDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [preferences, setPreferences] = useState<ClientPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadClientData()
  }, [clientId])

  async function loadClientData() {
    try {
      const supabase = createClient()
      
      // Load client info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()
      
      if (clientError) throw clientError
      setClient(clientData)
      
      // Load preferences
      const { data: prefData } = await supabase
        .from('client_preferences')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      setPreferences(prefData)
      
      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .eq('deleted', false)
        .order('generated_at', { ascending: false })
      
      if (postsError) throw postsError
      setPosts(postsData || [])
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleSelectPost(postId: string, currentlySelected: boolean) {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('posts')
        .update({ 
          selected: !currentlySelected,
          selected_at: !currentlySelected ? new Date().toISOString() : null
        })
        .eq('id', postId)
      
      if (error) throw error
      
      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, selected: !currentlySelected }
          : p
      ))
    } catch (err: any) {
      setError(err.message)
    }
  }

  async function handleApproveForPosting() {
    setProcessing(true)
    setSuccess(null)
    setError(null)
    
    try {
      const selectedPosts = posts.filter(p => p.selected)
      
      if (selectedPosts.length === 0) {
        throw new Error('No posts selected')
      }
      
      const supabase = createClient()
      
      // Generate CSV via API
      const params = new URLSearchParams({
        clientId,
        scheduleType: preferences?.preferred_days ? 'specific' : 'random',
      })
      
      const response = await fetch(`/api/export/sociamonials?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate CSV')
      }
      
      // Get CSV blob
      const blob = await response.blob()
      const csvContent = await blob.text()
      
      // Save to Google Drive (if configured)
      if (client?.drive_folder_url) {
        // TODO: Upload to Google Drive
        // For now, mark posts as approved
      }
      
      // Mark posts as approved/rss_added
      const postIds = selectedPosts.map(p => p.id)
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          rss_added: true,
          rss_added_at: new Date().toISOString(),
        })
        .in('id', postIds)
      
      if (updateError) throw updateError
      
      // Download CSV automatically
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sociamonials_import_${client?.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      setSuccess(`✅ ${selectedPosts.length} posts approved! CSV downloaded. Upload to Sociamonials to publish.`)
      
      // Reload posts
      await loadClientData()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setProcessing(false)
    }
  }

  const selectedCount = posts.filter(p => p.selected).length
  const approvedCount = posts.filter(p => p.rss_added).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <Link 
                href="/dashboard"
                className="text-sm text-blue-600 hover:underline mb-2 block"
              >
                ← Back to Dashboard
              </Link>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-gray-900">{client?.name}</h1>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/${clientId}/generate`}
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 transition-colors font-medium"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Posts
                  </Link>
                  <Link
                    href={`/dashboard/${clientId}/preferences`}
                    className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Preferences
                  </Link>
                </div>
              </div>
              {client?.industry && (
                <p className="text-gray-600 mt-1">{client.industry}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-blue-600">{selectedCount}</span> selected
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-green-600">{approvedCount}</span> approved
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Action Bar */}
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Content Library</h2>
              <p className="text-sm text-gray-600">
                Select posts and approve for posting
              </p>
            </div>
            
            <button
              onClick={handleApproveForPosting}
              disabled={selectedCount === 0 || processing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {processing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Approve {selectedCount > 0 && `(${selectedCount})`} for Posting
                </>
              )}
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">No posts generated yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <div
                key={post.id}
                className={`bg-white rounded-lg border-2 transition-all ${
                  post.selected 
                    ? 'border-blue-500 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                } ${post.rss_added ? 'opacity-60' : ''}`}
              >
                {/* Image */}
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  <img 
                    src={post.image_url} 
                    alt="Post preview"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Selection overlay */}
                  <button
                    onClick={() => toggleSelectPost(post.id, post.selected)}
                    disabled={post.rss_added}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      post.selected
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/90 text-gray-600 hover:bg-blue-100'
                    } ${post.rss_added ? 'cursor-not-allowed opacity-50' : ''}`}
                  >
                    {post.selected ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-lg">+</span>
                    )}
                  </button>
                  
                  {/* Approved badge */}
                  {post.rss_added && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Approved
                    </div>
                  )}
                </div>
                
                {/* Caption */}
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-3 mb-3">
                    {post.caption_text}
                  </p>
                  
                  <div className="text-xs text-gray-500">
                    Generated {new Date(post.generated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
