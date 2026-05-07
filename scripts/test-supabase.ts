import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0 && !key.trim().startsWith('#')) {
    process.env[key.trim()] = valueParts.join('=').trim()
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testConnection() {
  console.log('🧪 Testing Supabase connection...')
  console.log(`URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)

  // Test 1: Check if we can connect
  const { data, error } = await supabase.from('clients').select('count')

  if (error) {
    console.error('❌ Connection failed:', error.message)
    process.exit(1)
  }

  console.log('✅ Connection successful!')
  console.log(`📊 Tables accessible: Yes`)
  console.log(`📊 Current clients: ${data?.length || 0}`)
}

testConnection()
