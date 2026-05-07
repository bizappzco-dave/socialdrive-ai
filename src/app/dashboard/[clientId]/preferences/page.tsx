'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, Loader2, Clock, Calendar } from 'lucide-react'

const DAYS = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 0, label: 'Sun' },
]

const TIME_RANGES = [
  { value: '9-11', label: 'Morning (9-11 AM)', start: 9, end: 11 },
  { value: '11-13', label: 'Late Morning (11 AM-1 PM)', start: 11, end: 13 },
  { value: '13-15', label: 'Afternoon (1-3 PM)', start: 13, end: 15 },
  { value: '15-17', label: 'Late Afternoon (3-5 PM)', start: 15, end: 17 },
  { value: '17-19', label: 'Evening (5-7 PM)', start: 17, end: 19 },
  { value: '19-21', label: 'Night (7-9 PM)', start: 19, end: 21 },
]

interface ClientPreferences {
  preferred_days?: number[]
  preferred_hours?: string[]
  optimal_hashtag_count?: number
  preferred_hashtags?: string[]
  optimal_emoji_count?: number
}

interface Client {
  id: string
  name: string
  industry?: string
}

export default function ClientPreferencesPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.clientId as string
  
  const [client, setClient] = useState<Client | null>(null)
  const [preferences, setPreferences] = useState<ClientPreferences>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPreferences()
  }, [clientId])

  async function loadPreferences() {
    try {
      const supabase = createClient()
      
      // Load client info
      const { data: clientData } = await supabase
        .from('clients')
        .select('id, name, industry')
        .eq('id', clientId)
        .single()
      
      setClient(clientData)
      
      // Load preferences
      const { data: prefData } = await supabase
        .from('client_preferences')
        .select('*')
        .eq('client_id', clientId)
        .single()
      
      if (prefData) {
        setPreferences({
          preferred_days: prefData.preferred_days || [],
          preferred_hours: prefData.preferred_hours || [],
          optimal_hashtag_count: prefData.optimal_hashtag_count || 5,
          preferred_hashtags: prefData.preferred_hashtags || [],
          optimal_emoji_count: prefData.optimal_emoji_count || 3,
        })
      }
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function savePreferences() {
    setSaving(true)
    setSaved(false)
    setError(null)
    
    try {
      const supabase = createClient()
      
      const { data: existing } = await supabase
        .from('client_preferences')
        .select('client_id')
        .eq('client_id', clientId)
        .single()
      
      if (existing) {
        const { error } = await supabase
          .from('client_preferences')
          .update({
            preferred_days: preferences.preferred_days,
            preferred_hours: preferences.preferred_hours,
            optimal_hashtag_count: preferences.optimal_hashtag_count,
            preferred_hashtags: preferences.preferred_hashtags,
            optimal_emoji_count: preferences.optimal_emoji_count,
            last_updated: new Date().toISOString(),
          })
          .eq('client_id', clientId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('client_preferences')
          .insert({
            client_id: clientId,
            preferred_days: preferences.preferred_days,
            preferred_hours: preferences.preferred_hours,
            optimal_hashtag_count: preferences.optimal_hashtag_count,
            preferred_hashtags: preferences.preferred_hashtags,
            optimal_emoji_count: preferences.optimal_emoji_count,
            total_posts_curated: 0,
          })
        
        if (error) throw error
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleDay(dayValue: number) {
    const current = preferences.preferred_days || []
    const updated = current.includes(dayValue)
      ? current.filter(d => d !== dayValue)
      : [...current, dayValue]
    
    setPreferences({ ...preferences, preferred_days: updated })
  }

  function toggleTimeRange(rangeValue: string) {
    const current = preferences.preferred_hours || []
    const updated = current.includes(rangeValue)
      ? current.filter(r => r !== rangeValue)
      : [...current, rangeValue]
    
    setPreferences({ ...preferences, preferred_hours: updated })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
              <Link 
                href={`/dashboard/${clientId}`}
                className="text-sm text-blue-600 hover:underline mb-2 block"
              >
                ← Back to {client?.name}
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Posting Preferences</h1>
              {client?.industry && (
                <p className="text-gray-600 mt-1">{client.industry}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {saved && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-green-700">✅ Preferences saved!</p>
          </div>
        )}

        {/* Preferred Days */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preferred Days</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Posts will be scheduled on these days when you approve content for posting.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  (preferences.preferred_days || []).includes(day.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
          
          {(preferences.preferred_days || []).length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              No days selected - posts will use random scheduling
            </p>
          )}
        </div>

        {/* Preferred Times */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Preferred Time Ranges</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Posts will be scheduled within these time windows.
          </p>
          
          <div className="space-y-2">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => toggleTimeRange(range.value)}
                className={`w-full px-4 py-3 rounded-lg font-medium transition-colors text-left ${
                  (preferences.preferred_hours || []).includes(range.value)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          {(preferences.preferred_hours || []).length === 0 && (
            <p className="text-sm text-gray-500 mt-3">
              No times selected - posts will use random scheduling (9 AM - 5 PM)
            </p>
          )}
        </div>

        {/* Hashtag Count */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hashtag Strategy</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimal Hashtag Count
            </label>
            <select
              value={preferences.optimal_hashtag_count || 5}
              onChange={(e) => setPreferences({ 
                ...preferences, 
                optimal_hashtag_count: parseInt(e.target.value) 
              })}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value={0}>No hashtags</option>
              <option value={3}>3 hashtags (minimal)</option>
              <option value={5}>5 hashtags (moderate)</option>
              <option value={10}>10 hashtags (standard)</option>
              <option value={15}>15 hashtags (aggressive)</option>
              <option value={30}>30 hashtags (maximum)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Default Hashtags (comma-separated)
            </label>
            <input
              type="text"
              value={(preferences.preferred_hashtags || []).join(', ')}
              onChange={(e) => setPreferences({ 
                ...preferences, 
                preferred_hashtags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
              })}
              placeholder="#YourBrand, #YourIndustry, #YourCity"
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-sm text-gray-500 mt-1">
              These will be added to all posts automatically
            </p>
          </div>
        </div>

        {/* Emoji Count */}
        <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Emoji Usage</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimal Emoji Count per Post
            </label>
            <select
              value={preferences.optimal_emoji_count || 3}
              onChange={(e) => setPreferences({ 
                ...preferences, 
                optimal_emoji_count: parseInt(e.target.value) 
              })}
              className="w-full border rounded-lg px-3 py-2 bg-white"
            >
              <option value={0}>No emojis</option>
              <option value={1}>1 emoji (minimal)</option>
              <option value={3}>3 emojis (moderate)</option>
              <option value={5}>5 emojis (expressive)</option>
              <option value={10}>10 emojis (maximum)</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/${clientId}`}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={savePreferences}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Preferences
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  )
}
