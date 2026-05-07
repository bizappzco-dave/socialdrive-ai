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
    
    return NextResponse.json(submissions || [])
    
  } catch (error: any) {
    console.error('Submissions API error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
