#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  const { data: submissions, error } = await supabase
    .from('submissions')
    .select('*, posts(count)')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  console.log('\n📋 Recent Submissions\n')
  console.log('='.repeat(60))
  
  for (const sub of submissions) {
    const reviewUrl = `${baseUrl}/review/${sub.review_token}`
    const postCount = sub.posts?.[0]?.count || sub.post_count || 0
    const status = sub.status
    
    console.log(`\nClient: ${sub.client_name}`)
    console.log(`Status: ${status}`)
    console.log(`Posts: ${postCount}`)
    console.log(`Created: ${new Date(sub.created_at).toLocaleString()}`)
    console.log(`🔗 Review: ${reviewUrl}`)
  }
}

main()
