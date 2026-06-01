import Anthropic from '@anthropic-ai/sdk'
import type { ClientPreferences } from '@/types/preference'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export interface CaptionRequest {
  imageUrl: string
  brandContext: string
  voiceNoteTranscript?: string
  preferences?: ClientPreferences
}

export interface CaptionResult {
  caption: string
  style: 'short_statement' | 'mission_post' | 'brand_teaser'
  hashtags: string[]
  emojiCount: number
}

export async function generateCaptions(
  request: CaptionRequest,
  count: number = 15
): Promise<CaptionResult[]> {
  const { imageUrl, brandContext, voiceNoteTranscript, preferences } = request

  // Build the system prompt with brand context and preferences
  const systemPrompt = buildSystemPrompt(brandContext, preferences)

  // Build the user prompt
  const userPrompt = buildUserPrompt(voiceNoteTranscript, count)

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: userPrompt,
            },
          ],
        },
      ],
    })

    // Parse the response
    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''

    return parseCaptionResponse(responseText)
  } catch (error: any) {
    console.error('Claude API error:', error.message)
    throw new Error(`Failed to generate captions: ${error.message}`)
  }
}

function buildSystemPrompt(brandContext: string, preferences?: ClientPreferences): string {
  let prompt = `You are an expert social media copywriter specializing in creating engaging, on-brand captions for Instagram, Facebook, LinkedIn, and other social platforms.

BRAND CONTEXT:
${brandContext}
`

  if (preferences) {
    prompt += `

LEARNED PREFERENCES (from previous selections):
- Preferred caption styles: ${JSON.stringify(preferences.preferred_caption_styles)}
- Liked words/phrases: ${preferences.liked_words?.join(', ') || 'none'}
- Avoided words/phrases: ${preferences.avoided_words?.join(', ') || 'none'}
- Optimal hashtag count: ${preferences.optimal_hashtag_count || '3-5'}
- Preferred emojis: ${preferences.preferred_emojis?.join(', ') || 'moderate use'}
- Optimal post length: ${preferences.optimal_post_length || '100'} words
`
  }

  prompt += `

YOUR TASK:
Generate 15 diverse caption options for the provided image. Mix these three styles:

1. SHORT STATEMENT (6 options):
   - 1 sentence, 10-15 words
   - Bold, scroll-stopping, brand-building
   - Perfect for strong visuals

2. MISSION POST (6 options):
   - 1 paragraph, 80-120 words
   - Storytelling, values, education
   - Hook + body + subtle CTA

3. BRAND TEASER (3 options):
   - Minimal text (1-5 words)
   - For launch announcements, hype
   - Let the visual do the heavy lifting

FORMAT YOUR RESPONSE AS JSON:
{
  "captions": [
    {
      "caption": "The full caption text with emojis",
      "style": "short_statement",
      "hashtags": ["#Hashtag1", "#Hashtag2"],
      "emojiCount": 2
    }
    // ... 14 more
  ]
}

IMPORTANT:
- Include emojis naturally (don't overdo it)
- Add 3-5 relevant hashtags per caption
- Match the brand's tone and voice
- Vary the opening styles (questions, bold statements, storytelling)
- Make each caption unique and compelling
`

  return prompt
}

function buildUserPrompt(voiceNoteTranscript?: string, count: number = 15): string {
  let prompt = `Generate ${count} caption options for this image.`

  if (voiceNoteTranscript) {
    prompt += `

VOICE NOTE CONTEXT:
The client provided this description: "${voiceNoteTranscript}"

Use this context to inform the captions, but don't quote it directly.`
  }

  prompt += `

Remember to output valid JSON with exactly ${count} captions in the three styles specified.`

  return prompt
}

function parseCaptionResponse(responseText: string): CaptionResult[] {
  try {
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    if (!parsed.captions || !Array.isArray(parsed.captions)) {
      throw new Error('Invalid response format: missing captions array')
    }

    return parsed.captions.map((c: any) => ({
      caption: c.caption || '',
      style: c.style || 'short_statement',
      hashtags: c.hashtags || [],
      emojiCount: c.emojiCount || 0,
    }))
  } catch (error: any) {
    console.error('Failed to parse Claude response:', error.message)
    console.log('Raw response:', responseText.substring(0, 500))
    throw new Error(`Failed to parse captions: ${error.message}`)
  }
}

export async function analyzeCompetitorPosts(
  posts: Array<{ caption: string; likes?: number; comments?: number }>
): Promise<{ insights: string[]; patterns: Record<string, any> }> {
  const systemPrompt = `You are a social media analyst. Analyze these competitor posts and identify:
1. Common themes and topics
2. Caption length patterns
3. Hashtag strategies
4. Engagement drivers (what gets more likes/comments)
5. Tone and voice patterns
6. Opportunities for differentiation

Output your analysis as JSON:
{
  "insights": ["Insight 1", "Insight 2", ...],
  "patterns": {
    "avgCaptionLength": 85,
    "commonHashtags": ["#tag1", "#tag2"],
    "topThemes": ["Theme 1", "Theme 2"],
    "toneKeywords": ["professional", "friendly"]
  }
}`

  const postsText = posts.map((p, i) => 
    `Post ${i + 1}: "${p.caption}" (Likes: ${p.likes || 0}, Comments: ${p.comments || 0})`
  ).join('\n\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these competitor posts:\n\n${postsText}`,
            },
          ],
        },
      ],
    })

    const responseText = message.content[0].type === 'text' 
      ? message.content[0].text 
      : ''

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found')
    }

    return JSON.parse(jsonMatch[0])
  } catch (error: any) {
    console.error('Failed to analyze competitor posts:', error.message)
    return {
      insights: ['Analysis failed'],
      patterns: {},
    }
  }
}
