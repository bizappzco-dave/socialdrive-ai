'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BrandProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    brand_name: '',
    industry: '',
    location: '',
    website: '',
    target_audience: '',
    tone: '',
    personality: '',
    usps: '',
    competitor_brands: '',
    key_messages: '',
    avoid_words: '',
    platforms: [] as string[],
    instagram_handle: '',
    facebook_handle: '',
    linkedin_handle: '',
  })
  
  useEffect(() => {
    loadBrandProfile()
  }, [])
  
  const loadBrandProfile = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!client) return
      
      const { data: brandContext } = await supabase
        .from('brand_contexts')
        .select('*')
        .eq('client_id', client.id)
        .single()
      
      if (brandContext) {
        setFormData({
          brand_name: brandContext.brand_name || '',
          industry: brandContext.industry || '',
          location: brandContext.location || '',
          website: brandContext.website || '',
          target_audience: brandContext.target_audience || '',
          tone: brandContext.tone || '',
          personality: brandContext.personality || '',
          usps: Array.isArray(brandContext.usps) ? brandContext.usps.join(', ') : '',
          competitor_brands: Array.isArray(brandContext.competitor_brands) ? brandContext.competitor_brands.join(', ') : '',
          key_messages: Array.isArray(brandContext.key_messages) ? brandContext.key_messages.join(', ') : '',
          avoid_words: Array.isArray(brandContext.avoid_words) ? brandContext.avoid_words.join(', ') : '',
          platforms: brandContext.platforms || [],
          instagram_handle: brandContext.instagram_handle || '',
          facebook_handle: brandContext.facebook_handle || '',
          linkedin_handle: brandContext.linkedin_handle || '',
        })
      }
    } catch (error) {
      console.error('Error loading brand profile:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!client) throw new Error('Client not found')
      
      // Convert comma-separated strings to arrays
      const brandData = {
        ...formData,
        usps: formData.usps.split(',').map(s => s.trim()).filter(Boolean),
        competitor_brands: formData.competitor_brands.split(',').map(s => s.trim()).filter(Boolean),
        key_messages: formData.key_messages.split(',').map(s => s.trim()).filter(Boolean),
        avoid_words: formData.avoid_words.split(',').map(s => s.trim()).filter(Boolean),
      }
      
      const { error } = await supabase
        .from('brand_contexts')
        .upsert({
          client_id: client.id,
          ...brandData,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id',
        })
      
      if (error) throw error
      
      setMessage('✅ Brand profile updated successfully!')
    } catch (error: any) {
      setMessage(`❌ Error saving: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }
  
  const togglePlatform = (platform: string) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform],
    }))
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading your brand profile...</div>
      </div>
    )
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Brand Profile 🏢
        </h1>
        <p className="text-gray-600">
          This information helps our AI create content that perfectly matches your brand voice and style.
        </p>
      </div>
      
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message}
        </div>
      )}
      
      {/* Basic Info */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand/Business Name *
            </label>
            <input
              type="text"
              value={formData.brand_name}
              onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., No Label Barber"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Barber Shop, Restaurant, Retail"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Dublin, Ireland"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website URL
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>
      </div>
      
      {/* Brand Voice */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Brand Voice & Audience</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target Audience *
          </label>
          <textarea
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your ideal customer (age, demographics, interests, location, etc.)"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Tone *
            </label>
            <select
              value={formData.tone}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a tone...</option>
              <option value="Professional & polished">Professional & polished</option>
              <option value="Friendly & approachable">Friendly & approachable</option>
              <option value="Bold & edgy">Bold & edgy</option>
              <option value="Luxurious & exclusive">Luxurious & exclusive</option>
              <option value="Fun & playful">Fun & playful</option>
              <option value="Other">Other (describe in personality)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brand Personality
            </label>
            <input
              type="text"
              value={formData.personality}
              onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Warm, authoritative, witty"
            />
          </div>
        </div>
      </div>
      
      {/* Differentiators */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">What Makes You Different</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Unique Selling Points (USPs) *
          </label>
          <textarea
            value={formData.usps}
            onChange={(e) => setFormData({ ...formData, usps: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="List what makes you unique (separate with commas): e.g., 20 years experience, premium products, city center location"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Competitors
          </label>
          <input
            type="text"
            value={formData.competitor_brands}
            onChange={(e) => setFormData({ ...formData, competitor_brands: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Name 2-3 competitors (separate with commas)"
          />
        </div>
      </div>
      
      {/* Content Guidelines */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Content Guidelines</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Words/Phrases to ALWAYS Use
            </label>
            <input
              type="text"
              value={formData.key_messages}
              onChange={(e) => setFormData({ ...formData, key_messages: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Dublin, master craftsmanship, book now"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Words to AVOID
            </label>
            <input
              type="text"
              value={formData.avoid_words}
              onChange={(e) => setFormData({ ...formData, avoid_words: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., cheap, discount, budget"
            />
          </div>
        </div>
      </div>
      
      {/* Social Media */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Social Media Platforms</h2>
        
        <div className="flex space-x-4 mb-4">
          {['instagram', 'facebook', 'linkedin'].map((platform) => (
            <label key={platform} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={() => togglePlatform(platform)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {platform}
              </span>
            </label>
          ))}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Instagram Handle
            </label>
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="@yourhandle"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebook Page
            </label>
            <input
              type="text"
              value={formData.facebook_handle}
              onChange={(e) => setFormData({ ...formData, facebook_handle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Page Name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LinkedIn Company
            </label>
            <input
              type="text"
              value={formData.linkedin_handle}
              onChange={(e) => setFormData({ ...formData, linkedin_handle: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Company Name"
            />
          </div>
        </div>
      </div>
      
      {/* Save Button */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving...' : 'Save Brand Profile'}
        </button>
      </div>
    </div>
  )
}
