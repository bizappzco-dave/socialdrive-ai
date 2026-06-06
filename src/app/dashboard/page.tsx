'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Client {
  id: string
  name: string
  upload_token: string
  review_token: string
  tier?: string
  user_id?: string
  created_at: string
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setError('Not authenticated')
        setLoading(false)
        return
      }

      // Get clients owned by user
      const { data: ownedClients, error: ownedError } = await supabase
        .from('clients')
        .select('id, name, upload_token, review_token, tier, user_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ownedError) throw ownedError

      // Get clients where user is staff
      const { data: staffAccess, error: staffError } = await supabase
        .from('client_staff_access')
        .select('client_id, clients:client_id (id, name, upload_token, review_token, tier, user_id, created_at)')
        .eq('user_id', user.id)

      if (staffError) throw staffError

      // Combine both lists (avoid duplicates)
      const staffClients = (staffAccess?.map(s => {
        const client = s.clients
        return Array.isArray(client) ? client[0] : client
      }).filter(Boolean) || []) as Client[]
      
      const allClients = [...(ownedClients || []), ...staffClients]
      
      // Remove duplicates by client id
      const uniqueClientsMap = new Map<string, Client>()
      allClients.forEach((c) => {
        if (c && c.id) {
          uniqueClientsMap.set(c.id, c)
        }
      })
      const uniqueClients = Array.from(uniqueClientsMap.values())

      setClients(uniqueClients)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">SocialDrive AI</h1>
              <p className="text-gray-600 mt-1">Manage your social media content</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/client/staff"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Manage Staff
              </Link>
              <Link
                href="/client/posting"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Post
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No clients found. Create your first client to get started.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{client.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Tier: {client.tier === 'pro' ? 'Pro' : 'Simple'}
                    </p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Active
                  </span>
                </div>

                <div className="space-y-2">
                  <Link
                    href={`/upload/${client.upload_token}`}
                    className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Upload Images
                  </Link>
                  <Link
                    href={`/review?token=${client.review_token}`}
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Review Posts
                  </Link>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
