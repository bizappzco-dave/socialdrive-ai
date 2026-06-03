import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast } from '@/lib/client-access'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasRoleAtLeast(accessResult.access.role, 'editor')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      caption,
      first_comment,
      media_urls = [],
      platforms = ['instagram'],
      upload_method = 'file',
      async_upload = true,
      scheduled_date = null,
      timezone = 'UTC',
      add_to_queue = false,
    } = body || {}

    const supabase = createAdminClient()

    // Create a submission first (if needed for tracking)
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        client_id: accessResult.access.clientId,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (submissionError) {
      console.error('Failed to create submission:', submissionError)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        client_id: accessResult.access.clientId,
        submission_id: submission.id,
        caption: caption || title || '',
        hashtags: [],
        image_urls: media_urls,
        platform: platforms[0] || 'instagram',
        status: scheduled_date ? 'scheduled' : 'draft',
        scheduled_for: scheduled_date,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (postError) {
      console.error('Failed to create post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    // If post_now mode, trigger Upload-Post API
    if (!scheduled_date && !add_to_queue) {
      // Import the upload logic from the publish endpoint
      // For now, just return success - user can click "Post now" from dashboard
      return NextResponse.json({
        success: true,
        post_id: post.id,
        message: 'Post created successfully. Ready to publish.',
      })
    }

    return NextResponse.json({
      success: true,
      post_id: post.id,
      submission_id: submission.id,
      message: scheduled_date 
        ? 'Post scheduled successfully' 
        : 'Post added to queue',
    })

  } catch (error: any) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
