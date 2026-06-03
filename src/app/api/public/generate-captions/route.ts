import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, image_count = 1, variations_per_image = 3 } = body

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 })
    }

    // Generate variations based on the single message
    // Each image gets slightly different variations
    const generateVariations = (baseMessage: string, imgIdx: number): string[] => {
      const emojis = ['🌟', '✨', '🔥', '💫', '🎯', '📸']
      const hashtags = [
        '#trending #viral #explore',
        '#lifestyle #inspiration #motivation',
        '#goals #success #hustle',
      ]
      
      // Generate 3 variations with different emoji/hashtag combos
      return [
        `${emojis[imgIdx % emojis.length]} ${baseMessage} ${hashtags[0]}`,
        `${emojis[(imgIdx + 1) % emojis.length]} ${baseMessage} ${hashtags[1]}`,
        `${emojis[(imgIdx + 2) % emojis.length]} ${baseMessage} ${hashtags[2]}`,
      ]
    }

    const allVariations = Array.from({ length: image_count }, (_, idx) => 
      generateVariations(message, idx)
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
