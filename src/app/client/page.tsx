import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ClientDashboard() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/signin')
  
  // Get client profile
  const { data: client } = await supabase
    .from('clients')
    .select('id, name, metadata')
    .eq('user_id', user.id)
    .single()
  
  if (!client) redirect('/client/onboarding')
  
  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('posts')
    .select('*')
    .eq('client_id', client.id)
    .order('generated_at', { ascending: false })
    .limit(10)
  
  // Get brand context
  const { data: brandContext } = await supabase
    .from('brand_contexts')
    .select('*')
    .eq('client_id', client.id)
    .single()
  
  // Get preferences
  const { data: preferences } = await supabase
    .from('client_preferences')
    .select('*')
    .eq('client_id', client.id)
    .single()
  
  // Calculate stats
  const stats = {
    totalPosts: recentPosts?.length || 0,
    approvedCount: recentPosts?.filter(p => p.selected).length || 0,
    pendingCount: recentPosts?.filter(p => !p.selected && !p.deleted).length || 0,
    scheduledCount: recentPosts?.filter(p => p.rss_added).length || 0,
  }
  
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {client.name}! 👋
        </h2>
        <p className="text-gray-600">
          Here&apos;s what&apos;s happening with your content.
        </p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Posts"
          value={stats.totalPosts}
          icon="📊"
          color="blue"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingCount}
          icon="⏳"
          color="yellow"
          href="/client/posts?status=pending"
        />
        <StatCard
          title="Approved"
          value={stats.approvedCount}
          icon="✅"
          color="green"
          href="/client/posts?status=approved"
        />
        <StatCard
          title="Scheduled"
          value={stats.scheduledCount}
          icon="📅"
          color="purple"
          href="/client/posts?status=scheduled"
        />
      </div>
      
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/client/upload"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
          >
            <span className="text-3xl mr-3">📸</span>
            <div>
              <p className="font-semibold text-gray-900">Upload Photos</p>
              <p className="text-sm text-gray-500">Send images for AI captions</p>
            </div>
          </Link>
          
          <Link
            href="/client/brand-profile"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
          >
            <span className="text-3xl mr-3">🏢</span>
            <div>
              <p className="font-semibold text-gray-900">Brand Profile</p>
              <p className="text-sm text-gray-500">Update your brand settings</p>
            </div>
          </Link>
          
          <Link
            href="/client/preferences"
            className="flex items-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
          >
            <span className="text-3xl mr-3">⚙️</span>
            <div>
              <p className="font-semibold text-gray-900">Preferences</p>
              <p className="text-sm text-gray-500">Content style & timing</p>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Recent Posts */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Recent Content
          </h3>
          <Link
            href="/client/posts"
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            View all →
          </Link>
        </div>
        
        {recentPosts && recentPosts.length > 0 ? (
          <div className="space-y-4">
            {recentPosts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <img
                  src={post.image_url}
                  alt="Post thumbnail"
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {post.caption_text?.substring(0, 100) || 'No caption'}
                    {post.caption_text && post.caption_text.length > 100 && '...'}
                  </p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span className="text-xs text-gray-500">
                      {new Date(post.generated_at).toLocaleDateString()}
                    </span>
                    <StatusBadge status={post.selected ? 'approved' : post.rss_added ? 'scheduled' : 'pending'} />
                  </div>
                </div>
                <Link
                  href={`/client/posts/${post.id}`}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">No content yet</p>
            <Link
              href="/client/upload"
              className="text-blue-600 hover:text-blue-700"
            >
              Upload your first photo →
            </Link>
          </div>
        )}
      </div>
      
      {/* Brand Profile Summary */}
      {brandContext && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Brand Profile
            </h3>
            <Link
              href="/client/brand-profile"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Brand Tone</p>
              <p className="font-medium text-gray-900">
                {brandContext.tone || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Target Audience</p>
              <p className="font-medium text-gray-900">
                {brandContext.target_audience?.substring(0, 50) || 'Not set'}
                {brandContext.target_audience && brandContext.target_audience.length > 50 && '...'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Platforms</p>
              <p className="font-medium text-gray-900">
                {brandContext.platforms?.join(', ') || 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Content Style</p>
              <p className="font-medium text-gray-900">
                {preferences?.preferred_caption_styles || 'Not set'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
  color,
  href,
}: {
  title: string
  value: number
  icon: string
  color: string
  href?: string
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  }
  
  const content = (
    <div className={`p-6 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <span className="text-4xl">{icon}</span>
      </div>
    </div>
  )
  
  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }
  
  return content
}

function StatusBadge({ status }: { status: string }) {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    scheduled: 'bg-purple-100 text-purple-800',
  }
  
  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    scheduled: 'Scheduled',
  }
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  )
}
