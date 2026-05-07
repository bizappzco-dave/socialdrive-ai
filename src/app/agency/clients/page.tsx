'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, CheckCircle, Plus, ExternalLink, MessageCircle, Trash2 } from 'lucide-react'

interface Client {
  id: string
  name: string
  industry?: string
  upload_url?: string
  review_url?: string
  has_submission: boolean
  tier?: string
}

export default function AgencyClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null)
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null)

  useEffect(() => {
    loadClients()
  }, [])

  async function loadClients() {
    try {
      const response = await fetch('/api/agency/clients')
      const data = await response.json()
      
      // Handle API errors
      if (!response.ok) {
        console.error('API error:', data)
        setClients([])
        return
      }
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setClients(data)
      } else {
        console.error('Unexpected data format:', data)
        setClients([])
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  async function generateUploadLink(clientId: string) {
    setGenerating(clientId)
    try {
      const response = await fetch('/api/agency/clients/' + clientId + '/upload-link', {
        method: 'POST',
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate link')
      }
      
      // Update local state
      setClients(clients.map(c => 
        c.id === clientId 
          ? { ...c, upload_url: data.upload_url, review_url: data.review_url }
          : c
      ))
      
    } catch (error: any) {
      console.error('Failed to generate link:', error)
      alert('Failed to generate link: ' + error.message)
    } finally {
      setGenerating(null)
    }
  }

  async function copyToClipboard(text: string, type: 'link' | 'message', clientId: string) {
    navigator.clipboard.writeText(text)
    
    if (type === 'link') {
      setCopiedClientId(clientId)
      setTimeout(() => setCopiedClientId(null), 2000)
    } else {
      setCopiedMessage(clientId)
      setTimeout(() => setCopiedMessage(null), 2000)
    }
  }

  async function deleteClient(clientId: string, clientName: string) {
    if (!confirm(`Are you sure you want to delete "${clientName}"? This will permanently delete all their data including posts and submissions.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/agency/clients?id=${clientId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete client')
      }
      
      // Remove from local state
      setClients(clients.filter(c => c.id !== clientId))
      
    } catch (error: any) {
      console.error('Failed to delete client:', error)
      alert('Failed to delete client: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Client Onboarding</h1>
              <p className="text-sm text-gray-600 mt-1">
                Generate upload links for new clients
              </p>
            </div>
            <button
              onClick={() => router.push('/agency/clients/add')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Total Clients</div>
            <div className="text-3xl font-bold text-gray-900">{clients.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Onboarded</div>
            <div className="text-3xl font-bold text-green-600">
              {clients.filter(c => c.upload_url).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-3xl font-bold text-orange-600">
              {clients.filter(c => !c.upload_url).length}
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {clients.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No clients yet. Click "Add Client" to get started.
              </div>
            ) : (
              clients.map((client) => (
                <div key={client.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center justify-between sm:block">
                      <div className="flex items-center gap-3">
                        <h3 className="text-base font-semibold text-gray-900">
                          {client.name}
                        </h3>
                        {client.upload_url ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full whitespace-nowrap">
                            <CheckCircle className="h-3 w-3" />
                            Onboarded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full whitespace-nowrap">
                            <Plus className="h-3 w-3" />
                            Needs Onboarding
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-1 text-sm text-gray-600">
                        {client.industry && <span>{client.industry}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {!client.upload_url ? (
                        <button
                          onClick={() => generateUploadLink(client.id)}
                          disabled={generating === client.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {generating === client.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4" />
                              Generate Upload Link
                            </>
                          )}
                        </button>
                      ) : (
                        <>
                          <a
                            href={`/agency/clients/${client.id}/brand`}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            Brand Profile
                          </a>
                          
                          <button
                            onClick={() => copyToClipboard(client.upload_url!, 'link', client.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            {copiedClientId === client.id ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copy Link
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => copyToClipboard(
                              `Hi ${client.name}! 👋\n\nHere's your personal content upload link:\n${client.upload_url}\n\n💡 Save this link! Use it whenever you want to upload new content.\n\nJust upload your images and add a brief note about what you'd like to post. We'll handle the rest! ✨`,
                              'message',
                              client.id
                            )}
                            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                          >
                            {copiedMessage === client.id ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-4 w-4" />
                                Copy WhatsApp
                              </>
                            )}
                          </button>
                          
                          <a
                            href={client.upload_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
                          >
                            <ExternalLink className="h-4 w-4" />
                            <span className="hidden sm:inline">View</span>
                          </a>
                          
                          <button
                            onClick={() => deleteClient(client.id, client.name)}
                            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
                            title="Delete client"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
