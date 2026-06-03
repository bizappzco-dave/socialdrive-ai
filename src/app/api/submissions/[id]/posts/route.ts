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
    
    return NextResponse.json(posts || [])
    
  } catch (error: any) {
    console.error('Failed to fetch posts:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}
