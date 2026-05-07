import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/agency/clients/[id]
 * 
 * Get single client with brand profile
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (error || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(client)
    
  } catch (error: any) {
    console.error('Failed to load client:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to load client' },
      { status: 500 }
    )
  }
}
