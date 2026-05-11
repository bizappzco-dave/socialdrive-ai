import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  
  // Get client profile
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', user.id)
    .single()
  
  if (!client) redirect('/client/onboarding')
  
  // Get posts with optional status filter
  let query = supabase
    .from('posts')
    .select('*')
    .eq('client_id', client.id)
    .eq('deleted', false)
    .order('generated_at', { ascending: false })
  
  if (searchParams.status === 'pending') {
    query = query.eq('selected', false).eq('rss_added', false)
  } else if (searchParams.status === 'approved') {
    query = query.eq('selected', true).eq('rss_added', false)
  } else if (searchParams.status === 'scheduled') {
    query = query.eq('rss_added', true)
  }
  
  const { data: posts } = await query
  
  const statusLabels = {
    pending: 'Pending Review',
    approved: 'Approved',
    scheduled: 'Scheduled',
    all: 'All Posts',
  }
  
  const currentStatus = searchParams.status || 'all'
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {statusLabels[currentStatus as keyof typeof statusLabels]}
          </h1>
          <p className="text-gray-600 mt-1">
            {posts?.length || 0} post{posts?.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link
          href="/client/upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload New Photo
        </Link>
      </div>
      
      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b">
        {(['all', 'pending', 'approved', 'scheduled'] as const).map((status) => (
          <Link
            key={status}
            href={`/client/posts${status !== 'all' ? `?status=${status}` : ''}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              currentStatus === status
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {statusLabels[status]}
          </Link>
        ))}
      </div>
      
      {/* Posts Grid */}
      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
            >
              <img
                src={post.image_url}
                alt="Post"
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <PostStatusBadge
                    selected={post.selected}
                    rssAdded={post.rss_added}
                  />
                  <span className="text-xs text-gray-500">
                    {new Date(post.generated_at).toLocaleDateString()}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                  {post.caption_text || 'No caption generated yet'}
                </p>
                
                <div className="flex items-center justify-between">
                  <Link
                    href={`/client/posts/${post.id}`}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View Details →
                  </Link>
                  <div className="flex items-center space-x-2">
                    {post.hashtags && (
                      <span className="text-xs text-gray-500">
                        #{post.hashtags.length} tags
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">📸</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No posts yet
          </h3>
          <p className="text-gray-600 mb-4">
            Upload your first photo to get started
          </p>
          <Link
            href="/client/upload"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Photo
          </Link>
        </div>
      )}
    </div>
  )
}

function PostStatusBadge({
  selected,
  rssAdded,
}: {
  selected: boolean
  rssAdded: boolean
}) {
  if (rssAdded) {
    return (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
        Scheduled
      </span>
    )
  }
  
  if (selected) {
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
        Approved
      </span>
    )
  }
  
  return (
    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
      Pending
    </span>
  )
}
