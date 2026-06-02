import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'
import { redirect } from 'next/navigation'
import PostingQueueClient from './PostingQueueClient'

export default async function ClientPostingPage() {
  const accessResult = await getCurrentUserClientAccess()
  if (!accessResult) redirect('/auth/signin?returnTo=/client/posting')

  const supabase = createAdminClient()

  const { data: submissions } = await supabase
    .from('submissions')
    .select('id, client_name, status, created_at')
    .eq('client_id', accessResult.access.clientId)
    .in('status', ['approved', 'completed', 'ready'])
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Manual Posting Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Create partner posting jobs from approved content. Role: {accessResult.access.role}
        </p>
      </div>

      <PostingQueueClient items={(submissions as any) || []} />
    </div>
  )
}
