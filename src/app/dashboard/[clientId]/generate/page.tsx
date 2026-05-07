'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { GeneratePostsButton } from '@/components/dashboard/GeneratePostsButton'
import { Image, Sparkles, ArrowRight } from 'lucide-react'

interface Post {
  id: string
  caption_text: string
  image_url: string
  caption_style: string
  selected: boolean
  generated_at: string
}

export default function GeneratePostsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const [imageUrl, setImageUrl] = useState('')
  const [generatedPosts, setGeneratedPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  async function loadGeneratedPosts() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('client_id', clientId)
        .order('generated_at', { ascending: false })
        .limit(20)
      
      if (error) throw error
      setGeneratedPosts(data || [])
    } catch (err: any) {
      console.error('Failed to load posts:', err)
    }
  }

  useEffect(() => {
    loadGeneratedPosts()
  }, [clientId])

  function handlePostGenerated(posts: Post[]) {
    setGeneratedPosts(posts)
    // Reload after a moment to get full data
    setTimeout(loadGeneratedPosts, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href={`/dashboard/${clientId}`}
                className="text-sm text-blue-600 hover:underline mb-2 block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Generate Posts</h1>
              <p className="text-gray-600 mt-1">Create AI-powered captions for your images</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Input */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Image className="h-5 w-5 text-blue-600" />
            Image URL
          </h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {imageUrl && (
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgZmlsbD0iI2U1ZTdlNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFByZXZpZXc8L3RleHQ+PC9zdmc+'
                  }}
                />
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-600">
                Paste a direct image URL (JPG, PNG, WebP)
              </p>
              
              <GeneratePostsButton
                clientId={clientId}
                imageUrl={imageUrl}
                onGenerated={handlePostGenerated}
                disabled={!imageUrl}
              />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-8 bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            How It Works
          </h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <span className="font-bold">1.</span>
              <span>Paste an image URL above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">2.</span>
              <span>AI generates 5 caption variations based on your brand voice</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">3.</span>
              <span>Review and select your favorites in the Content Library</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">4.</span>
              <span>Approve for posting and download CSV for Sociamonials</span>
            </li>
          </ol>
        </div>

        {/* Generated Posts */}
        {generatedPosts.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Recently Generated ({generatedPosts.length})
              </h2>
              <Link
                href={`/dashboard/${clientId}`}
                className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                View All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {generatedPosts.slice(0, 5).map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start gap-4">
                    <img 
                      src={post.image_url} 
                      alt="Post"
                      className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                          {post.caption_style.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {post.emoji_count} emojis • {post.hashtag_count} hashtags
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">
                        {post.caption_text}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Generated {new Date(post.generated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
