import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/[id]/posts
 * 
 * Get all posts for a submission
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, caption, image_urls, hashtags, platform, status')
      .eq('submission_id', params.id)
      .order('created_at', { ascending: true })
    
    if (error) {
      throw error
    }
    
    // Map TaskifiAI schema to frontend expected format
    const mappedPosts = (posts || []).map(post => ({
      id: post.id,
      caption_text: post.caption,
      image_url: Array.isArray(post.image_urls) ? post.image_urls[0] : post.image_urls,
      hashtags: post.hashtags,
      caption_style: 'short_statement',
      emoji_count: 0,
      selected: false,
      platform: post.platform,
      status: post.status,
    }))
    
    return NextResponse.json(mappedPosts)
    
  } catch (error: any) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
