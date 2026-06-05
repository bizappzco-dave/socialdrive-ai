import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess } from '@/lib/client-access'

/**
 * POST /api/client/posts/create
 * Create a new post manually (from scratch)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify user has client access
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caption, hashtags, image_urls, platform, scheduled_for, status } = body

    // Validate required fields
    if (!caption) {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        client_id: accessResult.access.clientId,
        caption,
        hashtags: hashtags || [],
        image_urls: image_urls || [],
        platform: platform || 'instagram',
        scheduled_for: scheduled_for || null,
        status: status || 'draft',
      })
      .select()
      .single()

    if (postError) {
      console.error('Failed to create post:', postError)
      return NextResponse.json(
        { error: 'Failed to create post', details: postError.message },
        { status: 500 }
      )
    }

    console.log('✅ Post created:', post.id)

    return NextResponse.json({
      success: true,
      post,
    })

  } catch (error: any) {
    console.error('Create post error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create post', details: error.message },
      { status: 500 }
    )
  }
}
