'use client'

import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'

function SignInForm() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleSignIn() {
    setLoading(true)
    setError(null)
    
    try {
      await signIn('google', { callbackUrl })
    } catch (err: any) {
      setError(err.message || 'Failed to sign in')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SocialDrive AI</h1>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-3 border-2 border-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12.53 19.73c2.67 0 4.92-.88 6.57-2.39l-3.18-2.65c-.89.6-2.03.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.6v3.29c1.65 3.06 4.87 4.92 8.93 4.92z"
            />
            <path
              fill="currentColor"
              d="M6.92 11.53c-.21-.63-.33-1.3-.33-1.99s.12-1.36.33-1.99V4.26H3.6C1.33 6.56 0 9.65 0 12.81s1.33 6.25 3.6 8.55l3.32-2.59c-.81-2.37-.81-4.92 0-7.24z"
            />
            <path
              fill="currentColor"
              d="M12.53 5.18c1.45-.02 2.85.53 3.9 1.53l2.93-2.93C17.57 1.94 15.13.88 12.53.88 8.47.88 5.25 2.74 3.6 5.8l3.32 2.59c.79-2.37 3-4.13 5.61-4.13z"
            />
          </svg>
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>

        <div className="text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
