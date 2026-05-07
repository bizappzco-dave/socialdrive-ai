'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import SimpleUploadPage from './simple-page'
import ProUploadPage from './page'  // Current page becomes Pro

export default function UploadRouter() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [tier, setTier] = useState<string | null>(null)

  useEffect(() => {
    async function loadClientTier() {
      try {
        // Get submission info including client tier
        const response = await fetch(`/api/submissions/upload/${token}`)
        const data = await response.json()
        
        if (response.ok && data.client) {
          setTier(data.client.tier || 'simple')
        } else {
          // Default to simple if we can't determine
          setTier('simple')
        }
      } catch (err) {
        console.error('Failed to load client tier:', err)
        // Default to simple on error
        setTier('simple')
      } finally {
        setLoading(false)
      }
    }
    
    loadClientTier()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Getting everything ready...</p>
        </div>
      </div>
    )
  }

  // Route to appropriate upload page based on tier
  if (tier === 'simple') {
    return <SimpleUploadPage />
  } else if (tier === 'pro') {
    return <ProUploadPage />
  } else {
    // Agency or unknown - use Pro for now
    return <ProUploadPage />
  }
}
