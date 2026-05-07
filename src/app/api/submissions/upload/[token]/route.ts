import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/upload/[token]
 * 
 * Get submission info by upload token
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const supabase = createAdminClient()
    
    const { data: submission, error } = await supabase
      .from('submissions')
      .select(`
        id, 
        client_name, 
        client_email, 
        client_phone, 
        status, 
        brief_text,
        clients (
          id,
          name,
          tier,
          features
        )
      `)
      .eq('upload_token', params.token)
      .single()
    
    if (error || !submission) {
      return NextResponse.json(
        { error: 'Invalid or expired upload link' },
        { status: 404 }
      )
    }
    
    // Return submission with client tier info
    return NextResponse.json({
      ...submission,
      client_tier: submission.clients?.tier || 'simple',
      client_features: submission.clients?.features || {},
      client: submission.clients
    })
    
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
