import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { images, variations_per_image = 3 } = body

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'images array is required' }, { status: 400 })
    }

    // Generate 3 caption variations per image using AI
    // For now, using simple templates - can replace with actual AI later
    const generateVariations = (message: string): string[] => {
      const templates = [
        `🌟 ${message} #trending #viral`,
        `✨ ${message} #lifestyle #inspiration`,
        `🔥 ${message} #motivation #goals`,
      ]
      return templates
    }

    const allVariations = images.map((img: any) => 
      generateVariations(img.message || 'Check this out!')
    )

    return NextResponse.json({
      success: true,
      variations: allVariations,
    })

  } catch (error: any) {
    console.error('Error generating captions:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
