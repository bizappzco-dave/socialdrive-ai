import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast } from '@/lib/client-access'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRoleAtLeast(accessResult.access.role, 'editor')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { scheduled_for } = body

    if (!scheduled_for) {
      return NextResponse.json({ error: 'scheduled_for is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Update post with scheduled date
    const { data: post, error: postError } = await supabase
      .from('posts')
      .update({
        status: 'scheduled',
        scheduled_for,
      })
      .eq('id', params.postId)
      .eq('client_id', accessResult.access.clientId)
      .select()
      .single()

    if (postError) {
      console.error('Failed to schedule post:', postError)
      return NextResponse.json({ error: 'Failed to schedule post' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      post_id: post.id,
      scheduled_for: post.scheduled_for,
    })

  } catch (error: any) {
    console.error('Error scheduling post:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
