import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate random hex token
function generateToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * POST /api/agency/clients/[id]/regenerate-link
 * 
 * Generate a fresh upload link with production URL
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('id', params.id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    // Generate new tokens
    const uploadToken = generateToken()
    const reviewToken = generateToken()
    
    // Delete old submissions for this client
    await supabase
      .from('submissions')
      .delete()
      .eq('client_id', params.id)
    
    // Create new placeholder submission
    const { error: submissionError } = await supabase
      .from('submissions')
      .insert({
        client_id: client.id,
        upload_token: uploadToken,
        review_token: reviewToken,
        client_name: client.name,
        status: 'pending',
      })
    
    if (submissionError) {
      throw submissionError
    }
    
    const baseUrl = 'https://socialdrive-ai.vercel.app'
    
    return NextResponse.json({
      success: true,
      upload_url: `${baseUrl}/upload/${uploadToken}`,
      review_url: `${baseUrl}/review/${reviewToken}`,
    })
    
  } catch (error: any) {
    console.error('Failed to regenerate link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to regenerate link' },
      { status: 500 }
    )
  }
}
