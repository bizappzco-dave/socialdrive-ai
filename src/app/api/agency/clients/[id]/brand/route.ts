import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * PUT /api/agency/clients/[id]/brand
 * 
 * Update client brand profile
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()
    
    // Update client with brand profile data
    const { data, error } = await supabase
      .from('clients')
      .update({
        website_url: body.website_url,
        instagram_handle: body.instagram_handle,
        facebook_handle: body.facebook_handle,
        linkedin_handle: body.linkedin_handle,
        target_audience: body.target_audience,
        brand_tone: body.brand_tone,
        brand_voice: body.brand_voice,
        usps: body.usps,
        competitors: body.competitors,
        words_to_use: body.words_to_use,
        words_to_avoid: body.words_to_avoid,
        content_preferences: body.content_preferences,
        brand_guidelines_url: body.brand_guidelines_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      client: data,
    })
    
  } catch (error: any) {
    console.error('Failed to save brand profile:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save brand profile' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/agency/clients/[id]/brand/onboarded
 * 
 * Mark client as DM Champ onboarded
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createAdminClient()
    
    const { data, error } = await supabase
      .from('clients')
      .update({
        dmchamp_onboarded: true,
        dmchamp_onboarded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({
      success: true,
      client: data,
    })
    
  } catch (error: any) {
    console.error('Failed to mark as onboarded:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to mark as onboarded' },
      { status: 500 }
    )
  }
}
