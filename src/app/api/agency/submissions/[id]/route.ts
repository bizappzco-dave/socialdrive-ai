import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL not configured')
  return url
}

function getSupabaseSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error('SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY not configured')
  return key
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient(getSupabaseUrl(), getSupabaseSecretKey())

    const submissionId = params.id
    console.log('🗑️ Deleting submission:', submissionId)

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, image_url')
      .eq('submission_id', submissionId)

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      throw new Error('Failed to fetch posts')
    }

    console.log('Found', posts?.length || 0, 'posts to delete')

    if (posts && posts.length > 0) {
      const { error: deletePostsError } = await supabase
        .from('posts')
        .delete()
        .eq('submission_id', submissionId)

      if (deletePostsError) {
        console.error('Error deleting posts:', deletePostsError)
        throw new Error('Failed to delete posts: ' + deletePostsError.message)
      }
      console.log('✓ Deleted', posts.length, 'posts from database')

      const imagePaths: string[] = posts
        .map(p => {
          try {
            const url = new URL(p.image_url)
            return url.pathname.replace('/storage/v1/object/public/submissions/', '')
          } catch {
            return null
          }
        })
        .filter((path): path is string => path !== null)

      if (imagePaths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from('submissions')
          .remove(imagePaths)

        if (storageError) {
          console.error('Error deleting storage files:', storageError)
        } else {
          console.log('✓ Deleted', imagePaths.length, 'images from storage')
        }
      }
    }

    const { error: subError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', submissionId)

    if (subError) {
      console.error('Error deleting submission:', subError)
      throw new Error('Failed to delete submission: ' + subError.message)
    }

    console.log('✓ Submission deleted:', submissionId)
    return NextResponse.json({ success: true, deleted_posts: posts?.length || 0 })
  } catch (error: any) {
    console.error('Delete submission failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete submission' },
      { status: 500 }
    )
  }
}
