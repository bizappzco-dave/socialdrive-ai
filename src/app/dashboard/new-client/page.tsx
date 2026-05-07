'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    drive_folder_url: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Extract folder ID from URL if provided
      let drive_folder_id = ''
      if (formData.drive_folder_url) {
        const match = formData.drive_folder_url.match(/\/folders\/([a-zA-Z0-9_-]+)/)
        if (match) {
          drive_folder_id = match[1]
        }
      }

      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: formData.name,
          industry: formData.industry || null,
          drive_folder_id: drive_folder_id || null,
          drive_folder_url: formData.drive_folder_url || null,
          is_active: true,
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to client dashboard
      router.push(`/dashboard/${data.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Add New Client</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Client Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Client Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., NoLabel Dublin"
            />
          </div>

          {/* Industry */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-2">
              Industry
            </label>
            <input
              type="text"
              id="industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Barber Salon, Bakery, Real Estate"
            />
          </div>

          {/* Google Drive Folder URL */}
          <div>
            <label htmlFor="drive_folder_url" className="block text-sm font-medium text-gray-700 mb-2">
              Google Drive Folder URL
            </label>
            <input
              type="url"
              id="drive_folder_url"
              value={formData.drive_folder_url}
              onChange={(e) => setFormData({ ...formData, drive_folder_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://drive.google.com/drive/folders/..."
            />
            <p className="mt-1 text-sm text-gray-500">
              The folder where clients will drop their images. We'll extract the folder ID automatically.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating...' : 'Create Client'}
            </button>
            
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Help Text */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">Next Steps</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Create a Google Drive folder for this client</li>
            <li>2. Share the folder with your Google Drive service account</li>
            <li>3. Add the folder URL above</li>
            <li>4. Create a brand-context.md file in the folder</li>
          </ol>
        </div>
      </main>
    </div>
  )
}
