import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DELETE /api/posts/[id]
 * 
 * Delete a post (client doesn't want it)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // Soft delete - mark as deleted instead of removing
    const { error } = await supabase
      .from('posts')
      .update({
        deleted: true,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', params.id)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Failed to delete post:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete post' },
      { status: 500 }
    )
  }
}
