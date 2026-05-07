#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get the most recent submission's posts
  const { data: submission } = await supabase
    .from('submissions')
    .select('id, client_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  
  if (!submission) {
    console.error('No submission found')
    process.exit(1)
  }
  
  const { data: posts } = await supabase
    .from('posts')
    .select('id, image_url, image_filename')
    .eq('submission_id', submission.id)
    .limit(3)
  
  console.log('\n📸 Image URLs in Database\n')
  console.log('='.repeat(80))
  
  for (const post of posts || []) {
    console.log(`\nPost: ${post.id}`)
    console.log(`Filename: ${post.image_filename}`)
    console.log(`URL: ${post.image_url}`)
    
    // Test if URL is accessible
    const response = await fetch(post.image_url, { method: 'HEAD' })
    console.log(`Status: ${response.status} ${response.ok ? '✅' : '❌'}`)
  }
}

main()
