import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/agency/submissions
 * 
 * Get all submissions for admin dashboard (uses service role key)
 */
export async function GET() {
  try {
    const supabase = createAdminClient()

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch submissions:', error)
      throw error
    }

    const rows = submissions || []
    if (rows.length === 0) {
      return NextResponse.json([])
    }

    const submissionIds = rows.map((s: any) => s.id)

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('submission_id')
      .in('submission_id', submissionIds)

    if (postsError) {
      console.error('Failed to fetch post counts:', postsError)
      throw postsError
    }

    const counts = new Map<string, { post_count: number; selected_posts_count: number }>()

    for (const post of posts || []) {
      const sid = post.submission_id as string | null
      if (!sid) continue

      const current = counts.get(sid) || { post_count: 0, selected_posts_count: 0 }
      current.post_count += 1

      counts.set(sid, current)
    }

    const enriched = rows.map((s: any) => {
      const c = counts.get(s.id) || { post_count: 0, selected_posts_count: 0 }
      return {
        ...s,
        post_count: c.post_count,
        selected_posts_count: c.selected_posts_count,
      }
    })

    return NextResponse.json(enriched)

  } catch (error: any) {
    console.error('Submissions API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
