import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getBrandContext } from '@/lib/supabase/queries'
import { generatePostVariationsHybrid } from '@/lib/ai/hybrid-generator'

/**
 * POST /api/submissions/upload/[token]/submit
 * 
 * Submit a completed upload and auto-generate posts
 */
export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    console.log('Submit route called for token:', params.token)
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Service Role Key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('Anthropic Key configured:', !!process.env.ANTHROPIC_API_KEY)
    
    // Test Supabase admin client immediately
    const supabase = createAdminClient()
    console.log('Supabase client created')
    
    // Quick test query to verify connection
    const { data: testQuery, error: testError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(1)
    
    if (testError) {
      console.error('❌ Supabase test query FAILED:', testError.message)
      console.error('❌ Error code:', testError.code)
      console.error('❌ Error details:', JSON.stringify(testError, null, 2))
      throw new Error('Supabase connection failed: ' + testError.message)
    }
    console.log('✅ Supabase test query SUCCESS, found', testQuery?.length, 'clients')
    
    const body = await request.json()
    const { uploadType, platforms, briefText, hasVoiceNote, images } = body
    
    // Validate platforms
    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one platform' },
        { status: 400 }
      )
    }
    
    // Validate upload type
    const validTypes = ['images', 'carousel', 'video']
    const type = (uploadType || 'images') as 'images' | 'carousel' | 'video'
    
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      )
    }
    
    // Validate image count based on type
    const minImages = type === 'video' ? 3 : 3
    const maxImages = type === 'images' ? 5 : type === 'carousel' ? 10 : 20
    
    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }
    
    if (images.length < minImages) {
      return NextResponse.json(
        { error: `Minimum ${minImages} images required for ${type} upload` },
        { status: 400 }
      )
    }
    
    // Get submission
    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select('*, clients(*)')
      .eq('upload_token', params.token)
      .single()
    
    if (subError || !submission) {
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 404 }
      )
    }
    
    // Update submission status
    console.log('Updating submission status...')
    const updateData: any = {
      status: 'generating',
      brief_text: briefText,
      submission_type: type,
      post_count: type === 'images' ? images.length * 3 : images.length,
      updated_at: new Date().toISOString(),
    }
    
    // Only update platforms if the column exists (handle backwards compatibility)
    if (platforms && Array.isArray(platforms)) {
      try {
        await supabase
          .from('submissions')
          .update({ platforms: platforms })
          .eq('id', submission.id)
        console.log('Platforms updated successfully:', platforms)
      } catch (platformError: any) {
        console.warn('Failed to update platforms column (may not exist):', platformError.message)
        // Continue anyway - platforms is optional
      }
    }
    
    const { error: updateError } = await supabase
      .from('submissions')
      .update(updateData)
      .eq('id', submission.id)
    
    if (updateError) {
      console.error('Failed to update submission:', updateError)
      throw new Error('Failed to update submission: ' + updateError.message)
    }
    console.log('Submission updated successfully')
    
    // Store images
    console.log('Storing images...')
    try {
      await supabase
        .from('submission_images')
        .insert(
          images.map((img: any, index: number) => ({
            submission_id: submission.id,
            image_url: img.url,
            image_filename: img.filename,
            image_size: img.size,
            image_context: img.context || '',
            sort_order: index,
          }))
        )
      console.log('Images stored successfully')
    } catch (imgError: any) {
      console.error('Failed to store images:', imgError.message)
      throw new Error('Failed to store images: ' + imgError.message)
    }
    
    // Get brand context (optional for Simple tier)
    console.log('Getting brand context...')
    let brandContext: any = null
    try {
      brandContext = await getBrandContext(submission.client_id)
      if (brandContext) {
        console.log('Brand context loaded successfully')
      } else {
        console.log('No brand context found - using defaults for Simple tier')
      }
    } catch (brandError: any) {
      console.warn('Brand context lookup failed:', brandError.message)
      console.log('Continuing with defaults...')
    }
    
    // Use brand context or sensible defaults
    const context = brandContext || {
      brand_name: submission.client_name,
      industry: 'Local Business',
      location: 'Ireland',
      target_audience: 'Local customers',
      tone: 'Friendly and professional',
      personality: 'Approachable, authentic, trustworthy',
      avoid_words: '',
      key_messages: 'Quality products, excellent service, local business',
      usps: 'Fast delivery, great customer service, locally owned',
      cta: 'Contact us today',
      hashtags: '#LocalBusiness #Ireland #SmallBusiness',
      emoji_style: 'Moderate',
      post_length_pref: 'Medium',
      optimal_hashtag_count: 5,
    }
    
    // Ensure hashtags is an array (handle both string and array from DB)
    if (typeof context.hashtags === 'string') {
      context.hashtags = context.hashtags.split(' ').filter(t => t.trim())
    } else if (!Array.isArray(context.hashtags)) {
      context.hashtags = []
    }
    
    // Determine client's AI tier (default to standard if not set or column missing)
    const clientTier = (submission.clients as any)?.ai_tier || 'standard'
    const claudeModel = (submission.clients as any)?.claude_model || 'claude-sonnet-4-5-20250929'
    
    console.log('=== SUBMIT DEBUG ===')
    console.log('Client object:', JSON.stringify(submission.clients, null, 2))
    console.log('Client tier:', clientTier)
    console.log('Claude model:', claudeModel)
    console.log('Anthropic key configured:', !!process.env.ANTHROPIC_API_KEY)
    console.log('Anthropic key length:', process.env.ANTHROPIC_API_KEY?.length)
    console.log('Anthropic key starts with:', process.env.ANTHROPIC_API_KEY?.substring(0, 15))
    console.log('=====================')
    
    // Generate posts for each image using hybrid router
    const allPosts = []
    
    // For carousel/video, we'll generate one post per image but create media later
    for (const image of images) {
      console.log('Generating posts for image:', image.url)
      
      // For non-image types, generate 1 variation per image (will be combined later)
      const variationsCount = type === 'images' ? 3 : 1
      
      let variations
      try {
        variations = await generatePostVariationsHybrid({
          imageUrl: image.url,
          brandContext: {
            brand_name: context.brand_name,
            industry: context.industry,
            location: context.location,
            target_audience: context.target_audience,
            tone: context.tone,
            personality: context.personality,
            avoid_words: context.avoid_words,
            key_messages: context.key_messages,
            usps: context.usps,
            cta: context.cta,
            hashtags: context.hashtags,
            emoji_style: context.emoji_style,
            post_length_pref: context.post_length_pref,
            optimal_hashtag_count: context.optimal_hashtag_count,
          },
          clientTier: clientTier,
          claudeModel: claudeModel,
          count: variationsCount,
          briefText: briefText,
        })
        console.log('✓ Generated', variations.length, 'variations')
      } catch (genError: any) {
        console.error('✗ Generation failed:', genError.message)
        console.error('✗ Error name:', genError.name)
        console.error('✗ Error stack:', genError.stack?.substring(0, 500))
        throw new Error('Failed to generate captions: ' + genError.message)
      }
      
      for (const variation of variations) {
        // Validate caption length (Sociamonials limit: 280 chars)
        const fullCaption = variation.caption + ' ' + variation.hashtags.join(' ')
        if (fullCaption.length > 280) {
          console.warn(`Caption too long (${fullCaption.length} chars), truncating...`)
          // Truncate caption to fit hashtags
          const hashtagLength = variation.hashtags.join(' ').length + 1 // +1 for space
          const maxCaptionLength = 275 - hashtagLength // Leave 5 char buffer
          variation.caption = variation.caption.substring(0, maxCaptionLength).trim() + '...'
        }
        
        const { data: post, error: postError } = await supabase
          .from('posts')
          .insert({
            client_id: submission.client_id,
            image_url: image.url,
            image_filename: image.filename,
            caption_text: variation.caption,
            caption_style: variation.style,
            caption_length: variation.caption.split(' ').length,
            hashtag_count: variation.hashtags.length,
            hashtags: variation.hashtags,
            emoji_count: variation.emojiCount,
            emojis_used: variation.caption.match(/[\p{Emoji}]/gu) || [],
            submission_id: submission.id,
            post_type: type === 'carousel' || type === 'video' ? type : 'image',
          })
          .select()
          .single()
        
        if (postError) {
          console.error('Failed to create post:', postError)
        } else {
          allPosts.push(post)
        }
      }
    }
    
    // For carousel/video types, generate the media file for selected platforms
    let generatedMediaUrls: { platform: string; format: string; size: string; url: string }[] = []
    
    if ((type === 'carousel' || type === 'video') && platforms.length > 0) {
      try {
        console.log(`Generating ${type} media for platforms:`, platforms)
        
        // Call the platform-aware video creator script
        const { exec } = await import('child_process')
        const { promisify } = await import('util')
        const execPromise = promisify(exec)
        
        const imagePaths = images.map(img => img.url).join(' ')
        const platformArg = platforms.join(',')
        const baseOutputPath = `/tmp/${type}-${submission.id}`
        
        // Use the new video-creator-platforms.py script
        const command = `cd /home/dpmcg/.openclaw/workspace/socialdrive-ai && \
          python3 video-creator-platforms.py ${type} ${imagePaths} \
          --platforms ${platformArg} \
          --output ${baseOutputPath} 2>&1`
        
        console.log('Running command:', command)
        const { stdout, stderr } = await execPromise(command, { timeout: 120000 })
        
        console.log('Media generation output:', stdout)
        if (stderr) console.log('Media generation errors:', stderr)
        
        // Parse output to get generated file paths
        // Format: "✓ Generated for: instagram,tiktok | Size: 1080x1350 | File: /tmp/carousel-xxx_1080x1350.gif"
        const outputLines = stdout.split('\n')
        for (const line of outputLines) {
          if (line.includes('✓ Generated') || line.includes('File:')) {
            // Extract platform, size, and file path
            const platformMatch = line.match(/for: ([\w,]+)/)
            const sizeMatch = line.match(/Size: (\d+x\d+)/)
            const fileMatch = line.match(/File: ([\/\w\-.]+)/)
            
            if (platformMatch && sizeMatch && fileMatch) {
              const platformList = platformMatch[1].split(',')
              const size = sizeMatch[1]
              const filePath = fileMatch[1]
              
              // Determine format name from size
              let formatName = 'Unknown'
              if (size === '1080x1350') formatName = 'Portrait'
              else if (size === '1080x1920') formatName = 'Vertical'
              else if (size === '1080x1080') formatName = 'Square'
              
              generatedMediaUrls.push({
                platform: platformList[0], // Use first platform
                format: formatName,
                size: size,
                url: filePath
              })
            }
          }
        }
        
        console.log(`✓ Generated ${generatedMediaUrls.length} format(s):`, generatedMediaUrls)
        
        // TODO: Upload generated files to Supabase Storage
        // For now, use local paths (will work for testing)
        // In production, upload to Supabase and use those URLs
        
        // Update posts with the generated media URLs
        if (allPosts.length > 0 && generatedMediaUrls.length > 0) {
          // Use the first generated format as primary video_url
          const primaryFormat = generatedMediaUrls[0]
          
          await supabase
            .from('posts')
            .update({ 
              video_url: primaryFormat.url,
              post_type: type,
              // Store all formats in metadata for future use
              // metadata: { formats: generatedMediaUrls }
            })
            .in('id', allPosts.map(p => p.id))
          
          console.log(`✓ Updated posts with video URL:`, primaryFormat.url)
        }
        
      } catch (mediaError: any) {
        console.error(`✗ Failed to generate ${type} media:`, mediaError.message)
        console.error('Error stack:', mediaError.stack?.substring(0, 500))
        // Don't fail the whole submission, just log the error
        // Posts will still be created without the media
      }
    }
    
    // Update submission status to ready
    await supabase
      .from('submissions')
      .update({
        status: 'ready',
        post_count: allPosts.length,
        generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', submission.id)
    
    // Auto-delete any posts with non-English text (CJK characters)
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/u
    const badPosts = allPosts.filter(post => cjkRegex.test(post.caption_text))
    
    if (badPosts.length > 0) {
      console.log(`Auto-deleting ${badPosts.length} posts with non-English text`)
      
      await supabase
        .from('posts')
        .update({ deleted: true, deleted_at: new Date().toISOString() })
        .in('id', badPosts.map(p => p.id))
      
      // Update final count
      await supabase
        .from('submissions')
        .update({ post_count: allPosts.length - badPosts.length })
        .eq('id', submission.id)
    }
    
    console.log('WhatsApp notification would be sent to:', submission.client_phone)
    
    return NextResponse.json({
      success: true,
      postId: allPosts.length,
      message: 'Posts generated successfully',
    })
    
  } catch (error: any) {
    console.error('=== SUBMIT ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error name:', error.name)
    console.error('Error stack:', error.stack?.substring(0, 1000))
    console.error('Error details:', JSON.stringify(error, null, 2))
    console.error('=====================')
    
    const errorSupabase = createAdminClient()
    await errorSupabase
      .from('submissions')
      .update({
        status: 'error',
        updated_at: new Date().toISOString(),
      })
      .eq('upload_token', params.token)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process submission',
        errorName: error.name || 'Unknown',
        errorDetails: error.toString(),
        errorCode: (error as any).code || null,
        errorCause: (error as any).cause || null,
        errorStack: (error as any).stack?.substring(0, 1000) || null,
      },
      { status: 500 }
    )
  }
}
