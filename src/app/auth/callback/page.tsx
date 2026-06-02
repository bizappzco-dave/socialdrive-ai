'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        const supabase = createClient()
        
        // Exchange the code for a session
        const { error } = await supabase.auth.getSession()
        
        if (error) throw error

        // Check if user has client access
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          setError('No user found')
          return
        }

        // Redirect to client posting dashboard
        router.push('/client/posting')
      } catch (err: any) {
        setError(err.message || 'Authentication failed')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {error ? (
          <>
            <div className="text-red-600 text-lg font-medium mb-2">Authentication Error</div>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="text-blue-600 hover:underline"
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Completing sign in...</p>
          </>
        )}
      </div>
    </div>
  )
}
