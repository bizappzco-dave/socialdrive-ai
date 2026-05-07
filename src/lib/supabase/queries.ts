import { createClient } from './server'

// ============================================
// CLIENT QUERIES
// ============================================

export async function getClients() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getClient(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single()

  if (error) throw error
  return data
}

export async function createClientRecord(data: {
  name: string
  industry?: string
  drive_folder_id?: string
  drive_folder_url?: string
}) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: newClient, error } = await supabase
    .from('clients')
    .insert({
      user_id: user.id,
      ...data,
    })
    .select()
    .single()

  if (error) throw error
  return newClient
}

export async function updateClient(clientId: string, updates: Partial<{
  name: string
  industry: string
  drive_folder_id: string
  drive_folder_url: string
  rss_feed_url: string
  is_active: boolean
}>) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteClient(clientId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('clients')
    .update({ is_active: false })
    .eq('id', clientId)

  if (error) throw error
}

// ============================================
// BRAND CONTEXT QUERIES
// ============================================

export async function getBrandContext(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_contexts')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

export async function createBrandContext(clientId: string, data: Partial<{
  brand_name: string
  industry: string
  location: string
  website: string
  target_audience: string
  tone: string
  personality: string
  avoid_words: any[]
  key_messages: any[]
  products_services: any[]
  usps: any[]
  cta: string
  hashtags: any[]
  emoji_style: string
  post_length_pref: string
  platforms: any[]
  brand_history: string
  sample_posts: any[]
  competitor_brands: any[]
  competitors_to_monitor: any[]
  file_content: string
}>) {
  const supabase = await createClient()
  
  const { data: newContext, error } = await supabase
    .from('brand_contexts')
    .insert({
      client_id: clientId,
      ...data,
    })
    .select()
    .single()

  if (error) throw error
  return newContext
}

export async function updateBrandContext(clientId: string, updates: any) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('brand_contexts')
    .update(updates)
    .eq('client_id', clientId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// POST QUERIES
// ============================================

export async function getPosts(clientId: string, status?: 'pending' | 'selected' | 'scheduled' | 'published' | 'deleted') {
  const supabase = await createClient()
  
  let query = supabase
    .from('posts')
    .select('*')
    .eq('client_id', clientId)

  if (status) {
    switch (status) {
      case 'pending':
        query = query.eq('selected', false).eq('deleted', false)
        break
      case 'selected':
        query = query.eq('selected', true).eq('rss_added', false)
        break
      case 'scheduled':
        query = query.eq('rss_added', true).eq('published_at', null)
        break
      case 'published':
        query = query.neq('published_at', null)
        break
      case 'deleted':
        query = query.eq('deleted', true)
        break
    }
  }

  const { data, error } = await query.order('generated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createPost(data: {
  client_id: string
  image_url: string
  image_filename?: string
  caption_text: string
  caption_style: string
  caption_length: number
  hashtag_count: number
  hashtags?: any[]
  emoji_count: number
  emojis_used?: any[]
  voice_note_transcript?: string
}) {
  const supabase = await createClient()
  
  const { data: newPost, error } = await supabase
    .from('posts')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return newPost
}

export async function updatePost(postId: string, updates: any) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', postId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('posts')
    .update({ 
      deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', postId)

  if (error) throw error
}

// ============================================
// PREFERENCE QUERIES
// ============================================

export async function getPreferences(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('client_preferences')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updatePreferences(clientId: string, updates: any) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('client_preferences')
    .upsert({
      client_id: clientId,
      ...updates,
      last_updated: new Date().toISOString()
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================
// COMPETITOR QUERIES
// ============================================

export async function getCompetitors(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('added_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addCompetitor(clientId: string, data: {
  account_name: string
  platform?: string
  profile_url?: string
  instagram_handle?: string
}) {
  const supabase = await createClient()
  
  const { data: newCompetitor, error } = await supabase
    .from('competitors')
    .insert({
      client_id: clientId,
      ...data,
    })
    .select()
    .single()

  if (error) throw error
  return newCompetitor
}

export async function deleteCompetitor(competitorId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('competitors')
    .update({ is_active: false })
    .eq('id', competitorId)

  if (error) throw error
}

// ============================================
// CLIENT PREFERENCES QUERIES
// ============================================

export async function getClientPreferences(clientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('client_preferences')
    .select('*')
    .eq('client_id', clientId)
    .single()

  if (error && error.code !== 'PGRST116') throw error // PGRST116 = not found
  return data
}

export async function upsertClientPreferences(clientId: string, data: {
  preferred_days?: any[]
  preferred_hours?: any[]
  preferred_caption_styles?: any
  optimal_hashtag_count?: number
  preferred_hashtags?: any[]
  preferred_emojis?: any[]
  optimal_emoji_count?: number
  optimal_post_length?: number
  best_performing_content?: any
}) {
  const supabase = await createClient()
  
  const { data: existing } = await supabase
    .from('client_preferences')
    .select('client_id')
    .eq('client_id', clientId)
    .single()

  if (existing) {
    const { data: updated, error } = await supabase
      .from('client_preferences')
      .update({
        ...data,
        last_updated: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } else {
    const { data: created, error } = await supabase
      .from('client_preferences')
      .insert({
        client_id: clientId,
        ...data,
        total_posts_curated: 0,
      })
      .select()
      .single()
    
    if (error) throw error
    return created
  }
}

export async function approvePostsForPublishing(postIds: string[]) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('posts')
    .update({ 
      rss_added: true,
      rss_added_at: new Date().toISOString(),
    })
    .in('id', postIds)
    .select()

  if (error) throw error
  return data
}

export async function upsertBrandContext(clientId: string, data: {
  brand_name: string
  industry: string
  location?: string
  target_audience?: string
  tone?: string
  personality?: string
  avoid_words?: any[]
  key_messages?: any[]
  usps?: any[]
  cta?: string
  hashtags?: any[]
  emoji_style?: string
  post_length_pref?: string
  optimal_hashtag_count?: number
}) {
  const supabase = await createClient()
  
  const { data: existing } = await supabase
    .from('brand_contexts')
    .select('id')
    .eq('client_id', clientId)
    .single()

  if (existing) {
    const { data: updated, error } = await supabase
      .from('brand_contexts')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .select()
      .single()
    
    if (error) throw error
    return updated
  } else {
    const { data: created, error } = await supabase
      .from('brand_contexts')
      .insert({
        client_id: clientId,
        ...data,
      })
      .select()
      .single()
    
    if (error) throw error
    return created
  }
}
