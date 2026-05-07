import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/posts/[id]/select
 * 
 * Toggle post selection
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { selected } = body
    
    const { data, error } = await supabase
      .from('posts')
      .update({
        selected,
        selected_at: selected ? new Date().toISOString() : null,
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true, post: data })
    
  } catch (error: any) {
    console.error('Failed to update post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update post' },
      { status: 500 }
    )
  }
}
