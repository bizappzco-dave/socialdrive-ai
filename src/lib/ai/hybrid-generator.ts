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
 * TEMPORARY: Force all clients to use Claude for testing
 */
export async function generateCaptionHybrid(params: {
  imageUrl: string
  brandContext: BrandContext
  clientTier: 'standard' | 'premium'
  claudeModel?: string
  briefText?: string
}): Promise<GeneratedPost> {
  const { claudeModel } = params
  
  // FORCE CLAUDE FOR ALL - testing
  console.log('FORCE CLAUDE: Using Claude for all clients (testing mode)')
  return generateWithClaude({
    ...params,
    model: claudeModel || 'claude-sonnet-4-5-20250929',
  })
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
  
  // Fetch and convert image to base64
  const imageBuffer = await fetch(params.imageUrl).then(r => r.arrayBuffer())
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
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
              media_type: 'image/jpeg',
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
 * Build prompt for Claude
 */
function buildClaudePrompt(brandContext: BrandContext, briefText?: string): string {
  return `You are a professional social media content creator for a barber shop. Analyze the image and generate an engaging caption.

## Brand Context
**Brand Name:** ${brandContext.brand_name}
**Industry:** ${brandContext.industry}
**Location:** ${brandContext.location}
**Target Audience:** ${brandContext.target_audience}
**Tone:** ${brandContext.tone}
**Personality:** ${brandContext.personality}
**CTA:** ${brandContext.cta || 'Book your cut today'}
**Emoji Style:** ${brandContext.emoji_style || 'moderate'}
**Post Length:** ${brandContext.post_length_pref || 'medium'}

${briefText ? `## Client Brief
${briefText}

Incorporate this brief into the caption.` : ''}

## Guidelines
- Write in ENGLISH ONLY - do not use any other languages
- Describe what you see in the image specifically
- **MAX 280 CHARACTERS** including hashtags and emojis (Sociamonials limit)
- **Keep it short and punchy** - social media users scan, they don't read essays
- Write in the brand's tone and personality
- Include ${brandContext.emoji_style === 'freely' ? '2-3' : brandContext.emoji_style === 'sparingly' ? '1' : '1-2'} emojis (they count toward character limit!)
- Use ${brandContext.post_length_pref === 'short' ? '1 sentence' : brandContext.post_length_pref === 'long' ? '2-3 short sentences' : '1-2 short sentences'}
- Include a call-to-action
- Make it engaging and authentic

## Standard Hashtags
${Array.isArray(brandContext.hashtags) ? brandContext.hashtags.map(tag => `- ${tag}`).join('\n') : (brandContext.hashtags || '').split(' ').filter(t => t.trim()).map(tag => `- ${tag}`).join('\n')}

## Output Format
Return in this exact format:
CAPTION: [your caption here]
HASHTAGS: [comma-separated hashtags]

Do not include any other text.`
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
 * TEMPORARY: Force all clients to use Claude for testing
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
  
  // FORCE CLAUDE FOR ALL - testing
  console.log('FORCE CLAUDE: Using Claude for all clients (testing mode)')
  
  // Generate all variations with Claude
  for (let i = 0; i < count; i++) {
    try {
      const result = await generateWithClaude({
        ...params,
        model: claudeModel || 'claude-sonnet-4-5-20250929',
      })
      variations.push(result)
      console.log('✓ Claude variation', i + 1, 'generated')
    } catch (error: any) {
      console.error('✗ Claude variation', i + 1, 'failed:', error.message)
      throw error
    }
  }
  
  return variations
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
