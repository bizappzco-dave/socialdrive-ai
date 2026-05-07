'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Save, Globe, Users, Target, Trophy, MessageCircle, CheckCircle, Loader2 } from 'lucide-react'

interface Client {
  id: string
  name: string
  industry: string
  website_url?: string
  instagram_handle?: string
  facebook_handle?: string
  linkedin_handle?: string
  target_audience?: string
  brand_tone?: string
  brand_voice?: string
  usps?: string
  competitors?: string
  words_to_use?: string
  words_to_avoid?: string
  content_preferences?: string[]
  brand_guidelines_url?: string
  dmchamp_onboarded: boolean
}

const CONTENT_PREFERENCES = [
  'Before/after photos',
  'Team spotlights',
  'Promotions/offers',
  'Educational tips',
  'Behind the scenes',
  'Customer testimonials',
  'Product showcases',
  'Industry news',
]

const BRAND_TONES = [
  'Professional & polished',
  'Friendly & approachable',
  'Bold & edgy',
  'Luxurious & exclusive',
  'Fun & playful',
  'Witty & humorous',
  'Inspirational & motivational',
  'Educational & authoritative',
]

export default function ClientBrandProfilePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [client, setClient] = useState<Client | null>(null)
  const [formData, setFormData] = useState<Partial<Client>>({})

  useEffect(() => {
    loadClient()
  }, [clientId])

  async function loadClient() {
    try {
      const response = await fetch(`/api/agency/clients/${clientId}`)
      const data = await response.json()
      setClient(data)
      setFormData(data)
    } catch (error) {
      console.error('Failed to load client:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`/api/agency/clients/${clientId}/brand`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save brand profile')
      }

      // Mark as onboarded
      await fetch(`/api/agency/clients/${clientId}/brand/onboarded`, {
        method: 'POST',
      })

      alert('✅ Brand profile saved!')
      loadClient() // Refresh to show updated data
      
    } catch (error: any) {
      console.error('Failed to save:', error)
      alert('Failed to save: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleContentPreference(preference: string) {
    const current = formData.content_preferences || []
    const updated = current.includes(preference)
      ? current.filter(p => p !== preference)
      : [...current, preference]
    
    setFormData({ ...formData, content_preferences: updated })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading client profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Clients
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Brand Profile</h1>
              <p className="text-sm text-gray-600 mt-1">
                {client?.name} • Paste responses from DM Champ onboarding chat
              </p>
            </div>
            {client?.dmchamp_onboarded && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                <CheckCircle className="h-4 w-4" />
                Onboarded
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Section 1: Online Presence */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Online Presence
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={formData.website_url || ''}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-pink-600" />
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={formData.instagram_handle || ''}
                  onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value.replace('@', '') })}
                  placeholder="nolabelbarber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-600" />
                  Facebook Handle
                </label>
                <input
                  type="text"
                  value={formData.facebook_handle || ''}
                  onChange={(e) => setFormData({ ...formData, facebook_handle: e.target.value })}
                  placeholder="NoLabelBarber"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-700" />
                  LinkedIn Handle
                </label>
                <input
                  type="text"
                  value={formData.linkedin_handle || ''}
                  onChange={(e) => setFormData({ ...formData, linkedin_handle: e.target.value })}
                  placeholder="company-name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Brand & Audience */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Brand & Audience
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Target Audience
              </label>
              <textarea
                value={formData.target_audience || ''}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                placeholder="e.g., Men 25-45, professionals, care about grooming, value quality over price"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Tone
              </label>
              <textarea
                value={formData.brand_tone || ''}
                onChange={(e) => setFormData({ ...formData, brand_tone: e.target.value })}
                placeholder="Describe your brand tone in your own words...\n\nExamples:\n- 'Friendly and down-to-earth, like chatting with your mate at the pub'\n- 'Professional but not stuffy - we take our craft seriously but not ourselves'\n- 'Bold, direct, no-nonsense Dublin attitude'\n- 'Warm, welcoming, community-focused'"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Paste the exact response from your DM Champ onboarding chat
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Voice (Description)
              </label>
              <textarea
                value={formData.brand_voice || ''}
                onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
                placeholder="e.g., Authoritative but approachable, like a master craftsman sharing wisdom"
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Competitive Positioning */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Competitive Positioning
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unique Selling Points (USPs)
              </label>
              <textarea
                value={formData.usps || ''}
                onChange={(e) => setFormData({ ...formData, usps: e.target.value })}
                placeholder="e.g., Master barbers with 10+ years experience, premium products, Dublin city centre location"
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Competitors
              </label>
              <input
                type="text"
                value={formData.competitors || ''}
                onChange={(e) => setFormData({ ...formData, competitors: e.target.value })}
                placeholder="e.g., Blade & Barrel, The Groom Room, Sharp Cuts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
            </div>
          </div>
        </div>

        {/* Section 4: Content Guidelines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            Content Guidelines
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Words/Phrases to ALWAYS Use
              </label>
              <input
                type="text"
                value={formData.words_to_use || ''}
                onChange={(e) => setFormData({ ...formData, words_to_use: e.target.value })}
                placeholder="e.g., Dublin, master craftsmanship, book now"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Words/Phrases to AVOID
              </label>
              <input
                type="text"
                value={formData.words_to_avoid || ''}
                onChange={(e) => setFormData({ ...formData, words_to_avoid: e.target.value })}
                placeholder="e.g., cheap, discount, budget"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Comma-separated list</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Content Types
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {CONTENT_PREFERENCES.map(preference => (
                  <label key={preference} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.content_preferences || []).includes(preference)}
                      onChange={() => toggleContentPreference(preference)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{preference}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Guidelines Document (URL)
              </label>
              <input
                type="url"
                value={formData.brand_guidelines_url || ''}
                onChange={(e) => setFormData({ ...formData, brand_guidelines_url: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">Optional: Link to brand guidelines PDF or doc</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Brand Profile
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          💡 Tip: Copy responses from DM Champ chat and paste into the relevant fields above.
        </p>
      </form>
    </div>
  )
}
