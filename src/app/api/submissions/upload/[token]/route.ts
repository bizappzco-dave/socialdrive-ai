import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/submissions/upload/[token]
 * 
 * Get submission info by upload token
 * Checks both clients table (permanent) and submissions table (legacy)
 */
export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    console.log('=== SUBMISSION LOOKUP DEBUG ===')
    console.log('Token from URL:', params.token)
    
    const supabase = createAdminClient()
    
    // First, try to find client by permanent upload_token
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name, features, tier')
      .eq('upload_token', params.token)
      .maybeSingle()
    
    if (client && !clientError) {
      console.log('✅ Found client by permanent token:', client.name)
      
      // Create a "virtual" submission for this client
      return NextResponse.json({
        id: null, // No submission yet - first upload
        client_name: client.name,
        client_email: null,
        client_phone: null,
        status: 'pending',
        brief_text: null,
        client_id: client.id,
        client: client,
        client_tier: client.tier || 'simple',
        client_features: client.features || {},
        is_permanent_link: true,
      })
    }
    
    // Fall back to legacy submissions table lookup
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id, client_name, client_email, client_phone, status, brief_text, client_id')
      .eq('upload_token', params.token)
      .maybeSingle()
    
    if (submissionError || !submission) {
      console.error('Token not found in clients or submissions:', { submissionError, submission })
      return NextResponse.json(
        { error: 'Invalid or expired upload link' },
        { status: 404 }
      )
    }
    
    console.log('✅ Found legacy submission token:', submission.id)
    
    // Get client info for legacy tokens
    const { data: legacyClient, error: legacyClientError } = await supabase
      .from('clients')
      .select('id, name, features, tier')
      .eq('id', submission.client_id)
      .single()
    
    if (legacyClientError) {
      console.error('Failed to get client:', legacyClientError)
    }
    
    return NextResponse.json({
      ...submission,
      client_tier: legacyClient?.tier || 'simple',
      client_features: legacyClient?.features || {},
      client: legacyClient,
      is_permanent_link: false,
    })
    
  } catch (error: any) {
    console.error('Failed to fetch submission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch submission' },
      { status: 500 }
    )
  }
}
