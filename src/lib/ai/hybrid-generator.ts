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
      return generateWithMistral({
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
  return generateWithOllama(params)
}

/**
 * Generate caption using Claude API with vision
 */
async function generateWithClaude(params: {
  imageUrl: string
  brandContext: BrandContext
  model: string
  briefText?: string
}): Promise<GeneratedPost> {
  const { brandContext, briefText, model } = params
  
  const anthropic = getAnthropicClient()
  console.log('Claude API: getAnthropicClient returned:', anthropic ? 'client initialized' : 'null')
  
  if (!anthropic) {
    console.error('Claude API: Anthropic client not initialized')
    console.error('ANTHROPIC_API_KEY env var:', process.env.ANTHROPIC_API_KEY ? 'SET (' + process.env.ANTHROPIC_API_KEY.length + ' chars)' : 'NOT SET')
    throw new Error('Claude API key not configured')
  }
  
  console.log('Claude API: Starting generation with model:', model)
  
  // Fetch and convert image to base64, detect actual media type
  const imageResponse = await fetch(params.imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  // Detect actual media type from content-type header or file extension
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  const mediaType = contentType.includes('png') ? 'image/png' : 'image/jpeg'
  
  // Build the prompt
  const prompt = buildClaudePrompt(brandContext, briefText)
  
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
}): Promise<GeneratedPost> {
  const { brandContext, briefText } = params
  
  const apiKey = process.env.FIREWORKS_API_KEY
  if (!apiKey) {
    throw new Error('FIREWORKS_API_KEY not configured')
  }
  
  console.log('Mistral API: Starting generation')
  
  // Fetch image
  const imageResponse = await fetch(params.imageUrl)
  const imageBuffer = await imageResponse.arrayBuffer()
  
  // Convert to base64 (Node.js only - this runs server-side)
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
  
  // Build the prompt
  const prompt = buildClaudePrompt(brandContext, briefText)
  
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
                url: `data:${contentType};base64,${base64Image}`,
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
  return `You are a professional social media content creator. Generate ONE engaging caption based on the image.

## Brand Context
- **Brand:** ${brandContext.brand_name}
- **Industry:** ${brandContext.industry}
- **Location:** ${brandContext.location}
- **Tone:** ${brandContext.tone}
- **CTA:** ${brandContext.cta || 'Contact us today'}

${briefText ? `## Client Brief: ${briefText}` : ''}

## Rules
1. **ENGLISH ONLY** - no other languages
2. **MAX 280 CHARACTERS** total (caption + hashtags + emojis)
3. **NO explanations** - just the caption and hashtags
4. **NO thinking out loud** - do not describe your reasoning
5. **NO meta-commentary** - do not say "I'll create" or "Here's a caption"
6. Use 1-2 emojis max
7. Include 3-5 relevant hashtags

## Output Format - CRITICAL
You MUST output ONLY this format, nothing else:

CAPTION: [your caption here with emojis]
HASHTAGS: #Tag1 #Tag2 #Tag3 #Tag4 #Tag5

## Examples of CORRECT output:
CAPTION: Transform your business with No Label Academy! 🚀 Expert training for Irish businesses. Book now!
HASHTAGS: #LocalBusiness #Ireland #SmallBusiness #Training #NoLabelAcademy

## Examples of WRONG output (DO NOT DO THIS):
❌ "The user wants me to create a caption..."
❌ "Let me analyze the image..."
❌ "I'll write a caption about..."
❌ Any explanation or reasoning

**Remember: Output ONLY the CAPTION and HASHTAGS lines. Nothing else.**`
}

/**
 * Parse Claude's response
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
      hashtags = defaultTags.split(' ').filter(t => t.trim())
    }
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
          model: 'accounts/fireworks/models/kimi-k2p6',
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
