#!/usr/bin/env node

/**
 * Create Upload Link for Client
 * 
 * Usage: 
 *   npx tsx scripts/create-upload-link.ts "Client Name" "client@email.com" "+353871234567"
 * 
 * Or with client ID:
 *   npx tsx scripts/create-upload-link.ts --client-id "uuid-here"
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function createUploadLink(
  clientName: string,
  clientEmail?: string,
  clientPhone?: string,
  clientId?: string
) {
  try {
    // If clientId not provided, find by name
    if (!clientId) {
      const { data: client, error } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', `%${clientName}%`)
        .single()
      
      if (error || !client) {
        console.error('Client not found:', clientName)
        process.exit(1)
      }
      
      clientId = client.id
    }
    
    // Generate secure tokens
    const uploadToken = generateSecureToken()
    const reviewToken = generateSecureToken()
    
    // Create submission record
    const { data: submission, error } = await supabase
      .from('submissions')
      .insert({
        client_id: clientId,
        upload_token: uploadToken,
        review_token: reviewToken,
        client_name: clientName,
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        status: 'pending',
      })
      .select()
      .single()
    
    if (error) {
      throw error
    }
    
    // Generate URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const uploadUrl = `${baseUrl}/upload/${uploadToken}`
    const reviewUrl = `${baseUrl}/review/${reviewToken}`
    
    // Output
    console.log('\n✅ Upload Link Created!\n')
    console.log('Client:', clientName)
    console.log('Email:', clientEmail || 'Not provided')
    console.log('Phone:', clientPhone || 'Not provided')
    console.log('\n📤 Upload URL:')
    console.log(uploadUrl)
    console.log('\n📋 Review URL:')
    console.log(reviewUrl)
    console.log('\n💡 WhatsApp Message Template:')
    console.log(`---`)
    console.log(`Hi ${clientName}! 👋`)
    console.log(``)
    console.log(`Your content upload link is ready:`)
    console.log(`${uploadUrl}`)
    console.log(``)
    console.log(`Just upload your images and add a brief note about what you'd like to post this week. We'll handle the rest! ✨`)
    console.log(`---`)
    console.log('\n✅ Done!\n')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

function generateSecureToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(16).toString('hex') // 32 character hex string
}

// Parse command line arguments
const args = process.argv.slice(2)
const clientIdIndex = args.findIndex(arg => arg === '--client-id')

if (clientIdIndex !== -1 && args[clientIdIndex + 1]) {
  const clientId = args[clientIdIndex + 1]
  const clientName = args.find(arg => !arg.startsWith('--')) || 'Client'
  createUploadLink(clientName, undefined, undefined, clientId)
} else if (args.length >= 1) {
  const [clientName, clientEmail, clientPhone] = args
  createUploadLink(clientName, clientEmail, clientPhone)
} else {
  console.log(`
Usage:
  npx tsx scripts/create-upload-link.ts "Client Name" "email@example.com" "+353871234567"

Or with client ID:
  npx tsx scripts/create-upload-link.ts --client-id "uuid-here" ["Client Name"]

Examples:
  npx tsx scripts/create-upload-link.ts "No Label Barber" "dpmcgoldrick@gmail.com" "+353871234567"
  npx tsx scripts/create-upload-link.ts --client-id "69b0fdf5-e4bb-4c4d-9531-bc3c34089fca"
  `)
  process.exit(0)
}
