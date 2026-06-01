import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast, type ClientRole } from '@/lib/client-access'

const ALLOWED_ROLES: ClientRole[] = ['owner', 'manager', 'editor', 'viewer']

function canInvite(inviterRole: ClientRole, requestedRole: ClientRole): boolean {
  if (inviterRole === 'owner') return true
  if (inviterRole === 'manager') return requestedRole === 'editor' || requestedRole === 'viewer'
  return false
}

export async function GET() {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRoleAtLeast(accessResult.access.role, 'viewer')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('client_members')
      .select('id, client_id, user_id, role, status, invited_by, invited_at, joined_at, disabled_at, created_at, updated_at')
      .eq('client_id', accessResult.access.clientId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      client_id: accessResult.access.clientId,
      my_role: accessResult.access.role,
      members: data || [],
    })
  } catch (err: any) {
    console.error('Client members GET error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch client members' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRoleAtLeast(accessResult.access.role, 'manager')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const user_id = body?.user_id as string | undefined
    const role = (body?.role || 'viewer') as ClientRole

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (!canInvite(accessResult.access.role, role)) {
      return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('client_members')
      .upsert({
        client_id: accessResult.access.clientId,
        user_id,
        role,
        status: 'active',
        invited_by: accessResult.userId,
        invited_at: new Date().toISOString(),
        joined_at: new Date().toISOString(),
        disabled_at: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'client_id,user_id' })
      .select('id, client_id, user_id, role, status, invited_by, invited_at, joined_at, disabled_at, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, member: data })
  } catch (err: any) {
    console.error('Client members POST error:', err)
    return NextResponse.json({ error: err.message || 'Failed to add member' }, { status: 500 })
  }
}
