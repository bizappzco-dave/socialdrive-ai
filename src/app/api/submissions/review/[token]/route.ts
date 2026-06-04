import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/review/[token]
 * 
 * Load a submission by review_token for the review page
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // Get submission by review_token
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        posts (
          id,
          caption,
          hashtags,
          image_urls,
          status,
          created_at
        )
      `)
      .eq('review_token', params.token)
      .maybeSingle()
    
    if (subError || !submission) {
      console.error('Submission not found:', { subError, submission })
      return NextResponse.json(
        { error: 'Invalid or expired review link' },
        { status: 404 }
      )
    }
    
    // Check if submission is completed
    if (submission.status !== 'completed') {
      return NextResponse.json(
        { error: 'Submission is still being processed' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        client_id: submission.client_id,
        client_name: submission.client_name,
        status: submission.status,
        posts: submission.posts || [],
      }
    })
    
  } catch (error: any) {
    console.error('Review API error:', error.message)
    return NextResponse.json(
      { error: 'Failed to load submission', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/submissions/review/[token]/select
 * 
 * Select favorite posts and schedule them
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { favoritePostIds } = body
    
    if (!favoritePostIds || !Array.isArray(favoritePostIds) || favoritePostIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one favorite' },
        { status: 400 }
      )
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('id, client_id, client_name')
      .eq('review_token', params.token)
      .maybeSingle()
    
    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Invalid review link' },
        { status: 404 }
      )
    }
    
    // Update selected posts to 'scheduled' status
    const { error: updateError } = await supabase
      .from('posts')
      .update({ 
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .in('id', favoritePostIds)
      .eq('client_id', submission.client_id)
    
    if (updateError) {
      console.error('Failed to update posts:', updateError)
      return NextResponse.json(
        { error: 'Failed to schedule posts', details: updateError.message },
        { status: 500 }
      )
    }
    
    // Update submission status
    await supabase
      .from('submissions')
      .update({
        status: 'scheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
    
    console.log(`✅ Scheduled ${favoritePostIds.length} posts for ${submission.client_name}`)
    
    return NextResponse.json({
      success: true,
      message: `${favoritePostIds.length} posts scheduled successfully`,
      scheduledCount: favoritePostIds.length,
    })
    
  } catch (error: any) {
    console.error('Select favorites error:', error.message)
    return NextResponse.json(
      { error: 'Failed to schedule posts', details: error.message },
      { status: 500 }
    )
  }
}
