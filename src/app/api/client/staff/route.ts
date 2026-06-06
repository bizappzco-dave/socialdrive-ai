import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'

/**
 * GET /api/client/staff
 * List all staff members for the current client
 */
export async function GET(request: NextRequest) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all staff for this client
    const { data: staff, error } = await supabase
      .from('client_staff_access')
      .select(`
        id,
        user_id,
        role,
        created_at,
        invited_email,
        invitation_accepted
      `)
      .eq('client_id', accessResult.access.clientId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load staff:', error)
      return NextResponse.json({ error: `Failed to load staff: ${error.message}` }, { status: 500 })
    }

    // Get user details for staff with user_id (from auth.users schema)
    const userIds = staff.filter(s => s.user_id).map(s => s.user_id)
    let userMap = new Map()
    
    if (userIds.length > 0) {
      const { data: users, error: usersError } = await supabase
        .from('auth.users')
        .select('id, email, raw_user_meta_data')
        .in('id', userIds)
      
      if (usersError) {
        console.error('Failed to fetch auth users:', usersError)
      } else if (users) {
        users.forEach(u => {
          userMap.set(u.id, u)
        })
      }
    }

    // Format staff list
    const formattedStaff = staff.map((s: any) => {
      const user = userMap.get(s.user_id)
      return {
        id: s.id,
        user_id: s.user_id,
        email: user?.email || s.invited_email,
        role: s.role,
        created_at: s.created_at,
        invitation_accepted: s.invitation_accepted,
        name: user?.raw_user_meta_data?.fullName || user?.raw_user_meta_data?.name,
      }
    })

    // Return current user's role for permission checks
    return NextResponse.json({ 
      staff: formattedStaff,
      currentUser: {
        role: accessResult.access.role,
        isOwner: accessResult.access.role === 'owner',
      }
    })

  } catch (error: any) {
    console.error('List staff error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/client/staff
 * Add a new staff member to the current client
 */
export async function POST(request: NextRequest) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email, role = 'viewer' } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!['admin', 'staff', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Find user by email in our database
    const { data: existingUser } = await supabase
      .from('client_staff_access')
      .select('user_id, users:users (id, email, raw_user_meta_data)')
      .eq('invited_email', email)
      .or(`invited_email.is.null, invited_email.eq.${email}`)
      .maybeSingle()

    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null

    if (existingUser?.users) {
      const user = Array.isArray(existingUser.users) ? existingUser.users[0] : existingUser.users
      if (user) {
        userId = user.id
        userEmail = user.email
        userName = (user.raw_user_meta_data as any)?.fullName || (user.raw_user_meta_data as any)?.name
      }
    }

    // If user exists, add them directly
    if (userId) {
      const { data: access, error: accessError } = await supabase
        .from('client_staff_access')
        .insert({
          client_id: accessResult.access.clientId,
          user_id: userId,
          role,
          invitation_accepted: true,
        })
        .select()
        .single()

      if (accessError) {
        if (accessError.code === '23505') { // Unique violation
          return NextResponse.json({ error: 'User is already a staff member' }, { status: 409 })
        }
        console.error('Failed to add staff:', accessError)
        return NextResponse.json({ error: 'Failed to add staff' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        staff: {
          id: access.id,
          user_id: access.user_id,
          email: userEmail,
          role: access.role,
        },
        message: `${userEmail} added as ${role}`,
      })
    }

    // User doesn't exist - create pending invitation
    const { data: invitation, error: inviteError } = await supabase
      .from('client_staff_access')
      .insert({
        client_id: accessResult.access.clientId,
        invited_email: email,
        role,
        invitation_accepted: false,
      })
      .select()
      .single()

    if (inviteError) {
      console.error('Failed to create invitation:', inviteError)
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email,
        role,
        status: 'pending',
      },
      message: `Invitation sent to ${email}. They will gain access once they create an account.`,
    })

  } catch (error: any) {
    console.error('Add staff error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
