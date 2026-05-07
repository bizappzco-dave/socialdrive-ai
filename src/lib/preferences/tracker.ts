import { getPreferences, updatePreferences } from '@/lib/supabase/queries'
import type { Post, CaptionStyle } from '@/types/post'
import type { ClientPreferences } from '@/types/preference'

export interface SelectionEvent {
  postId: string
  action: 'selected' | 'deleted' | 'edited' | 'saved'
  captionText: string
  captionStyle: CaptionStyle
  hashtags: string[]
  emojis: string[]
  captionLength: number
  timestamp: string
}

export async function trackSelection(
  clientId: string,
  event: SelectionEvent
): Promise<ClientPreferences> {
  // Get current preferences
  const currentPrefs = await getPreferences(clientId)
  
  // Initialize if doesn't exist
  const prefs: ClientPreferences = currentPrefs || {
    client_id: clientId,
    total_posts_curated: 0,
    last_updated: new Date().toISOString(),
  }

  // Update total curated count
  prefs.total_posts_curated += 1

  // Track caption style preferences
  if (!prefs.preferred_caption_styles) {
    prefs.preferred_caption_styles = {
      short_statement: 0,
      mission_post: 0,
      brand_teaser: 0,
    }
  }

  // Update style selection rates
  const styleKey = event.captionStyle
  const totalStyle = prefs.total_posts_curated
  
  // Simple moving average (weight recent selections more)
  const currentRate = prefs.preferred_caption_styles[styleKey] || 0
  prefs.preferred_caption_styles[styleKey] = currentRate * 0.9 + (event.action === 'selected' ? 0.1 : 0)

  // Track word patterns
  if (event.action === 'selected') {
    // Extract words from selected captions
    const words = extractWords(event.captionText)
    
    if (!prefs.liked_words) prefs.liked_words = []
    if (!prefs.avoided_words) prefs.avoided_words = []

    // Add words to liked list (avoid duplicates)
    words.forEach(word => {
      if (!prefs.liked_words!.includes(word)) {
        prefs.liked_words!.push(word)
      }
      // Remove from avoided if present
      const avoidIndex = prefs.avoided_words!.indexOf(word)
      if (avoidIndex > -1) {
        prefs.avoided_words!.splice(avoidIndex, 1)
      }
    })
  } else if (event.action === 'deleted') {
    // Track words from deleted captions
    const words = extractWords(event.captionText)
    
    if (!prefs.avoided_words) prefs.avoided_words = []
    if (!prefs.liked_words) prefs.liked_words = []

    words.forEach(word => {
      if (!prefs.avoided_words!.includes(word)) {
        prefs.avoided_words!.push(word)
      }
      // Remove from liked if present
      const likeIndex = prefs.liked_words!.indexOf(word)
      if (likeIndex > -1) {
        prefs.liked_words!.splice(likeIndex, 1)
      }
    })
  }

  // Track hashtag preferences
  if (event.hashtags.length > 0) {
    if (!prefs.preferred_hashtags) prefs.preferred_hashtags = []
    if (!prefs.avoided_hashtags) prefs.avoided_hashtags = []

    if (event.action === 'selected') {
      event.hashtags.forEach(tag => {
        if (!prefs.preferred_hashtags!.includes(tag)) {
          prefs.preferred_hashtags!.push(tag)
        }
      })
    }
  }

  // Track emoji usage
  if (event.emojis.length > 0) {
    if (!prefs.preferred_emojis) prefs.preferred_emojis = []
    if (!prefs.avoided_emojis) prefs.avoided_emojis = []

    if (event.action === 'selected') {
      event.emojis.forEach(emoji => {
        if (!prefs.preferred_emojis!.includes(emoji)) {
          prefs.preferred_emojis!.push(emoji)
        }
      })
    }
  }

  // Track optimal hashtag count
  if (event.action === 'selected') {
    const currentOptimal = prefs.optimal_hashtag_count || 0
    prefs.optimal_hashtag_count = Math.round(
      (currentOptimal * 0.9) + (event.hashtags.length * 0.1)
    )
  }

  // Track optimal emoji count
  if (event.action === 'selected') {
    const currentOptimal = prefs.optimal_emoji_count || 0
    prefs.optimal_emoji_count = Math.round(
      (currentOptimal * 0.9) + (event.emojis.length * 0.1)
    )
  }

  // Track post length preferences
  if (event.action === 'selected') {
    const currentOptimal = prefs.optimal_post_length || 0
    prefs.optimal_post_length = Math.round(
      (currentOptimal * 0.9) + (event.captionLength * 0.1)
    )
    
    // Update min/max
    if (!prefs.min_post_length || event.captionLength < prefs.min_post_length) {
      prefs.min_post_length = event.captionLength
    }
    if (!prefs.max_post_length || event.captionLength > prefs.max_post_length) {
      prefs.max_post_length = event.captionLength
    }
  }

  // Update timestamp
  prefs.last_updated = new Date().toISOString()

  // Save to database
  const updated = await updatePreferences(clientId, prefs)
  return updated
}

function extractWords(text: string): string[] {
  // Remove hashtags, mentions, emojis, and punctuation
  const cleaned = text
    .replace(/#[\w]+/g, '') // Remove hashtags
    .replace(/@[\w]+/g, '') // Remove mentions
    .replace(/[^\w\s']/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .toLowerCase()

  // Split into words and filter short/common words
  const words = cleaned.split(' ').filter(word => {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how']
    return word.length > 3 && !commonWords.includes(word)
  })

  // Return unique words (max 10)
  return [...new Set(words)].slice(0, 10)
}

export async function getPreferenceInsights(clientId: string): Promise<{
  styleInsights: string[]
  wordInsights: string[]
  hashtagInsights: string[]
  recommendations: string[]
}> {
  const prefs = await getPreferences(clientId)
  
  if (!prefs || prefs.total_posts_curated < 5) {
    return {
      styleInsights: ['Not enough data yet (need 5+ selections)'],
      wordInsights: [],
      hashtagInsights: [],
      recommendations: ['Continue curating posts to build your preference profile'],
    }
  }

  const insights = {
    styleInsights: [] as string[],
    wordInsights: [] as string[],
    hashtagInsights: [] as string[],
    recommendations: [] as string[],
  }

  // Style insights
  if (prefs.preferred_caption_styles) {
    const styles = prefs.preferred_caption_styles
    const total = (styles.short_statement || 0) + (styles.mission_post || 0) + (styles.brand_teaser || 0)
    
    if (styles.short_statement! > 0.5) {
      insights.styleInsights.push(`You strongly prefer Short Statement captions (${Math.round(styles.short_statement! * 100)}% selection rate)`)
    }
    if (styles.mission_post! > 0.5) {
      insights.styleInsights.push(`You strongly prefer Mission Post captions (${Math.round(styles.mission_post! * 100)}% selection rate)`)
    }
  }

  // Word insights
  if (prefs.liked_words && prefs.liked_words.length > 0) {
    insights.wordInsights.push(`Your brand voice includes: ${prefs.liked_words.slice(0, 5).join(', ')}`)
  }
  if (prefs.avoided_words && prefs.avoided_words.length > 0) {
    insights.wordInsights.push(`Avoid these words: ${prefs.avoided_words.slice(0, 3).join(', ')}`)
  }

  // Hashtag insights
  if (prefs.optimal_hashtag_count) {
    insights.hashtagInsights.push(`Optimal hashtag count: ${prefs.optimal_hashtag_count}`)
  }
  if (prefs.preferred_hashtags && prefs.preferred_hashtags.length > 0) {
    insights.hashtagInsights.push(`Preferred hashtags: ${prefs.preferred_hashtags.slice(0, 5).join(', ')}`)
  }

  // Recommendations
  if (prefs.preferred_caption_styles?.short_statement! > 0.7) {
    insights.recommendations.push('Generate more Short Statement captions - you select them 70%+ of the time')
  }
  if (prefs.preferred_caption_styles?.mission_post! < 0.2) {
    insights.recommendations.push('Consider reducing Mission Post generation - low selection rate')
  }
  if (prefs.optimal_hashtag_count! < 3) {
    insights.recommendations.push('You prefer minimal hashtags - consider 2-3 per post')
  }
  if (prefs.optimal_hashtag_count! > 8) {
    insights.recommendations.push('You use many hashtags - ensure they remain relevant')
  }

  return insights
}

export async function buildPromptWithPreferences(
  brandContext: string,
  preferences: ClientPreferences
): Promise<string> {
  let prompt = brandContext

  if (preferences.preferred_caption_styles) {
    const styles = preferences.preferred_caption_styles
    const total = (styles.short_statement || 0) + (styles.mission_post || 0) + (styles.brand_teaser || 0)
    
    if (total > 0) {
      const shortPct = Math.round((styles.short_statement! / total) * 100)
      const missionPct = Math.round((styles.mission_post! / total) * 100)
      const teaserPct = Math.round((styles.brand_teaser! / total) * 100)
      
      prompt += `\n\nCAPTION STYLE DISTRIBUTION:\n- Short Statement: ${shortPct}% of selected posts\n- Mission Post: ${missionPct}% of selected posts\n- Brand Teaser: ${teaserPct}% of selected posts`
    }
  }

  if (preferences.liked_words && preferences.liked_words.length > 0) {
    prompt += `\n\nPREFERRED WORDS/PHRASES:\nUse these naturally: ${preferences.liked_words.slice(0, 10).join(', ')}`
  }

  if (preferences.avoided_words && preferences.avoided_words.length > 0) {
    prompt += `\n\nAVOID THESE WORDS:\n${preferences.avoided_words.slice(0, 5).join(', ')}`
  }

  if (preferences.optimal_hashtag_count) {
    prompt += `\n\nHASHTAG STRATEGY:\nUse ${preferences.optimal_hashtag_count} hashtags per post`
  }

  if (preferences.preferred_hashtags && preferences.preferred_hashtags.length > 0) {
    prompt += `\n\nPREFERRED HASHTAGS:\n${preferences.preferred_hashtags.slice(0, 8).join(', ')}`
  }

  if (preferences.optimal_emoji_count !== undefined) {
    prompt += `\n\nEMOJI USAGE:\nUse ${preferences.optimal_emoji_count} emojis per caption`
  }

  if (preferences.preferred_emojis && preferences.preferred_emojis.length > 0) {
    prompt += `\n\nPREFERRED EMOJIS:\n${preferences.preferred_emojis.join(', ')}`
  }

  if (preferences.optimal_post_length) {
    prompt += `\n\nOPTIMAL LENGTH:\nAim for ${preferences.optimal_post_length} words (range: ${preferences.min_post_length || 0}-${preferences.max_post_length || 200})`
  }

  return prompt
}
