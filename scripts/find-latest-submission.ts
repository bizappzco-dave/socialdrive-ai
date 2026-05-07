#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error || !submissions) {
    console.error('Error:', error?.message || 'No submissions')
    process.exit(1)
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const reviewUrl = `${baseUrl}/review/${submissions.review_token}`
  
  console.log('\n📋 Latest Submission')
  console.log('='.repeat(60))
  console.log(`ID: ${submissions.id}`)
  console.log(`Client: ${submissions.client_name}`)
  console.log(`Status: ${submissions.status}`)
  console.log(`Posts: ${submissions.post_count}`)
  console.log(`Created: ${new Date(submissions.created_at).toLocaleString()}`)
  console.log(`\n🔗 Review: ${reviewUrl}\n`)
  
  // Get posts
  const { data: posts } = await supabase
    .from('posts')
    .select('id, caption_text, image_url')
    .eq('submission_id', submissions.id)
    .limit(3)
  
  console.log('First 3 posts:')
  posts?.forEach((post, i) => {
    const cap = post.caption_text ? post.caption_text.slice(0, 80) + '...' : '(EMPTY)'
    console.log(`  ${i+1}. ${cap}`)
  })
}

main()
