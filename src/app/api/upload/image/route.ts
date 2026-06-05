import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/upload/image
 * 
 * Upload an image to Supabase Storage
 */
export async function POST(request: Request) {
  try {
    console.log('Image upload route called')
    console.log('Supabase URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const submissionToken = formData.get('submissionToken') as string
    
    if (!file || !submissionToken) {
      return NextResponse.json(
        { error: 'File and submissionToken are required' },
        { status: 400 }
      )
    }
    
    // Get submission to find client
    // Check both clients table (permanent tokens) and submissions table (legacy)
    const supabase = createAdminClient()
    
    console.log('Getting client for upload token:', submissionToken)
    
    // First check clients table (permanent upload tokens)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, name')
      .eq('upload_token', submissionToken)
      .limit(1)
      .maybeSingle()
    
    console.log('Client query result:', { client, clientError })
    
    let clientId = client?.id
    let clientName = client?.name
    
    // If not found in clients, check submissions table (legacy)
    if (!client) {
      console.log('Token not found in clients table, checking submissions...')
      const { data: submission, error: subError } = await supabase
        .from('submissions')
        .select('id, client_id, client_name, upload_token')
        .eq('upload_token', submissionToken)
        .limit(1)
        .maybeSingle()
      
      console.log('Submission query result:', { submission, subError })
      
      if (subError) {
        console.error('Failed to get submission:', subError)
        return NextResponse.json(
          { error: 'Invalid submission token', details: subError.message },
          { status: 404 }
        )
      }
      
      if (!submission) {
        console.error('No submission found for token:', submissionToken)
        return NextResponse.json(
          { error: 'Invalid submission token - not found' },
          { status: 404 }
        )
      }
      
      clientId = submission.client_id
      clientName = submission.client_name
    }
    
    console.log('Client found, client_id:', clientId)
    
    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop()
    const filename = `${timestamp}-${randomStr}.${ext}`
    
    // Upload to Supabase Storage - use public bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('client-images')  // Public bucket
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (uploadError) {
      throw uploadError
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('submissions')
      .getPublicUrl(filename)
    
    return NextResponse.json({
      url: publicUrl,
      filename: file.name,
      size: file.size,
      path: uploadData.path,
    })
    
  } catch (error: any) {
    console.error('Image upload failed:', error)
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    // Check if it's a Supabase storage error
    const isStorageError = error.message?.includes('storage') || error.message?.includes('bucket') || error.message?.includes('Invalid API key')
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to upload image',
        details: error.toString(),
        isStorageError,
      },
      { status: 500 }
    )
  }
}
