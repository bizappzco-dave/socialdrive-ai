#!/usr/bin/env tsx
/**
 * Get the review link for the most recent submission
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get most recent submission
  const { data: submission, error } = await supabase
    .from('submissions')
    .select('*, posts(count)')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  const reviewUrl = `${baseUrl}/review/${submission.review_token}`
  
  console.log('\n📋 Most Recent Submission')
  console.log('========================\n')
  console.log(`Client: ${submission.client_name}`)
  console.log(`Status: ${submission.status}`)
  console.log(`Posts: ${submission.post_count || 0}`)
  console.log(`\n🔗 Review URL: ${reviewUrl}\n`)
}

main()
