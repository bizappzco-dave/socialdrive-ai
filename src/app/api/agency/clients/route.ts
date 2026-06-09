import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Generate random hex token
function generateToken(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * GET /api/agency/clients
 * 
 * List all clients with their upload link status
 */
export async function GET() {
  try {
    const supabase = createAdminClient()
    
    console.log('Supabase URL:', (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) ? 'configured' : 'MISSING')
    console.log('Supabase secret/admin key:', (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'configured' : 'MISSING')
    
    // Get all clients
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, name, industry')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Supabase query error:', error)
      throw error
    }
    
    console.log('Clients loaded:', clients?.length || 0)
    
    // Get upload tokens for each client (now stored on clients table)
    const clientsWithLinks = await Promise.all(
      clients.map(async (client) => {
        // Get client with permanent tokens
        const { data: clientWithTokens, error: clientError } = await supabase
          .from('clients')
          .select('upload_token, review_token')
          .eq('id', client.id)
          .maybeSingle()
        
        if (clientError) {
          console.error('Error fetching client tokens for', client.id, clientError)
        }
        
        const baseUrl = 'https://socialdrive-ai.vercel.app'
        
        return {
          ...client,
          upload_url: clientWithTokens?.upload_token ? `${baseUrl}/upload/${clientWithTokens.upload_token}` : undefined,
          review_url: clientWithTokens?.review_token ? `${baseUrl}/review/${clientWithTokens.review_token}` : undefined,
          has_submission: !!clientWithTokens?.upload_token,
        }
      })
    )
    
    return NextResponse.json(clientsWithLinks)
    
  } catch (error: any) {
    console.error('Failed to load clients:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load clients' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agency/clients
 * 
 * Create a new client and generate their upload link
 */
export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    const { name, industry } = body
    
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Client name is required' },
        { status: 400 }
      )
    }
    
    // Get current user ID (from session or hardcoded for now)
    const userId = '6edb897e-6882-4698-925c-2f9693787242' // Your user ID
    
    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        user_id: userId,
        name: name.trim(),
        industry: industry || 'Barber Salon',
        is_active: true,
      })
      .select()
      .single()
    
    if (clientError) {
      throw clientError
    }
    
    // Generate upload tokens
    const uploadToken = generateToken()
    const reviewToken = generateToken()
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
      client: {
        id: client.id,
        name: client.name,
        industry: client.industry,
        upload_url: `${baseUrl}/upload/${uploadToken}`,
        review_url: `${baseUrl}/review/${reviewToken}`,
      },
    })
    
  } catch (error: any) {
    console.error('Failed to create client:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create client' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/agency/clients
 * 
 * Delete a client and all their data
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('id')
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      )
    }
    
    // Delete posts first (they reference client)
    await supabase
      .from('posts')
      .delete()
      .eq('client_id', clientId)
    
    // Delete submission_images
    await supabase
      .from('submission_images')
      .delete()
      .eq('client_id', clientId)
    
    // Delete submissions
    await supabase
      .from('submissions')
      .delete()
      .eq('client_id', clientId)
    
    // Delete brand profile if exists
    await supabase
      .from('brand_profiles')
      .delete()
      .eq('client_id', clientId)
    
    // Finally delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Failed to delete client:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete client' },
      { status: 500 }
    )
  }
}
