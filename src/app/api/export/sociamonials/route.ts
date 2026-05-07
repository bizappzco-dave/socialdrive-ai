import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getClientPreferences } from '@/lib/supabase/queries'
import { generateSociamonialsCSV, generateCSVFilename } from '@/lib/csv-export'

/**
 * GET /api/export/sociamonials
 * 
 * Export selected posts as Sociamonials-compatible CSV
 * 
 * Query params:
 * - clientId: Client ID to export for
 * - submissionId: (Optional) Filter to specific submission
 * - scheduleType: 'random' | 'specific' | 'draft' (default: 'random')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const submissionId = searchParams.get('submissionId')
    const scheduleType = searchParams.get('scheduleType') as 'random' | 'specific' | 'draft' || 'random'
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      )
    }
    
    // Get Supabase client
    const supabase = createAdminClient()
    
    // Get client info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('name')
      .eq('id', clientId)
      .single()
    
    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }
    
    // Get client preferences
    const preferences = await getClientPreferences(clientId)
    
    // Get selected posts
    let postsQuery = supabase
      .from('posts')
      .select('id, caption_text, image_url, post_type, hashtags, selected_at, submission_id')
      .eq('client_id', clientId)
      .eq('selected', true)
      .eq('deleted', false)
      .eq('rss_added', false)
    
    // Filter by submission if provided
    if (submissionId) {
      postsQuery = postsQuery.eq('submission_id', submissionId)
    }
    
    const { data: posts, error: postsError } = await postsQuery.order('selected_at', { ascending: true })
    
    if (postsError) {
      throw postsError
    }
    
    if (!posts || posts.length === 0) {
      return NextResponse.json(
        { error: 'No selected posts found for this client' },
        { status: 404 }
      )
    }
    
    // For carousel posts, fetch all images from submission_images
    const postsWithCarouselImages = await Promise.all(
      posts.map(async (post) => {
        if (post.post_type === 'carousel' && post.submission_id) {
          // Fetch all images for this submission
          const { data: images } = await supabase
            .from('submission_images')
            .select('url')
            .eq('submission_id', post.submission_id)
            .order('created_at', { ascending: true })
          
          if (images && images.length > 0) {
            return {
              ...post,
              carousel_images: images.map(img => img.url),
            }
          }
        }
        return post
      })
    )
    
    // Generate CSV
    const csvContent = generateSociamonialsCSV(postsWithCarouselImages, client.name, preferences, {
      scheduleType,
      includeFirstComment: false,
      teamNote: `Exported from SocialDrive AI on ${new Date().toISOString().slice(0, 10)}`
    })
    
    // Generate filename
    const filename = generateCSVFilename(client.name)
    
    // Return as downloadable CSV
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
    
  } catch (error: any) {
    console.error('CSV export error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate CSV' },
      { status: 500 }
    )
  }
}
