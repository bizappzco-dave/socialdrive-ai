import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePostVariationsHybrid } from '@/lib/ai/hybrid-generator'

/**
 * POST /api/submissions/[id]/retry
 * 
 * Retry a failed submission generation
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    // Get submission with images
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, clients(*), submission_images(url)')
      .eq('id', params.id)
      .single()
    
    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      )
    }
    
    if (submission.status !== 'error') {
      return NextResponse.json(
        { error: 'Can only retry submissions in "error" status' },
        { status: 400 }
      )
    }
    
    const images = submission.submission_images || []
    
    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images found for this submission' },
        { status: 400 }
      )
    }
    
    console.log(`Retrying submission ${params.id} for client ${submission.client_name}`)
    console.log(`Images: ${images.length}, Type: ${submission.submission_type}`)
    
    // Update status to generating
    await supabase
      .from('submissions')
      .update({ 
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    // Prepare generation params
    const generateParams = {
      images: images.map((img: any) => img.url),
      brief: submission.brief_text || '',
      clientName: submission.clients?.name || 'Client',
      industry: submission.clients?.industry || '',
      platforms: submission.platforms || ['instagram'],
      tier: submission.clients?.tier || 'simple',
      submissionType: submission.submission_type || 'images',
    }
    
    console.log('Starting generation with params:', generateParams)
    
    // Generate posts
    const result = await generatePostVariationsHybrid(generateParams)
    
    if (!result.success || !result.posts || result.posts.length === 0) {
      throw new Error(result.error || 'Generation failed')
    }
    
    // Update submission with generated posts
    const updateData: any = {
      status: 'ready',
      generated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    // Save posts to database (simplified - adjust based on your schema)
    // Note: You may need to adjust this based on your actual posts table structure
    
    console.log(`✅ Successfully generated ${result.posts.length} posts for submission ${params.id}`)
    
    return NextResponse.json({
      success: true,
      posts: result.posts.length,
      message: 'Generation complete'
    })
    
  } catch (error: any) {
    console.error('Retry failed:', error)
    
    // Update status back to error
    const supabase = createAdminClient()
    await supabase
      .from('submissions')
      .update({ 
        status: 'error',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
    
    return NextResponse.json(
      { error: error.message || 'Generation failed' },
      { status: 500 }
    )
  }
}
