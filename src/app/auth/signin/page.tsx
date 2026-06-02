'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  async function handleMagicLinkSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({
        email,
      })

      if (error) throw error

      setMagicLinkSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    console.log('Starting sign-in for:', email)
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      console.log('Supabase client created')
      
      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      console.log('Sign-in result:', result)

      if (result.error) {
        console.error('Sign-in error:', result.error)
        throw result.error
      }

      console.log('Sign-in successful, redirecting...')
      
      // Check what cookies were set
      console.log('Cookies after sign-in:', document.cookie)
      
      // Refresh session to ensure cookies are fully set
      await supabase.auth.refreshSession()
      console.log('Session refreshed')
      console.log('Cookies after refresh:', document.cookie)
      
      // Small delay to ensure cookies propagate
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Full page reload to ensure session cookies persist
      console.log('Redirecting to /client/posting...')
      window.location.href = '/client/posting'
    } catch (err: any) {
      console.error('Sign-in failed:', err)
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

        {magicLinkSent ? (
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700 text-sm">
              Magic link sent to <strong>{email}</strong>. Check your email and click the link to sign in.
            </p>
            <button
              onClick={() => setMagicLinkSent(false)}
              className="mt-3 text-green-700 underline text-sm"
            >
              Try another email
            </button>
          </div>
        ) : (
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password (optional)
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave blank for magic link"
              />
            </div>

            <button
              type="submit"
              onClick={password ? handlePasswordSignIn : handleMagicLinkSignIn}
              disabled={loading || !email}
              className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : password ? 'Sign in with Password' : 'Send Magic Link'}
            </button>
          </form>
        )}

        <div className="text-center text-sm text-gray-500">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </div>
    </div>
  )
}
