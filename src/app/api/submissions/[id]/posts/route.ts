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
      .select('id, caption_text, image_url, caption_style, selected, hashtags, emoji_count, emojis_used')
      .eq('submission_id', params.id)
      .eq('deleted', false)  // Only show non-deleted posts
      .order('created_at', { ascending: true })
    
    if (error) {
      throw error
    }
    
    return NextResponse.json(posts || [])
    
  } catch (error: any) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
