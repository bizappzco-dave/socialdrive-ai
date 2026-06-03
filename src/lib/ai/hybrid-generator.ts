/**
 * Hybrid AI Caption Generator
 * Routes to Ollama (standard) or Claude API (premium) based on client tier
 */

import Anthropic from '@anthropic-ai/sdk'
import { generateCaption as generateOllamaCaption, generatePostVariations } from '../ollama'

// Lazy initialization - create client when needed, not at module load time
function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not configured')
    return null
  }
  console.log('Creating Anthropic client with key length:', apiKey.length)
  return new Anthropic({ apiKey })
}

interface BrandContext {
  brand_name: string
  industry: string
  location: string
  target_audience: string
  tone: string
  personality: string
  avoid_words?: string[]
  key_messages?: string[]
  usps?: string[]
  cta?: string
  hashtags?: string[]
  emoji_style?: string
  post_length_pref?: string
  optimal_hashtag_count?: number
}

interface GeneratedPost {
  caption: string
  hashtags: string[]
  style: string
  emojiCount: number
}

/**
 * Generate caption using appropriate AI based on client tier
 * Default: Ollama Cloud (unlimited, qwen3.5:397b)
 * Premium: Claude API (requires valid key)
 */
export async function generateCaptionHybrid(params: {
  imageUrl: string
  brandContext: BrandContext
  clientTier: 'standard' | 'premium'
  claudeModel?: string
  briefText?: string
}): Promise<GeneratedPost> {
  const { claudeModel } = params
  
  // Check if Claude API key is actually configured
  const apiKey = process.env.ANTHROPIC_API_KEY
  const claudeEnabled = apiKey && !apiKey.includes('CHANGEME') && apiKey.length > 20
  
  // Use premium AI for premium clients WITH valid key
  if (params.clientTier === 'premium' && claudeEnabled) {
    const model = claudeModel || 'claude-sonnet-4-5-20250929'
    
    // Route to Mistral if specified
    if (model.includes('mistral')) {
      console.log('Using Mistral Large 3 via Fireworks AI (premium tier)')
      return generateWithLlamaVision({
        ...params,
        model,
      })
    }
    
    console.log('Using Claude API (premium tier)')
    return generateWithClaude({
      ...params,
      model,
    })
  }
  
  // Default to Ollama Cloud (unlimited, works for all tiers)
  console.log('Using Ollama Cloud (qwen3.5:397b)')
  return generateWithOllamaWrapper(params)
}

/**
 * Generate caption using Claude API with vision
 */
async function generateWithClaude(params: {
  imageUrl: string
  brandContext: BrandContext
  model: string
  briefText?: string
  retryCount?: number
}): Promise<GeneratedPost> {
  const { brandContext, briefText, model, retryCount = 0 } = params
  
  const anthropic = getAnthropicClient()
  console.log('Claude API: getAnthropicClient returned:', anthropic ? 'client initialized' : 'null')
  
  if (!anthropic) {
    console.error('Claude API: Anthropic client not initialized')
    console.error('ANTHROPIC_API_KEY env var:', process.env.ANTHROPIC_API_KEY ? 'SET (' + process.env.ANTHROPIC_API_KEY.length + ' chars)' : 'NOT SET')
    throw new Error('Claude API key not configured')
  }
  
  console.log('Claude API: Starting generation with model:', model, retryCount > 0 ? `(retry ${retryCount})` : '')
  
  // Fetch and convert image to base64, detect actual media type
  const imageResponse = await fetch(params.imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  // Detect actual media type from content-type header or file extension
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  const mediaType = contentType.includes('png') ? 'image/png' : 'image/jpeg'
  
  // Build the prompt - add stricter instructions on retry
  let prompt = buildClaudePrompt(brandContext, briefText)
  if (retryCount > 0) {
    prompt += '\n\n**CRITICAL RETRY NOTICE:** Your previous response was rejected. You MUST output ONLY the 2 lines below, nothing else. No reasoning, no explanations, no "The user wants..." text.'
  }
  
  try {
    console.log('Claude API: Calling messages.create...')
    const message = await anthropic.messages.create({
      model,
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      }],
    })
    
    console.log('Claude API: Success, received response')
    
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''
    
    // Parse Claude's response
    const parsed = parseClaudeResponse(responseText, brandContext)
    
    // Check if validation failed and we should retry
    if (parsed.caption === 'INVALID_CAPTION_RETRY' && retryCount < 2) {
      console.log('↻ Caption validation failed, retrying...')
      return generateWithClaude({ ...params, retryCount: retryCount + 1 })
    }
    
    if (parsed.caption === 'INVALID_CAPTION_RETRY') {
      console.error('✗ Caption validation failed after 2 retries, using fallback')
      // Return a safe fallback caption
      const fallbackHashtags = brandContext.hashtags 
        ? (Array.isArray(brandContext.hashtags) 
          ? brandContext.hashtags 
          : (brandContext.hashtags as string).split(' '))
        : ['#Business']
      
      return {
        caption: `Check out our latest at ${brandContext.brand_name}!`,
        hashtags: fallbackHashtags,
        style: 'premium',
        emojiCount: 0,
      }
    }
    
    return {
      caption: parsed.caption,
      hashtags: parsed.hashtags,
      style: parsed.style || 'premium',
      emojiCount: parsed.emojiCount,
    }
    
  } catch (error: any) {
    console.error('Claude generation failed:', error.message)
    throw new Error(`Claude API error: ${error.message}`)
  }
}

/**
 * Generate caption using Llama 3.2 Vision via Fireworks AI with vision
 */
async function generateWithLlamaVision(params: {
  imageUrl: string
  brandContext: BrandContext
  model: string
  briefText?: string
  retryCount?: number
}): Promise<GeneratedPost> {
  const { brandContext, briefText, retryCount = 0 } = params
  
  const apiKey = process.env.FIREWORKS_API_KEY
  if (!apiKey) {
    throw new Error('FIREWORKS_API_KEY not configured')
  }
  
  console.log('Mistral API: Starting generation', retryCount > 0 ? `(retry ${retryCount})` : '')
  
  // Use the image URL directly (Fireworks accepts http/https URLs)
  // No need to convert to base64
  
  // Build the prompt - add stricter instructions on retry
  let prompt = buildClaudePrompt(brandContext, briefText)
  if (retryCount > 0) {
    prompt += '\\n\\n**CRITICAL RETRY NOTICE:** Your previous response was rejected. You MUST output ONLY the 2 lines below, nothing else.'
  }
  
  try {
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/kimi-k2p6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: params.imageUrl,  // Use Supabase URL directly
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        }],
      }),
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Fireworks Kimi K2.6 API error: ${response.status} ${error}`)
    }
    
    const data = await response.json()
    console.log('Fireworks Kimi K2.6: Success')
    
    const responseText = data.choices[0]?.message?.content || ''
    
    // Parse response (same format as Claude)
    const parsed = parseClaudeResponse(responseText, brandContext)
    
    // Check if validation failed and we should retry
    if (parsed.caption === 'INVALID_CAPTION_RETRY' && retryCount < 2) {
      console.log('↻ Caption validation failed, retrying...')
      return generateWithLlamaVision({ ...params, retryCount: retryCount + 1 })
    }
    
    if (parsed.caption === 'INVALID_CAPTION_RETRY') {
      console.error('✗ Caption validation failed after 2 retries, using fallback')
      // Fallback with barber-specific hashtags (not generic ones)
      const barberFallbackTags = ['#BarberAcademy', '#BarberTraining', '#BarberLife', '#FadeGame', '#BarberSchool']
      return {
        caption: `New course at ${brandContext.brand_name}! ✂️ Book your spot today!`,
        hashtags: barberFallbackTags,
        style: 'premium',
        emojiCount: 1,
      }
    }
    
    return {
      caption: parsed.caption,
      hashtags: parsed.hashtags,
      style: parsed.style || 'premium',
      emojiCount: parsed.emojiCount,
    }
    
  } catch (error: any) {
    console.error('Mistral generation failed:', error.message)
    throw new Error(`Fireworks API error: ${error.message}`)
  }
}

/**
 * Build prompt for Claude/Kimi
 */
function buildClaudePrompt(brandContext: BrandContext, briefText?: string): string {
  return `You are a professional social media content creator for a BARBER ACADEMY. Generate ONE engaging caption based on the image.

## Brand Context - THIS IS A BARBER ACADEMY
- **Brand:** ${brandContext.brand_name}
- **Industry:** ${brandContext.industry} (BARBER/HAIR TRAINING - all captions must be about barbering)
- **Location:** ${brandContext.location}
- **Tone:** ${brandContext.tone}
- **CTA:** ${brandContext.cta || 'Contact us today'}

**CRITICAL: This is a barber academy that trains barbers. Even if the image shows cameras, lights, or studio equipment, this is for barber training content. All captions MUST be about barbering, hair cutting, fade training, or barber education.**

${briefText ? `## Client Brief: ${briefText}` : ''}

## Rules - FOLLOW EXACTLY
1. **ENGLISH ONLY** - no other languages
2. **MAX 280 CHARACTERS** total (caption + hashtags + emojis)
3. **Output ONLY 2 lines** - CAPTION and HASHTAGS, nothing else
4. **NEVER explain your reasoning** - no "The user wants...", no "Let me analyze..."
5. **NEVER describe what you see in the image** - just create the barber academy caption
6. **ALWAYS assume this is about barbering** - even if image shows cameras/lights (it's for training videos)
7. Use 1-2 emojis max
8. **HASHTAGS MUST BE BARBER/HAIR INDUSTRY SPECIFIC** - not generic, not film/video!

## Hashtag Strategy - CRITICAL
Generate 5-8 hashtags that are SPECIFIC to barbering/hair training:

**GOOD examples (barber academy):**
- #BarberAcademy #BarberTraining #BarberLife #FadeGame #MensHair #BarberSchool #HaircutTraining #BarberEducation #DublinBarber #LearnToCutHair

**GOOD examples (barber shop):**
- #BarberLife #FadeGame #MensHair #DublinBarber #HaircutGoals #BarberShop #FreshFades #GroomingLife

**BAD examples (wrong industry - DO NOT USE):**
- ❌ #FilmProduction ❌ #VideoProduction ❌ #StudioLife (this is NOT a film studio!)
- ❌ #LocalBusiness ❌ #Ireland ❌ #SmallBusiness (too generic!)

## Output Format - YOU MUST FOLLOW THIS EXACTLY
You MUST output ONLY these 2 lines, nothing before, nothing after:

CAPTION: [your caption here with emojis]
HASHTAGS: #BarberTag1 #BarberTag2 #BarberTag3 #BarberTag4 #BarberTag5

## Examples of CORRECT output:
CAPTION: New barber just joined the No Label Academy team! ✂️ Ready to train the next generation of fades.
HASHTAGS: #BarberAcademy #BarberTraining #BarberLife #FadeGame #DublinBarber

CAPTION: Master the perfect fade at No Label Academy! 🚀 Expert barber training in Ireland. Book your course now!
HASHTAGS: #BarberTraining #BarberSchool #LearnToCutHair #BarberEducation #CareerChange

## Examples of WRONG output (DO NOT DO THIS):
❌ "The user wants me to create a caption..."
❌ "I can see studio lights and cameras..." (IRRELEVANT - it's for barber training videos!)
❌ #FilmProduction #VideoProduction (WRONG INDUSTRY!)
❌ #LocalBusiness #Ireland (too generic!)
❌ Any explanation, reasoning, or meta-commentary

**CRITICAL: If you output anything other than the 2 lines above, the system will fail. ONLY output:
CAPTION: [text]
HASHTAGS: [tags]

Nothing else. No explanations. No reasoning. Just the 2 lines. This is a BARBER ACADEMY - all captions about barbering!**`
}

/**
 * Validate caption quality - detect AI reasoning leaks and placeholders
 */
function isValidCaption(caption: string): boolean {
  const badPatterns = [
    /^the user wants/i,
    /^the client wants/i,
    /^the customer wants/i,
    /^let me /i,
    /^i need to/i,
    /^i should/i,
    /^i can see/i,
    /^the image (shows|appears|contains)/i,
    /^based on the image/i,
    /^\[text\]/i,
    /^\[caption\]/i,
    /^caption:/i,
    /^hashtag:/i,
    /^here is/i,
    /^here's/i,
    /^let me draft/i,
    /^let me create/i,
    /^let me count/i,
    /^let me analyze/i,
    /^i'll generate/i,
    /^i will generate/i,
    /^i'll create/i,
    /^i will create/i,
  ]
  
  // Check for bad patterns
  for (const pattern of badPatterns) {
    if (pattern.test(caption)) {
      console.log('✗ Caption failed validation:', pattern.source, '-', caption.slice(0, 50))
      return false
    }
  }
  
  // Check for placeholder text
  const placeholders = ['[text]', '[caption]', '[hashtags]', 'CAPTION:', 'HASHTAGS:']
  for (const placeholder of placeholders) {
    if (caption.toLowerCase().includes(placeholder.toLowerCase()) && !caption.startsWith('CAPTION:')) {
      console.log('✗ Caption contains placeholder:', placeholder, '-', caption.slice(0, 50))
      return false
    }
  }
  
  // Must have some actual content (at least 10 chars)
  if (caption.length < 10) {
    console.log('✗ Caption too short:', caption.length, 'chars')
    return false
  }
  
  console.log('✓ Caption passed validation')
  return true
}

/**
 * Parse Claude's response with validation
 */
function parseClaudeResponse(response: string, brandContext: BrandContext): {
  caption: string
  hashtags: string[]
  style?: string
  emojiCount: number
} {
  // Extract caption and hashtags
  const captionMatch = response.match(/CAPTION:\s*(.+?)(?:\nHASHTAGS:|$)/s)
  const hashtagMatch = response.match(/HASHTAGS:\s*(.+)/i)
  
  let caption = captionMatch ? captionMatch[1].trim() : response
  let hashtags: string[] = []
  
  if (hashtagMatch) {
    const hashtagStr = hashtagMatch[1]
    hashtags = hashtagStr
      .split(/[\s,]+/)
      .map(h => h.trim())
      .filter(h => h.startsWith('#'))
  }
  
  // If no hashtags extracted, use brand defaults
  if (hashtags.length === 0) {
    const defaultTags = brandContext.hashtags
    if (Array.isArray(defaultTags)) {
      hashtags = defaultTags
    } else if (typeof defaultTags === 'string') {
      hashtags = (defaultTags as string).split(' ').filter((t: string) => t.trim())
    }
  }
  
  // Validate caption quality - reject AI reasoning leaks
  if (!isValidCaption(caption)) {
    console.warn('⚠ Caption validation failed, using fallback')
    // Return empty caption to signal failure - caller should retry
    caption = 'INVALID_CAPTION_RETRY'
  }
  
  // Count emojis
  const emojiRegex = /[\p{Emoji}]/u
  const emojiCount = (caption.match(emojiRegex) || []).length
  
  return {
    caption,
    hashtags,
    style: 'premium',
    emojiCount,
  }
}

/**
 * Generate multiple post variations with hybrid routing
 * Routes to Ollama (standard) or Claude API (premium) based on client tier
 */
export async function generatePostVariationsHybrid(params: {
  imageUrl: string
  brandContext: BrandContext
  clientTier: 'standard' | 'premium'
  claudeModel?: string
  count?: number
  styles?: string[]
  briefText?: string
}): Promise<GeneratedPost[]> {
  const { count = 3, claudeModel } = params
  
  const variations: GeneratedPost[] = []
  
  // Check if Claude is actually available
  const apiKey = process.env.ANTHROPIC_API_KEY
  const claudeEnabled = apiKey && !apiKey.includes('CHANGEME') && apiKey.length > 20
  
  // Check if Fireworks is available (Mistral)
  const fireworksKey = process.env.FIREWORKS_API_KEY
  const fireworksEnabled = fireworksKey && !fireworksKey.includes('CHANGEME') && fireworksKey.length > 20
  
  // Priority: Claude (premium) → Fireworks Mistral (standard) → Ollama (fallback)
  const useClaude = params.clientTier === 'premium' && claudeEnabled
  const useFireworks = !useClaude && fireworksEnabled
  
  console.log(`Hybrid routing: clientTier=${params.clientTier}, claudeEnabled=${claudeEnabled}, fireworksEnabled=${fireworksEnabled}`)
  console.log(`Using: ${useClaude ? 'Claude' : useFireworks ? 'Fireworks Mistral' : 'Ollama'}`)
  
  // Generate all variations with appropriate AI
  for (let i = 0; i < count; i++) {
    try {
      if (useClaude) {
        const result = await generateWithClaude({
          ...params,
          model: claudeModel || 'claude-sonnet-4-5-20250929',
        })
        variations.push(result)
        console.log('✓ Claude variation', i + 1, 'generated')
      } else if (useFireworks) {
        const result = await generateWithLlamaVision({
          ...params,
          model: 'accounts/fireworks/models/kimi-k2-6',
        })
        variations.push(result)
        console.log('✓ Fireworks Kimi K2.6 variation', i + 1, 'generated')
      } else {
        // Fall back to Ollama for standard tier or when Claude credits exhausted
        const result = await generateWithOllamaWrapper(params)
        variations.push(result)
        console.log('✓ Ollama variation', i + 1, 'generated')
      }
    } catch (error: any) {
      console.error('✗ Generation failed:', error.message)
      throw error
    }
  }
  
  return variations
}

/**
 * Wrapper to call Ollama generatePostVariations with correct interface
 */
async function generateWithOllamaWrapper(params: {
  imageUrl: string
  brandContext: BrandContext
  clientTier: 'standard' | 'premium'
  claudeModel?: string
  count?: number
  styles?: string[]
  briefText?: string
}): Promise<GeneratedPost> {
  // Use the existing Ollama generateCaption function
  const result = await generateOllamaCaption({
    imageUrl: params.imageUrl,
    brandContext: params.brandContext,
    platform: 'instagram',
    briefText: params.briefText,
  })
  
  return {
    caption: result.caption,
    hashtags: result.hashtags,
    style: 'standard',
    emojiCount: result.emojiCount,
  }
}

/**
 * Get tone for specific post style
 */
function getToneForStyle(style: string, brandContext: BrandContext): string {
  const styleTones: Record<string, string> = {
    short_statement: 'Bold, punchy, direct',
    mission_post: 'Inspirational, purpose-driven, impactful',
    brand_teaser: 'Mysterious, intriguing, engaging',
    question: 'Conversational, curious, inviting',
    story: 'Narrative, emotional, relatable',
  }
  
  return styleTones[style] || brandContext.tone
}

/**
 * Get preferred length for specific post style
 */
function getLengthForStyle(style: string): string {
  const styleLengths: Record<string, string> = {
    short_statement: 'short',
    mission_post: 'medium',
    brand_teaser: 'short',
    question: 'short',
    story: 'long',
  }
  
  return styleLengths[style] || 'medium'
}
