import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'

/**
 * DELETE /api/client/staff/[id]
 * Remove a staff member from the current client
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = params.id

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Check if the user is trying to remove themselves
    const { data: staffRecord } = await supabase
      .from('client_staff_access')
      .select('user_id')
      .eq('id', staffId)
      .single()

    if (staffRecord?.user_id === accessResult.userId) {
      return NextResponse.json(
        { error: 'You cannot remove yourself from a client. Please transfer ownership first.' },
        { status: 400 }
      )
    }

    // Delete the staff access
    const { error } = await supabase
      .from('client_staff_access')
      .delete()
      .eq('id', staffId)
      .eq('client_id', accessResult.access.clientId)

    if (error) {
      console.error('Failed to remove staff:', error)
      return NextResponse.json({ error: 'Failed to remove staff' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member removed successfully',
    })

  } catch (error: any) {
    console.error('Remove staff error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/client/staff/[id]
 * Update a staff member's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staffId = params.id
    const body = await request.json()
    const { role } = body

    if (!staffId) {
      return NextResponse.json({ error: 'Staff ID is required' }, { status: 400 })
    }

    if (!role || !['admin', 'staff', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update the role
    const { error } = await supabase
      .from('client_staff_access')
      .update({ role })
      .eq('id', staffId)
      .eq('client_id', accessResult.access.clientId)

    if (error) {
      console.error('Failed to update role:', error)
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Role updated to ${role}`,
    })

  } catch (error: any) {
    console.error('Update role error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
