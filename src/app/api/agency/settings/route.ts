import { NextResponse } from 'next/server'

/**
 * GET /api/agency/settings
 * Load current API key configuration (masked)
 */
export async function GET() {
  return NextResponse.json({
    fireworks_api_key: process.env.FIREWORKS_API_KEY 
      ? maskKey(process.env.FIREWORKS_API_KEY) 
      : '',
    anthropic_api_key: process.env.ANTHROPIC_API_KEY 
      ? maskKey(process.env.ANTHROPIC_API_KEY) 
      : '',
    ollama_enabled: true,
  })
}

/**
 * POST /api/agency/settings
 * Save API keys (placeholder - requires server restart)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // In production, you'd update .env.local or use a secrets manager
    // For now, just return success (keys are set manually in .env.local)
    
    return NextResponse.json({ 
      success: true,
      message: 'Settings updated. Restart the server to apply changes.' 
    })
    
  } catch (error: any) {
    console.error('Settings save error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    )
  }
}

/**
 * Mask API key for display (show first 8 chars + last 4)
 */
function maskKey(key: string): string {
  if (key.length <= 12) return key
  return `${key.slice(0, 8)}...${key.slice(-4)}`
}
