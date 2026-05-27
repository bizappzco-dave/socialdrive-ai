/**
 * Ollama Pro Integration
 * 
 * Local LLM for content generation (cheap, fast, private)
 * Default model: qwen3.5:cloud (or qwen2.5:7b for smaller footprint)
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3.5:cloud'

interface OllamaRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    num_predict?: number
  }
}

interface OllamaResponse {
  model: string
  response: string
  done: boolean
}

/**
 * Generate text using Ollama
 */
export async function generateText(prompt: string, options?: {
  temperature?: number
  maxTokens?: number
  model?: string
}): Promise<string> {
  const model = options?.model || OLLAMA_MODEL
  
  const requestBody: OllamaRequest = {
    model,
    prompt,
    stream: false,
    options: {
      temperature: options?.temperature ?? 0.7,
      num_predict: options?.maxTokens ?? 500,
    }
  }

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Ollama API error: ${response.status} - ${error}`)
    }

    const data: OllamaResponse = await response.json()
    return data.response.trim()
    
  } catch (error: any) {
    console.error('Ollama generation failed:', error.message)
    throw new Error(`Failed to generate content: ${error.message}`)
  }
}

/**
 * Generate caption for social media post
 */
export async function generateCaption(params: {
  imageUrl: string
  brandContext: BrandContext
  platform?: 'instagram' | 'facebook' | 'linkedin' | 'twitter'
  postType?: 'image' | 'video' | 'carousel'
  briefText?: string  // Optional brief from client
}): Promise<{
  caption: string
  hashtags: string[]
  emojiCount: number
}> {
  const { brandContext, platform = 'instagram', postType = 'image', briefText } = params
  
  // Build the prompt with brand context
  const prompt = buildCaptionPrompt({
    imageUrl: params.imageUrl,
    brandContext,
    platform,
    postType,
    briefText,
  })
  
  const response = await generateText(prompt, {
    temperature: 0.8, // More creative for captions
    maxTokens: 300,
  })
  
  // Parse the response
  const parsed = parseCaptionResponse(response, brandContext)
  
  return parsed
}

/**
 * Build prompt for caption generation
 */
function buildCaptionPrompt(params: {
  imageUrl: string
  brandContext: BrandContext
  platform: string
  postType: string
  briefText?: string
}): string {
  const { brandContext, briefText } = params
  
  return `CRITICAL: You must write ONLY in English. Do not use ANY Chinese, Japanese, Korean, Arabic, or other non-English characters.

You are a professional social media content creator for a barber shop in Dublin, Ireland. Generate an engaging social media caption in ENGLISH ONLY.

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

## CRITICAL RULES
- **ENGLISH ONLY** - Use ONLY the Latin alphabet (A-Z, a-z) and standard emojis
- **NO Chinese, Japanese, Korean, Arabic, Cyrillic, or any other non-English characters**
- **MAX 280 CHARACTERS** including hashtags and emojis (Sociamonials limit)
- **Keep it short and punchy** - social media users scan, they don't read essays
- If you accidentally write non-English text, you will break the client's social media
- Write in the brand's tone and personality
- Include ${brandContext.emoji_style === 'freely' ? '2-3' : brandContext.emoji_style === 'sparingly' ? '1' : '1-2'} emojis (they count toward character limit!)
- Use ${brandContext.post_length_pref === 'short' ? '1 sentence' : brandContext.post_length_pref === 'long' ? '2-3 short sentences' : '1-2 short sentences'}
- Include a call-to-action
- Make it engaging and authentic
- Avoid: ${(brandContext.avoid_words || []).join(', ') || 'Nothing specific'}

## Standard Hashtags (include these, they count toward limit)
${(brandContext.hashtags || []).map((tag: string) => `- ${tag}`).join('\n')}

## Output Format
Return ONLY the caption with hashtags at the end. ENGLISH ONLY. MAX 280 CHARACTERS TOTAL.

Caption:`
}

/**
 * Parse caption response from Ollama
 */
function parseCaptionResponse(response: string, brandContext: BrandContext): {
  caption: string
  hashtags: string[]
  emojiCount: number
} {
  // Extract hashtags (usually at the end)
  const hashtagRegex = /#[\w]+/g
  const foundHashtags = response.match(hashtagRegex) || []
  
  // Combine with brand's standard hashtags
  const standardHashtags = brandContext.hashtags || []
  const allHashtags = [...new Set([...foundHashtags, ...standardHashtags])]
  
  // Remove hashtags from caption
  const caption = response.replace(hashtagRegex, '').trim()
  
  // Count emojis
  const emojiRegex = /[\p{Emoji}]/u
  const emojiCount = (caption.match(emojiRegex) || []).length
  
  return {
    caption,
    hashtags: allHashtags.slice(0, brandContext.optimal_hashtag_count || 10),
    emojiCount,
  }
}

/**
 * Generate multiple post variations
 */
export async function generatePostVariations(params: {
  imageUrl: string
  brandContext: BrandContext
  count?: number
  styles?: string[]
  briefText?: string  // Optional brief from client
}): Promise<Array<{
  caption: string
  hashtags: string[]
  style: string
  emojiCount: number
}>> {
  const { count = 5, styles = ['short_statement', 'mission_post', 'brand_teaser', 'question', 'story'] } = params
  
  const variations = []
  
  for (let i = 0; i < count; i++) {
    const style = styles[i % styles.length]
    
    // Modify brand context for this style
    const styleContext = {
      ...params.brandContext,
      tone: getToneForStyle(style, params.brandContext),
      post_length_pref: getLengthForStyle(style),
    }
    
    const result = await generateCaption({
      imageUrl: params.imageUrl,
      brandContext: styleContext,
      platform: 'instagram',
      briefText: params.briefText,  // Pass brief if available
    })
    
    variations.push({
      ...result,
      style,
    })
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

/**
 * Brand context interface
 */
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

/**
 * Check if Ollama is available
 */
export async function checkOllamaAvailability(): Promise<{
  available: boolean
  models?: string[]
  error?: string
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
    })
    
    if (!response.ok) {
      return {
        available: false,
        error: `Ollama not responding: ${response.status}`,
      }
    }
    
    const data = await response.json()
    const models = data.models?.map((m: any) => m.name) || []
    
    return {
      available: true,
      models,
    }
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
    }
  }
}
