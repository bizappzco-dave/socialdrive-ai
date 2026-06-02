import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast } from '@/lib/client-access'

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
      submission_id,
      post_ids = [],
      platforms = ['instagram'],
      mode = 'post_now',
      scheduled_date,
    } = body || {}

    if (!submission_id) {
      return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Load posts for this submission/client (using actual schema: caption, image_urls, platform, status)
    let postsQuery = supabase
      .from('posts')
      .select('id, caption, hashtags, image_urls, platform, status, scheduled_for, created_at')
      .eq('client_id', accessResult.access.clientId)
      .eq('submission_id', submission_id)

    if (post_ids.length > 0) {
      postsQuery = postsQuery.in('id', post_ids)
    }

    let { data: postsData, error } = await postsQuery
    let posts: any[] = (postsData as any[]) || []

    if (error) throw error

    const filteredPosts = (posts || []).filter((p: any) => p && p.id)

    if (filteredPosts.length === 0) {
      return NextResponse.json({ error: 'No eligible posts found to publish' }, { status: 400 })
    }

    // Create local posting jobs now (source-of-truth for dashboard)
    const jobRows = filteredPosts.map((post: any) => ({
      client_id: accessResult.access.clientId,
      submission_id,
      post_id: post.id,
      mode,
      scheduled_date_utc: mode === 'scheduled' && scheduled_date ? scheduled_date : null,
      platform_targets: platforms,
      media_type: post.post_type || (post.video_url ? 'video' : 'image'),
      status: mode === 'post_now' ? 'processing' : 'queued',
      created_by: accessResult.userId,
    }))

    const { data: createdJobs, error: jobError } = await supabase
      .from('posting_jobs')
      .insert(jobRows)
      .select('id, post_id, status, mode, scheduled_date_utc, created_at')

    if (jobError) throw jobError

    // Optional Upload-Post live integration hook (kept safe for now)
    // If credentials are missing, we still return local jobs so UI flow works.
    const uploadPostApiKey = process.env.UPLOAD_POST_API_KEY
    const uploadPostBase = process.env.UPLOAD_POST_BASE_URL || 'https://api.upload-post.com/api'

    if (!uploadPostApiKey) {
      return NextResponse.json({
        success: true,
        integration_mode: 'local_only',
        message: 'Posting jobs created locally. Set UPLOAD_POST_API_KEY to enable live partner publishing.',
        jobs: createdJobs || [],
      })
    }

    return NextResponse.json({
      success: true,
      integration_mode: 'ready_for_live',
      upload_post_base: uploadPostBase,
      jobs: createdJobs || [],
    })
  } catch (err: any) {
    console.error('Publish API error:', err)
    return NextResponse.json({ error: err.message || 'Failed to create posting jobs' }, { status: 500 })
  }
}
