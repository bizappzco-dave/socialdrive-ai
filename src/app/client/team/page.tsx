import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'
import TeamManagerClient from './TeamManagerClient'

export default async function ClientTeamPage() {
  const accessResult = await getCurrentUserClientAccess()
  if (!accessResult) redirect('/auth/signin?returnTo=/client/team')

  const supabase = createAdminClient()

  const { data: members } = await supabase
    .from('client_members')
    .select('id, user_id, role, status, created_at')
    .eq('client_id', accessResult.access.clientId)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Team Access</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage who can create and publish posts for your business. Your role: {accessResult.access.role}
        </p>
      </div>

      <TeamManagerClient
        initialMembers={(members as any) || []}
        myRole={accessResult.access.role}
      />
    </div>
  )
}
