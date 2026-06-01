import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast } from '@/lib/client-access'

export async function GET() {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRoleAtLeast(accessResult.access.role, 'viewer')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('posting_jobs')
      .select('id, submission_id, post_id, mode, status, platform_targets, media_type, error_message, posted_at, created_at')
      .eq('client_id', accessResult.access.clientId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ success: true, history: data || [] })
  } catch (err: any) {
    console.error('Posting history API error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch posting history' }, { status: 500 })
  }
}
