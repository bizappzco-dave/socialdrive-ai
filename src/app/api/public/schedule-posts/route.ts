import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { images, schedule_type = 'mwf' } = body

    if (!images || !Array.isArray(images)) {
      return NextResponse.json({ error: 'images array is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // For public uploads, we'll use a default client or create based on some identifier
    // For now, using a placeholder - you'll need to decide how to attribute public uploads
    const defaultClientId = '4ffd9ffd-0da5-411d-8725-998f10107440' // No Label client

    // Create submission to track this batch
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        client_id: defaultClientId,
        status: 'processing',
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (submissionError) {
      console.error('Failed to create submission:', submissionError)
      return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 })
    }

    // Calculate scheduled dates
    const now = new Date()
    const scheduledDates: string[] = []

    if (schedule_type === 'mwf') {
      // Mon/Wed/Fri at 10am
      let scheduled = new Date(now)
      scheduled.setHours(10, 0, 0, 0)
      
      for (let i = 0; i < images.length; i++) {
        // Find next Mon/Wed/Fri
        let day = scheduled.getDay()
        while (day !== 1 && day !== 3 && day !== 5) {
          scheduled.setDate(scheduled.getDate() + 1)
          day = scheduled.getDay()
        }
        scheduledDates.push(scheduled.toISOString())
        scheduled.setDate(scheduled.getDate() + 2) // Skip to next Mon/Wed/Fri
      }
    } else {
      // Daily at 10am
      for (let i = 0; i < images.length; i++) {
        const scheduled = new Date(now)
        scheduled.setDate(scheduled.getDate() + i)
        scheduled.setHours(10, 0, 0, 0)
        scheduledDates.push(scheduled.toISOString())
      }
    }

    // Create posts
    const postsToInsert = images.map((img: any, idx) => ({
      client_id: defaultClientId,
      submission_id: submission.id,
      caption: img.caption || img.message || '',
      hashtags: [],
      image_urls: [], // Would need actual image URLs from storage
      platform: 'instagram',
      status: 'scheduled',
      scheduled_for: scheduledDates[idx],
      created_at: new Date().toISOString(),
    }))

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .insert(postsToInsert)
      .select()

    if (postsError) {
      console.error('Failed to create posts:', postsError)
      return NextResponse.json({ error: 'Failed to create posts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      posts_count: posts?.length || 0,
      schedule_type,
    })

  } catch (error: any) {
    console.error('Error scheduling posts:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
