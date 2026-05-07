'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ExportCSVButton } from '@/components/dashboard/ExportCSVButton'

interface Client {
  id: string
  name: string
  industry?: string
  drive_folder_url?: string
  is_active: boolean
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
            <h1 className="text-3xl font-bold text-gray-900">SocialDrive AI</h1>
            <Link
              href="/dashboard/new-client"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add Client
            </Link>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No clients yet</h2>
            <p className="text-gray-600 mb-6">Get started by adding your first client</p>
            <Link
              href="/dashboard/new-client"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Add Your First Client
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <Link href={`/dashboard/${client.id}`}>
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Active
                    </span>
                  </div>
                  
                  {client.industry && (
                    <p className="text-gray-600 text-sm mb-4">{client.industry}</p>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Created {new Date(client.created_at).toLocaleDateString()}
                  </div>
                </Link>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <ExportCSVButton 
                    clientId={client.id} 
                    clientName={client.name} 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
