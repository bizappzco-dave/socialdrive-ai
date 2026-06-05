import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'
import { redirect } from 'next/navigation'
import PostingDashboard from './PostingDashboard'

export default async function ClientPostingPage() {
  const accessResult = await getCurrentUserClientAccess()
  if (!accessResult) redirect('/auth/signin?returnTo=/client/posting')

  const supabase = createAdminClient()

  // Load posts (not submissions) - using actual schema columns
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, submission_id, caption, hashtags, image_urls, platform, status, scheduled_for, created_at')
    .eq('client_id', accessResult.access.clientId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (postsError) {
    console.error('Failed to load posts:', postsError)
  }

  console.log('Loaded posts:', posts?.length, 'for client:', accessResult.access.clientId)

  return (
    <div className="space-y-6">
      <PostingDashboard items={(posts as any) || []} />
    </div>
  )
}
