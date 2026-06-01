import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  
  const debug: {
    keyConfigured: boolean
    keyLength: number
    keyStarts: string
    keyEnds: string | undefined
    testCall?: string
    testResponse?: string
    error?: string
    errorType?: string
  } = {
    keyConfigured: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyStarts: apiKey?.substring(0, 15) + '...',
    keyEnds: apiKey?.substring(apiKey.length - 10),
  }
  
  // Try to create client
  try {
    const client = new Anthropic({ apiKey: apiKey || '' })
    const testResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 5,
      messages: [{ role: 'user', content: 'hi' }]
    })
    debug.testCall = 'SUCCESS'
    debug.testResponse = testResponse.content[0].type
  } catch (error: any) {
    debug.testCall = 'FAILED'
    debug.error = error.message
    debug.errorType = error.name
  }
  
  return NextResponse.json(debug)
}
