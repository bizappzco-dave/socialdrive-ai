import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const submissionId = params.id

    // First, get all posts for this submission to delete images from storage
    const { data: posts } = await supabase
      .from('posts')
      .select('id, image_url')
      .eq('submission_id', submissionId)

    // Delete images from Supabase storage
    if (posts && posts.length > 0) {
      const imagePaths = posts
        .map(p => {
          const url = new URL(p.image_url)
          return url.pathname.replace('/storage/v1/object/public/submissions/', '')
        })
        .filter(Boolean)

      if (imagePaths.length > 0) {
        await supabase.storage
          .from('submissions')
          .remove(imagePaths)
      }

      // Delete posts from database
      await supabase
        .from('posts')
        .delete()
        .eq('submission_id', submissionId)
    }

    // Delete the submission itself
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (error) {
      console.error('Supabase delete error:', error)
      throw new Error('Failed to delete submission')
    }

    console.log('✓ Submission deleted:', submissionId, '- removed', posts?.length || 0, 'posts')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete submission failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
