// ============================================
// ONBOARDING DATA EXTRACTION
// Extract structured brand profile data from conversations
// ============================================

import { createAdminClient } from '@/lib/supabase/admin'

interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: string
}

interface OnboardingConversation {
  id: string
  clientId: string
  messages: ConversationMessage[]
  customFields?: Record<string, any>
}

interface ExtractedBrandData {
  brand_name?: string
  industry?: string
  location?: string
  website?: string
  target_audience?: string
  tone?: string
  personality?: string
  avoid_words?: string[]
  key_messages?: string[]
  products_services?: string[]
  usps?: string[]
  cta?: string
  hashtags?: string[]
  emoji_style?: string
  post_length_pref?: string
  platforms?: string[]
  competitor_brands?: string[]
  brand_history?: string
  instagram_handle?: string
  facebook_handle?: string
  linkedin_handle?: string
}

// ============================================
// AI-POWERED EXTRACTION (Future Enhancement)
// ============================================
export async function extractBrandDataWithAI(
  conversation: OnboardingConversation
): Promise<ExtractedBrandData> {
  // This will use an LLM to read the conversation and extract brand data
  // For now, we use the structured custom fields from DM Champ
  
  const { messages, customFields } = conversation
  
  // If DM Champ sent structured custom fields, use those
  if (customFields && Object.keys(customFields).length > 0) {
    return mapCustomFieldsToBrandData(customFields)
  }
  
  // Otherwise, we'll need to parse the unstructured conversation
  // This is where we'd call an LLM in the future
  console.log('No structured data available, conversation would need AI parsing:', 
    messages.length, 'messages'
  )
  
  return {}
}

// ============================================
// MAP DM CHAMP CUSTOM FIELDS TO BRAND DATA
// ============================================
function mapCustomFieldsToBrandData(customFields: Record<string, any>): ExtractedBrandData {
  const data: ExtractedBrandData = {}

  // Map straightforward fields
  if (customFields.business_name) data.brand_name = customFields.business_name
  if (customFields.industry) data.industry = customFields.industry
  if (customFields.location) data.location = customFields.location
  if (customFields.website_url) data.website = customFields.website_url
  if (customFields.target_audience) data.target_audience = customFields.target_audience
  if (customFields.brand_tone) data.tone = customFields.brand_tone
  if (customFields.brand_personality) data.personality = customFields.brand_personality
  if (customFields.cta) data.cta = customFields.cta
  if (customFields.emoji_style) data.emoji_style = customFields.emoji_style
  if (customFields.post_length_pref) data.post_length_pref = customFields.post_length_pref

  // Map social handles
  if (customFields.instagram_handle) {
    data.instagram_handle = customFields.instagram_handle
    data.platforms = [...(data.platforms || []), 'instagram']
  }
  if (customFields.facebook_handle) {
    data.facebook_handle = customFields.facebook_handle
    data.platforms = [...(data.platforms || []), 'facebook']
  }
  if (customFields.linkedin_handle) {
    data.linkedin_handle = customFields.linkedin_handle
    data.platforms = [...(data.platforms || []), 'linkedin']
  }

  // Parse list fields (comma or semicolon separated)
  if (customFields.usps) {
    data.usps = splitList(customFields.usps)
  }
  if (customFields.competitors) {
    data.competitor_brands = splitList(customFields.competitors)
  }
  if (customFields.words_to_use) {
    data.key_messages = splitList(customFields.words_to_use)
  }
  if (customFields.words_to_avoid) {
    data.avoid_words = splitList(customFields.words_to_avoid)
  }
  if (customFields.content_preferences) {
    data.products_services = splitList(customFields.content_preferences)
  }
  if (customFields.hashtags) {
    data.hashtags = splitList(customFields.hashtags)
  }

  // Default platforms if none specified
  if (!data.platforms || data.platforms.length === 0) {
    data.platforms = ['instagram']
  }

  return data
}

function splitList(value: string): string[] {
  if (!value) return []
  return value
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(Boolean)
}

// ============================================
// SAVE EXTRACTED DATA
// ============================================
export async function saveExtractedBrandData(
  clientId: string, 
  brandData: ExtractedBrandData
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('brand_contexts')
    .upsert({
      client_id: clientId,
      ...brandData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'client_id',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error('Error saving brand data:', error)
    throw error
  }
}

// ============================================
// GET CONVERSATION FOR CLIENT
// ============================================
export async function getConversationForClient(
  clientId: string
): Promise<OnboardingConversation | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('onboarding_conversations')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    console.error('Error fetching conversation:', error)
    return null
  }

  return {
    id: data.id,
    clientId: data.client_id,
    messages: data.conversation_json.messages || [],
    customFields: data.conversation_json.custom_fields || {},
  }
}

// ============================================
// QUERY RAW CONVERSATION DATA
// ============================================
export async function queryOnboardingData(
  options: {
    clientId?: string
    phone?: string
    processingStatus?: string
    limit?: number
  }
) {
  const supabase = createAdminClient()
  
  let query = supabase
    .from('onboarding_conversations')
    .select('*')

  if (options.clientId) {
    query = query.eq('client_id', options.clientId)
  }
  if (options.phone) {
    query = query.eq('phone', options.phone)
  }
  if (options.processingStatus) {
    query = query.eq('processing_status', options.processingStatus)
  }

  query = query.limit(options.limit || 50)

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) throw error
  return data
}
