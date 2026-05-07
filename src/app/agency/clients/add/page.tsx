'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Building2, User, Loader2 } from 'lucide-react'

export default function AddClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    industry: 'Barber Salon',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/agency/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client')
      }

      // Redirect to clients list with success message
      router.push('/agency/clients?created=' + data.client.id)
      
    } catch (err: any) {
      console.error('Failed to create client:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create a new client profile and generate their upload link
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Client Name */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client/Business Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., No Label Barber"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This will be displayed in the upload page and CSV exports
            </p>
          </div>

          {/* Industry */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Barber Salon">Barber / Salon</option>
                <option value="Retail">Retail</option>
                <option value="Restaurant">Restaurant / Cafe</option>
                <option value="Fitness">Fitness / Gym</option>
                <option value="Professional Services">Professional Services</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Used for AI context when generating posts
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !formData.name.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Creating Client...
              </span>
            ) : (
              'Create Client & Generate Upload Link'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            This will create the client and generate their permanent upload link automatically.
          </p>
        </form>
      </div>
    </div>
  )
}
