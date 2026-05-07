import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBrandContext, createPost } from '@/lib/supabase/queries'
import { generatePostVariations, checkOllamaAvailability } from '@/lib/ollama'

/**
 * POST /api/generate/captions
 * 
 * Generate caption variations for an image using Ollama Pro
 * 
 * Body:
 * - clientId: Client ID
 * - imageUrl: URL of the image to generate captions for
 * - count: Number of variations (default: 5)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clientId, imageUrl, count = 5 } = body
    
    if (!clientId || !imageUrl) {
      return NextResponse.json(
        { error: 'clientId and imageUrl are required' },
        { status: 400 }
      )
    }
    
    // Check if Ollama is available
    const ollamaStatus = await checkOllamaAvailability()
    if (!ollamaStatus.available) {
      return NextResponse.json(
        { 
          error: 'Ollama not available',
          details: ollamaStatus.error,
          hint: 'Make sure Ollama is running: ollama serve'
        },
        { status: 503 }
      )
    }
    
    // Get brand context
    const brandContext = await getBrandContext(clientId)
    if (!brandContext) {
      return NextResponse.json(
        { error: 'Brand context not found for this client. Please set up brand profile first.' },
        { status: 404 }
      )
    }
    
    // Generate caption variations
    const variations = await generatePostVariations({
      imageUrl,
      brandContext: {
        brand_name: brandContext.brand_name,
        industry: brandContext.industry,
        location: brandContext.location,
        target_audience: brandContext.target_audience,
        tone: brandContext.tone,
        personality: brandContext.personality,
        avoid_words: brandContext.avoid_words,
        key_messages: brandContext.key_messages,
        usps: brandContext.usps,
        cta: brandContext.cta,
        hashtags: brandContext.hashtags,
        emoji_style: brandContext.emoji_style,
        post_length_pref: brandContext.post_length_pref,
        optimal_hashtag_count: brandContext.optimal_hashtag_count,
      },
      count,
    })
    
    // Store posts in database
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const createdPosts = []
    
    for (const variation of variations) {
      const postData = {
        client_id: clientId,
        image_url: imageUrl,
        image_filename: imageUrl.split('/').pop() || 'image.jpg',
        caption_text: variation.caption,
        caption_style: variation.style,
        caption_length: variation.caption.split(' ').length,
        hashtag_count: variation.hashtags.length,
        hashtags: variation.hashtags,
        emoji_count: variation.emojiCount,
        emojis_used: variation.caption.match(/\p{Emoji}/u) || [],
      }
      
      const post = await createPost(postData)
      createdPosts.push(post)
    }
    
    return NextResponse.json({
      success: true,
      count: createdPosts.length,
      posts: createdPosts,
      ollamaModel: ollamaStatus.models?.[0] || 'unknown',
    })
    
  } catch (error: any) {
    console.error('Caption generation failed:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate captions' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/generate/captions
 * 
 * Check Ollama status
 */
export async function GET() {
  try {
    const status = await checkOllamaAvailability()
    return NextResponse.json(status)
  } catch (error: any) {
    return NextResponse.json(
      { available: false, error: error.message },
      { status: 500 }
    )
  }
}
