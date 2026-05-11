import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// ============================================
// DM CHAMP WEBHOOK HANDLER
// ============================================
// Receives onboarding data from DM Champ WhatsApp conversations
// and auto-populates brand profiles in SocialDrive AI
//
// Webhook URL: https://socialdrive-ai.vercel.app/api/webhooks/dmchamp/onboarding

// Expected payload from DM Champ:
// {
//   "event": "flow.completed",
//   "contact": {
//     "id": "dmchamp_contact_id",
//     "phone": "+353871234567",
//     "first_name": "David",
//     "custom_fields": {
//       "business_name": "No Label Barber",
//       "website_url": "https://nolabel.ie",
//       "instagram_handle": "nolabelbarber",
//       "facebook_handle": "",
//       "linkedin_handle": "",
//       "target_audience": "Men 25-45, professionals who care about grooming",
//       "brand_tone": "Professional & polished",
//       "usps": "Master barbers, 20+ years experience, Dublin location",
//       "competitors": "Blade & Barrel, The Grafton Barber",
//       "words_to_use": "Dublin, craftsmanship, master barber",
//       "words_to_avoid": "cheap, discount, budget",
//       "content_preferences": "Before/after photos, Team spotlights"
//     }
//   }
// }

// Type definitions for DM Champ payload
interface DMChampContact {
  id: string
  phone: string
  first_name: string
  custom_fields: Record<string, any>
}

interface DMChampPayload {
  event: string
  contact: DMChampContact
}

// Field mapping from DM Champ → SocialDrive brand_contexts
const FIELD_MAP: Record<string, string> = {
  business_name: 'brand_name',
  website_url: 'website',
  instagram_handle: 'instagram_handle',
  facebook_handle: 'facebook_handle',
  linkedin_handle: 'linkedin_handle',
  target_audience: 'target_audience',
  brand_tone: 'tone',
  usps: 'usps',
  competitors: 'competitor_brands',
  words_to_use: 'key_messages',
  words_to_avoid: 'avoid_words',
  content_preferences: 'content_preferences',
  location: 'location',
  industry: 'industry',
  cta: 'cta',
  personality: 'personality',
}

const WEBHOOK_SECRET = process.env.DMCHAMP_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret if configured
    const signature = request.headers.get('x-dmchamp-signature')
    if (WEBHOOK_SECRET && signature !== WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    const payload: DMChampPayload = await request.json()

    // Validate payload structure
    if (!payload.contact?.phone) {
      return NextResponse.json(
        { error: 'Missing contact phone number' },
        { status: 400 }
      )
    }

    console.log('🔔 DM Champ webhook received:', {
      event: payload.event,
      phone: payload.contact.phone,
      business: payload.contact.custom_fields?.business_name,
    })

    // Find or create client by phone number
    const supabase = createAdminClient()
    const phone = payload.contact.phone.replace(/\s/g, '').replace(/^\+/, '')

    // Search for existing client by phone (stored in metadata or notes)
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id, name, metadata')
      .contains('metadata', { phone: phone })
      .eq('is_active', true)
      .single()

    let clientId: string
    let isNewClient = false

    if (existingClient) {
      clientId = existingClient.id
      console.log('📋 Found existing client:', existingClient.name)
    } else {
      // Create new client from onboarding data
      const businessName = payload.contact.custom_fields.business_name || 
                           payload.contact.first_name || 
                           'New Client'

      const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
          name: businessName,
          is_active: true,
          metadata: {
            phone: phone,
            dmchamp_contact_id: payload.contact.id,
            dmchamp_onboarded: true,
            onboarded_at: new Date().toISOString(),
            source: 'dmchamp',
          }
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Error creating client:', createError)
        return NextResponse.json(
          { error: 'Failed to create client' },
          { status: 500 }
        )
      }

      clientId = newClient.id
      isNewClient = true
      console.log('✅ Created new client:', businessName, clientId)
    }

    // Transform custom fields to brand context format
    const customFields = payload.contact.custom_fields || {}
    const brandContextData: Record<string, any> = {
      client_id: clientId,
      updated_at: new Date().toISOString(),
    }

    // Map fields using FIELD_MAP
    for (const [dmchampField, sdField] of Object.entries(FIELD_MAP)) {
      if (customFields[dmchampField]) {
        const value = customFields[dmchampField]
        
        // Handle array fields
        if (sdField === 'usps' || sdField === 'competitor_brands' || sdField === 'avoid_words') {
          brandContextData[sdField] = value
            .split(/,|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        } 
        // Handle key_messages (words to use)
        else if (sdField === 'key_messages') {
          brandContextData[sdField] = value
            .split(/,|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        // Handle content preferences
        else if (sdField === 'content_preferences') {
          brandContextData[sdField] = value
            .split(/,|;/)
            .map((s: string) => s.trim())
            .filter(Boolean)
        }
        // Handle platforms (derived from handles)
        else if (sdField === 'instagram' && value) {
          brandContextData.platforms = [...(brandContextData.platforms || []), 'instagram']
          brandContextData.instagram_handle = value
        }
        else if (sdField === 'facebook' && value) {
          brandContextData.platforms = [...(brandContextData.platforms || []), 'facebook']
        }
        else if (sdField === 'linkedin' && value) {
          brandContextData.platforms = [...(brandContextData.platforms || []), 'linkedin']
        }
        // Direct mapping for simple fields
        else {
          brandContextData[sdField] = value
        }
      }
    }

    // Ensure platforms is an array
    if (!brandContextData.platforms || brandContextData.platforms.length === 0) {
      brandContextData.platforms = ['instagram'] // Default
    }

    // Insert or update brand context
    let brandContext: any = null
    let contextError: any = null
    
    const result = await supabase
      .from('brand_contexts')
      .insert({
        ...brandContextData,
      })
      .select()
      .single()
    
    brandContext = result.data
    contextError = result.error
    
    // If conflict (client already has brand context), update instead
    if (contextError && contextError.code === '23505') {
      const updateResult = await supabase
        .from('brand_contexts')
        .update(brandContextData)
        .eq('client_id', clientId)
        .select()
        .single()
      
      if (updateResult.error) {
        console.error('Error updating brand context:', updateResult.error)
        return NextResponse.json(
          { error: 'Failed to update brand context', details: updateResult.error.message },
          { status: 500 }
        )
      }
      
      brandContext = updateResult.data
    } else if (contextError) {
      console.error('Error saving brand context:', contextError)
      return NextResponse.json(
        { error: 'Failed to save brand context', details: contextError.message },
        { status: 500 }
      )
    }

    // Log the onboarding event for audit trail
    await supabase.from('onboarding_logs').insert({
      client_id: clientId,
      event: payload.event,
      phone: phone,
      dmchamp_contact_id: payload.contact.id,
      raw_data: payload,
      processed_at: new Date().toISOString(),
      status: 'success',
    })

    // Store full conversation in onboarding_conversations table
    // This allows access to raw Q&A for data extraction
    await supabase.from('onboarding_conversations').upsert({
      client_id: clientId,
      dmchamp_contact_id: payload.contact.id,
      phone: phone,
      conversation_json: payload,  // Store full webhook payload
      extracted_data: brandContextData,
      processing_status: 'completed',
      source: 'dmchamp',
      completed_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    }, {
      onConflict: 'dmchamp_contact_id',
      ignoreDuplicates: false,
    })

    console.log('✅ Brand context saved for client:', clientId)

    // Generate upload link automatically
    const uploadToken = await generateUploadToken(supabase, clientId)

    return NextResponse.json({
      success: true,
      clientId,
      isNewClient,
      brandContextId: brandContext.id,
      uploadToken,
      message: isNewClient 
        ? 'New client created and brand profile populated' 
        : 'Existing client brand profile updated',
    })

  } catch (error: any) {
    console.error('💥 DM Champ webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Generate an upload token for the client
async function generateUploadToken(supabase: any, clientId: string): Promise<string> {
  const token = crypto.randomUUID()
  
  // Create submission record with token
  const { data: submission } = await supabase
    .from('submissions')
    .insert({
      client_id: clientId,
      upload_token: token,
      status: 'awaiting_upload',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
    .select('upload_token')
    .single()

  return submission?.upload_token || token
}

// Optional: Support GET request for webhook verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    webhook: 'dmchamp/onboarding',
    version: '1.0.0',
    supported_events: ['flow.completed', 'contact.tagged', 'contact.updated'],
    documentation: 'https://socialdrive-ai.vercel.app/docs/webhooks/dmchamp',
  })
}
