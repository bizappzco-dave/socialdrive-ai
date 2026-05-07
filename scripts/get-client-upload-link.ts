#!/usr/bin/env node

/**
 * Get or Create Permanent Upload Link for Client
 * 
 * Usage: 
 *   npx tsx scripts/get-client-upload-link.ts "Client Name"
 *   npx tsx scripts/get-client-upload-link.ts --client-id "uuid-here"
 * 
 * Returns the same upload link every time for the same client.
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as crypto from 'crypto'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

function generateSecureToken(): string {
  return crypto.randomBytes(16).toString('hex')
}

async function getClientUploadLink(clientName?: string, clientId?: string) {
  try {
    // If clientId not provided, find by name
    if (!clientId) {
      const { data: client, error } = await supabase
        .from('clients')
        .select('id, name')
        .ilike('name', `%${clientName}%`)
        .single()
      
      if (error || !client) {
        console.error('❌ Client not found:', clientName)
        process.exit(1)
      }
      
      clientId = client.id
      clientName = client.name
    }
    
    // Check if client already has an upload token
    const { data: existingSubmission } = await supabase
      .from('submissions')
      .select('upload_token, review_token')
      .eq('client_id', clientId)
      .is('brief_text', null) // Find placeholder submission (no brief = never used)
      .order('created_at', { ascending: true })
      .single()
    
    let uploadToken: string
    let reviewToken: string
    
    if (existingSubmission) {
      // Reuse existing tokens
      uploadToken = existingSubmission.upload_token
      reviewToken = existingSubmission.review_token
      console.log('✅ Found existing upload link for:', clientName)
    } else {
      // Create new permanent tokens
      uploadToken = generateSecureToken()
      reviewToken = generateSecureToken()
      
      // Create placeholder submission (no brief = never used)
      const { error } = await supabase
        .from('submissions')
        .insert({
          client_id: clientId,
          upload_token: uploadToken,
          review_token: reviewToken,
          client_name: clientName,
          status: 'pending',
          // No brief_text = this is a placeholder, not a real submission
        })
      
      if (error) {
        throw error
      }
      
      console.log('✅ Created new upload link for:', clientName)
    }
    
    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const uploadUrl = `${baseUrl}/upload/${uploadToken}`
    const reviewUrl = `${baseUrl}/review/${reviewToken}`
    
    // Output
    console.log('\n📤 Permanent Upload URL:')
    console.log(uploadUrl)
    console.log('\n📋 Review URL (for testing):')
    console.log(reviewUrl)
    console.log('\n💡 WhatsApp Message Template:')
    console.log('---')
    console.log(`Hi ${clientName}! 👋`)
    console.log('')
    console.log(`Here's your personal content upload link:`)
    console.log(`${uploadUrl}`)
    console.log('')
    console.log(`💡 Save this link! Use it whenever you want to upload new content.`)
    console.log('')
    console.log(`Just upload your images and add a brief note about what you'd like to post. We'll handle the rest! ✨`)
    console.log('---')
    console.log('\n✅ Done!\n')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const clientIdIndex = args.findIndex(arg => arg === '--client-id')

if (clientIdIndex !== -1 && args[clientIdIndex + 1]) {
  const clientId = args[clientIdIndex + 1]
  getClientUploadLink(undefined, clientId)
} else if (args.length >= 1) {
  const [clientName] = args
  getClientUploadLink(clientName)
} else {
  console.log(`
Usage:
  npx tsx scripts/get-client-upload-link.ts "Client Name"

Or with client ID:
  npx tsx scripts/get-client-upload-link.ts --client-id "uuid-here"

Examples:
  npx tsx scripts/get-client-upload-link.ts "No Label Barber"
  npx tsx scripts/get-client-upload-link.ts --client-id "69b0fdf5-e4bb-4c4d-9531-bc3c34089fca"

This creates ONE permanent link per client. Run it again for the same client and you'll get the same URL.
  `)
  process.exit(0)
}
