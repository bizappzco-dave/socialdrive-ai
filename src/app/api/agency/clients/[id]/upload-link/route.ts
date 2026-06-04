import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

/**
 * POST /api/agency/clients/[id]/upload-link
 * 
 * Generate or retrieve permanent upload link for a client
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
      .select('name, upload_token, review_token')
      .eq('id', params.id)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    let uploadToken: string
    let reviewToken: string
    
    if (client.upload_token && client.review_token) {
      // Reuse existing permanent tokens
      uploadToken = client.upload_token
      reviewToken = client.review_token
    } else {
      // Generate new permanent tokens
      uploadToken = crypto.randomBytes(16).toString('hex')
      reviewToken = crypto.randomBytes(16).toString('hex')
      
      // Store tokens on client record (permanent!)
      const { error: updateError } = await supabase
        .from('clients')
        .update({
          upload_token: uploadToken,
          review_token: reviewToken,
        })
        .eq('id', params.id)
      
      if (updateError) {
        throw updateError
      }
    }
    
    const baseUrl = 'https://socialdrive-ai.vercel.app'
    
    return NextResponse.json({
      success: true,
      upload_url: `${baseUrl}/upload/${uploadToken}`,
      review_url: `${baseUrl}/review/${reviewToken}`,
      whatsapp_template: `Hi ${client.name}! 👋

Here's your personal content upload link:
${baseUrl}/upload/${uploadToken}

💡 Save this link! Use it whenever you want to upload new content.

Just upload your images and add a brief note about what you'd like to post. We'll handle the rest! ✨`,
    })
    
  } catch (error: any) {
    console.error('Failed to generate upload link:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate upload link' },
      { status: 500 }
    )
  }
}
