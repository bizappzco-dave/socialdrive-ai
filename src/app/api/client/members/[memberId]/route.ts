import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast, type ClientRole } from '@/lib/client-access'

const ALLOWED_ROLES: ClientRole[] = ['owner', 'manager', 'editor', 'viewer']

function canManageTarget(actorRole: ClientRole, targetRole: ClientRole): boolean {
  if (actorRole === 'owner') return true
  if (actorRole === 'manager') return targetRole === 'editor' || targetRole === 'viewer'
  return false
}

function canAssignRole(actorRole: ClientRole, role: ClientRole): boolean {
  if (actorRole === 'owner') return true
  if (actorRole === 'manager') return role === 'editor' || role === 'viewer'
  return false
}

export async function PATCH(request: Request, { params }: { params: { memberId: string } }) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRoleAtLeast(accessResult.access.role, 'manager')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const memberId = params.memberId
    if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

    const body = await request.json()
    const nextRole = body?.role as ClientRole | undefined
    const nextStatus = body?.status as 'active' | 'disabled' | undefined

    if (!nextRole && !nextStatus) {
      return NextResponse.json({ error: 'role or status is required' }, { status: 400 })
    }

    if (nextRole && !ALLOWED_ROLES.includes(nextRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    if (nextStatus && !['active', 'disabled'].includes(nextStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const targetRes = await supabase
      .from('client_members')
      .select('id, user_id, role, status')
      .eq('id', memberId)
      .eq('client_id', accessResult.access.clientId)
      .maybeSingle()

    if (targetRes.error) throw targetRes.error
    if (!targetRes.data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const target = targetRes.data as any

    if (!canManageTarget(accessResult.access.role, target.role as ClientRole)) {
      return NextResponse.json({ error: 'You cannot manage this member' }, { status: 403 })
    }

    if (nextRole && !canAssignRole(accessResult.access.role, nextRole)) {
      return NextResponse.json({ error: 'You cannot assign this role' }, { status: 403 })
    }

    // Prevent self-demotion/disable accidentally
    if (target.user_id === accessResult.userId && ((nextStatus && nextStatus !== 'active') || (nextRole && nextRole !== 'owner'))) {
      return NextResponse.json({ error: 'You cannot demote/disable your own owner access here' }, { status: 400 })
    }

    const patch: any = {
      updated_at: new Date().toISOString(),
    }

    if (nextRole) patch.role = nextRole
    if (nextStatus) {
      patch.status = nextStatus
      patch.disabled_at = nextStatus === 'disabled' ? new Date().toISOString() : null
      if (nextStatus === 'active' && target.status !== 'active') {
        patch.joined_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('client_members')
      .update(patch)
      .eq('id', memberId)
      .eq('client_id', accessResult.access.clientId)
      .select('id, client_id, user_id, role, status, invited_by, invited_at, joined_at, disabled_at, created_at, updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, member: data })
  } catch (err: any) {
    console.error('Client member PATCH error:', err)
    return NextResponse.json({ error: err.message || 'Failed to update member' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: { memberId: string } }) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRoleAtLeast(accessResult.access.role, 'manager')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const memberId = params.memberId
    if (!memberId) return NextResponse.json({ error: 'memberId is required' }, { status: 400 })

    const supabase = createAdminClient()

    const targetRes = await supabase
      .from('client_members')
      .select('id, user_id, role')
      .eq('id', memberId)
      .eq('client_id', accessResult.access.clientId)
      .maybeSingle()

    if (targetRes.error) throw targetRes.error
    if (!targetRes.data) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    const target = targetRes.data as any

    if (!canManageTarget(accessResult.access.role, target.role as ClientRole)) {
      return NextResponse.json({ error: 'You cannot remove this member' }, { status: 403 })
    }

    if (target.user_id === accessResult.userId) {
      return NextResponse.json({ error: 'You cannot remove your own membership' }, { status: 400 })
    }

    const { error } = await supabase
      .from('client_members')
      .delete()
      .eq('id', memberId)
      .eq('client_id', accessResult.access.clientId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Client member DELETE error:', err)
    return NextResponse.json({ error: err.message || 'Failed to remove member' }, { status: 500 })
  }
}
