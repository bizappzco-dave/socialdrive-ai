'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import SimpleUploadPage from './simple-page'
import ProUploadPage from './pro-page'

export default function UploadClient() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<string>('simple')

  useEffect(() => {
    async function loadClientTier() {
      try {
        const response = await fetch(`/api/submissions/upload/${token}`)
        const data = await response.json()
        
        if (response.ok && data.client) {
          setTier(data.client.tier || 'simple')
        } else {
          setTier('simple')
        }
      } catch (err) {
        console.error('Failed to load client tier:', err)
        setTier('simple')
      } finally {
        setLoading(false)
      }
    }
    
    loadClientTier()
  }, [token])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,#dcfce7,transparent_34%),linear-gradient(180deg,#ffffff,#f8fafc)] px-4">
        <div className="rounded-2xl border border-slate-200 bg-white/90 px-8 py-7 text-center shadow-sm backdrop-blur">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="font-semibold text-slate-950">Getting everything ready</p>
          <p className="mt-1 text-sm text-slate-500">Preparing your secure SocialDrive upload link.</p>
        </div>
      </div>
    )
  }

  // Route based on tier
  if (tier === 'simple') {
    return <SimpleUploadPage />
  } else {
    return <ProUploadPage />
  }
}
