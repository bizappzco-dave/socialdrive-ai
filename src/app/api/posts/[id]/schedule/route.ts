import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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
      .eq('id', params.id)
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

  } catch (error) {
    console.error('Schedule error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
