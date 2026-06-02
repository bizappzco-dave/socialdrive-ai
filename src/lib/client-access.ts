import { createClient } from '@/lib/supabase/server'

export type ClientRole = 'owner' | 'manager' | 'editor' | 'viewer'

export interface ClientAccess {
  clientId: string
  clientName?: string
  role: ClientRole
  source: 'membership' | 'legacy_owner'
}

const ROLE_ORDER: Record<ClientRole, number> = {
  viewer: 1,
  editor: 2,
  manager: 3,
  owner: 4,
}

export function hasRoleAtLeast(current: ClientRole, minimum: ClientRole): boolean {
  return ROLE_ORDER[current] >= ROLE_ORDER[minimum]
}

export async function getCurrentUserClientAccess(): Promise<{ userId: string; access: ClientAccess } | null> {
  console.log('[ClientAccess] Getting current user access...')
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  console.log('[ClientAccess] User:', user?.id || 'null', 'Error:', userError?.message || 'none')

  if (!user) return null

  // Preferred path: membership mapping (multi-user per client)
  const membershipResult = await supabase
    .from('client_members')
    .select('client_id, role, status, clients(name)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!membershipResult.error && membershipResult.data) {
    const row: any = membershipResult.data
    return {
      userId: user.id,
      access: {
        clientId: row.client_id,
        clientName: row.clients?.name,
        role: (row.role || 'viewer') as ClientRole,
        source: 'membership',
      },
    }
  }

  // Backward-compatible fallback: clients.user_id owner model
  const legacyResult = await supabase
    .from('clients')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!legacyResult.error && legacyResult.data) {
    return {
      userId: user.id,
      access: {
        clientId: legacyResult.data.id,
        clientName: legacyResult.data.name,
        role: 'owner',
        source: 'legacy_owner',
      },
    }
  }

  return null
}
