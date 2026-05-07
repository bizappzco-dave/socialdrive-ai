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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Getting everything ready...</p>
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
