import { createClient } from '@/utils/supabase/server'

export interface ClientFeatures {
  auto_captions: boolean
  platform_optimization: boolean
  hashtags: boolean
  multi_format: boolean
  video_generation: boolean
  caption_variants: boolean
  premium_ai: boolean
  extended_context: boolean
  bulk_upload: boolean
  email_notifications: boolean
  extended_storage: boolean
  priority_processing: boolean
  team_access: boolean
  custom_templates: boolean
  white_label: boolean
  api_access: boolean
  priority_support: boolean
}

const DEFAULT_FEATURES: ClientFeatures = {
  auto_captions: true,
  platform_optimization: false,
  hashtags: false,
  multi_format: true,
  video_generation: true,
  caption_variants: false,
  premium_ai: false,
  extended_context: true,
  bulk_upload: true,
  email_notifications: true,
  extended_storage: false,
  priority_processing: false,
  team_access: false,
  custom_templates: false,
  white_label: false,
  api_access: false,
  priority_support: false
}

/**
 * Check if a specific feature is enabled for a client
 */
export async function checkFeature(
  clientId: string,
  feature: keyof ClientFeatures
): Promise<boolean> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('features_enabled')
    .eq('id', clientId)
    .single()

  if (error || !data) {
    console.error('Error checking feature:', error)
    return DEFAULT_FEATURES[feature]
  }

  const features = data.features_enabled as ClientFeatures || DEFAULT_FEATURES
  return features[feature] === true
}

/**
 * Get all features for a client
 */
export async function getClientFeatures(clientId: string): Promise<ClientFeatures> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('features_enabled')
    .eq('id', clientId)
    .single()

  if (error || !data) {
    console.error('Error getting client features:', error)
    return DEFAULT_FEATURES
  }

  return { ...DEFAULT_FEATURES, ...(data.features_enabled || {}) }
}

/**
 * Get the AI model to use based on client features
 * Options: ollama/qwen3.5 (default), claude-sonnet-4-5, claude-sonnet-4-6, mistral-large-3
 */
export async function getAIModel(clientId: string): Promise<string> {
  const features = await getClientFeatures(clientId)
  return features.premium_ai ? 'claude-sonnet-4-5' : 'ollama/qwen3.5'
}

/**
 * Get platforms to generate content for
 */
export async function getTargetPlatforms(clientId: string): Promise<string[]> {
  const features = await getClientFeatures(clientId)
  return features.platform_optimization 
    ? ['instagram', 'tiktok', 'linkedin']
    : ['instagram']
}

/**
 * Check if client can upload in bulk
 */
export async function canBulkUpload(clientId: string): Promise<boolean> {
  return await checkFeature(clientId, 'bulk_upload')
}

/**
 * Check if client should receive email notifications
 */
export async function shouldNotify(clientId: string): Promise<boolean> {
  return await checkFeature(clientId, 'email_notifications')
}

/**
 * Get storage limit for client (in bytes)
 */
export async function getStorageLimit(clientId: string): Promise<number> {
  const features = await getClientFeatures(clientId)
  return features.extended_storage 
    ? 10 * 1024 * 1024 * 1024  // 10GB
    : 1 * 1024 * 1024 * 1024   // 1GB
}

/**
 * Check if client has priority processing
 */
export async function hasPriorityProcessing(clientId: string): Promise<boolean> {
  return await checkFeature(clientId, 'priority_processing')
}
