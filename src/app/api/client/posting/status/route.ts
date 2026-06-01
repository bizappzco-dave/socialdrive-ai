import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserClientAccess, hasRoleAtLeast } from '@/lib/client-access'

export async function GET(request: Request) {
  try {
    const accessResult = await getCurrentUserClientAccess()
    if (!accessResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!hasRoleAtLeast(accessResult.access.role, 'viewer')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('job_id')

    const supabase = createAdminClient()

    let query = supabase
      .from('posting_jobs')
      .select('id, uploadpost_request_id, uploadpost_job_id, mode, status, error_message, posted_at, scheduled_date_utc, updated_at, created_at')
      .eq('client_id', accessResult.access.clientId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (jobId) query = query.eq('id', jobId)

    const { data, error } = await query
    if (error) throw error

    return NextResponse.json({ success: true, jobs: data || [] })
  } catch (err: any) {
    console.error('Posting status API error:', err)
    return NextResponse.json({ error: err.message || 'Failed to fetch job status' }, { status: 500 })
  }
}
