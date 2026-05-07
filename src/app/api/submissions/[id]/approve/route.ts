import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/submissions/[id]/approve
 * 
 * Mark submission as approved and ready for CSV export
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // Get all posts for this submission
    const { data: allPosts } = await supabase
      .from('posts')
      .select('id, selected')
      .eq('submission_id', params.id)
    
    // Mark unselected posts as deleted
    if (allPosts) {
      const unselectedIds = allPosts
        .filter(post => !post.selected)
        .map(post => post.id)
      
      if (unselectedIds.length > 0) {
        await supabase
          .from('posts')
          .update({ deleted: true, deleted_at: new Date().toISOString() })
          .in('id', unselectedIds)
      }
    }
    
    // Update submission status
    const { data, error } = await supabase
      .from('submissions')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      submission: data,
    })
    
  } catch (error: any) {
    console.error('Failed to approve submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to approve submission' },
      { status: 500 }
    )
  }
}
