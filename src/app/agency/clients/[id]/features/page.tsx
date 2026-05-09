'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface ClientFeatures {
  auto_captions: boolean
  platform_optimization: boolean
  hashtags: boolean
  multi_format: boolean
  video_generation: boolean
  caption_variants: boolean
  premium_ai: boolean
  extended_context: boolean
  bulk_upload: boolean
  email_notifications: boolean
  extended_storage: boolean
  priority_processing: boolean
  team_access: boolean
  custom_templates: boolean
  white_label: boolean
  api_access: boolean
  priority_support: boolean
}

export default function ClientFeaturesPage({ params }: { params: { id: string } }) {
  const [features, setFeatures] = useState<ClientFeatures | null>(null)
  const [clientName, setClientName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadClient()
  }, [])

  async function loadClient() {
    const { data } = await supabase
      .from('clients')
      .select('name, features_enabled')
      .eq('id', params.id)
      .single()

    if (data) {
      setClientName(data.name)
      setFeatures(data.features_enabled as ClientFeatures || getDefaultFeatures())
    }
  }

  function getDefaultFeatures(): ClientFeatures {
    return {
      auto_captions: true,
      platform_optimization: false,
      hashtags: false,
      multi_format: true,
      video_generation: true,
      caption_variants: false,
      premium_ai: false,
      extended_context: true,
      bulk_upload: true,
      email_notifications: true,
      extended_storage: false,
      priority_processing: false,
      team_access: false,
      custom_templates: false,
      white_label: false,
      api_access: false,
      priority_support: false
    }
  }

  async function saveFeatures() {
    setSaving(true)
    setMessage('')
    
    const { error } = await supabase
      .from('clients')
      .update({ features_enabled: features })
      .eq('id', params.id)

    setSaving(false)
    
    if (error) {
      setMessage('Error saving features: ' + error.message)
    } else {
      setMessage('✅ Features updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  function toggleFeature(key: keyof ClientFeatures) {
    setFeatures(prev => prev ? { ...prev, [key]: !prev[key] } : null)
  }

  if (!features) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/agency/clients/${params.id}`} className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
            ← Back to {clientName}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Client Features</h1>
          <p className="text-gray-600 mt-2">Customize which features are enabled for {clientName}</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Content Generation */}
        <FeatureSection title="🎨 Content Generation">
          <FeatureToggle
            label="Auto Captions"
            description="AI generates captions for uploaded images automatically"
            checked={features.auto_captions}
            onChange={() => toggleFeature('auto_captions')}
          />
          <FeatureToggle
            label="Platform Optimization"
            description="Generate different caption variations for Instagram, TikTok, and LinkedIn"
            checked={features.platform_optimization}
            onChange={() => toggleFeature('platform_optimization')}
          />
          <FeatureToggle
            label="Hashtag Generation"
            description="Automatically generate relevant hashtags based on content"
            checked={features.hashtags}
            onChange={() => toggleFeature('hashtags')}
          />
          <FeatureToggle
            label="Multi-Format Posts"
            description="Create Square (1:1), Story (9:16), and Reel formats"
            checked={features.multi_format}
            onChange={() => toggleFeature('multi_format')}
          />
          <FeatureToggle
            label="Video/Carousel Creation"
            description="Auto-generate videos and carousels from multiple images"
            checked={features.video_generation}
            onChange={() => toggleFeature('video_generation')}
          />
          <FeatureToggle
            label="Caption Variants"
            description="Generate 3 different caption options to choose from"
            checked={features.caption_variants}
            onChange={() => toggleFeature('caption_variants')}
          />
        </FeatureSection>

        {/* AI Model */}
        <FeatureSection title="🤖 AI Model Selection">
          <FeatureToggle
            label="Premium AI (Claude Sonnet 4.5)"
            description="Higher quality captions, better brand voice matching (~$0.34 per post)"
            checked={features.premium_ai}
            onChange={() => toggleFeature('premium_ai')}
            badge={features.premium_ai ? "PREMIUM" : ""}
          />
          <FeatureToggle
            label="Extended Context"
            description="Use full brand profile, competitors, and guidelines in every caption"
            checked={features.extended_context}
            onChange={() => toggleFeature('extended_context')}
          />
        </FeatureSection>

        {/* Automation */}
        <FeatureSection title="🔄 Automation">
          <FeatureToggle
            label="Bulk Upload"
            description="Upload 50+ images at once for batch processing"
            checked={features.bulk_upload}
            onChange={() => toggleFeature('bulk_upload')}
          />
          <FeatureToggle
            label="Email Notifications"
            description="Notify client when content is ready for review"
            checked={features.email_notifications}
            onChange={() => toggleFeature('email_notifications')}
          />
        </FeatureSection>

        {/* Storage & Access */}
        <FeatureSection title="📁 Storage & Access">
          <FeatureToggle
            label="Extended Storage (10GB)"
            description="More storage for high-res images and videos"
            checked={features.extended_storage}
            onChange={() => toggleFeature('extended_storage')}
            badge={features.extended_storage ? "10GB" : "1GB"}
          />
          <FeatureToggle
            label="Priority Processing"
            description="Jump to the front of the processing queue"
            checked={features.priority_processing}
            onChange={() => toggleFeature('priority_processing')}
          />
          <FeatureToggle
            label="Team Access"
            description="Allow multiple users to manage this client's account"
            checked={features.team_access}
            onChange={() => toggleFeature('team_access')}
          />
        </FeatureSection>

        {/* Advanced */}
        <FeatureSection title="🎯 Advanced Features">
          <FeatureToggle
            label="Custom Templates"
            description="Create and save brand-specific post templates"
            checked={features.custom_templates}
            onChange={() => toggleFeature('custom_templates')}
          />
          <FeatureToggle
            label="White Label"
            description="Remove all SocialDrive branding from client-facing pages"
            checked={features.white_label}
            onChange={() => toggleFeature('white_label')}
          />
          <FeatureToggle
            label="API Access"
            description="Programmatic access to integrate with client's systems"
            checked={features.api_access}
            onChange={() => toggleFeature('api_access')}
          />
          <FeatureToggle
            label="Priority Support"
            description="Faster response times and dedicated support channel"
            checked={features.priority_support}
            onChange={() => toggleFeature('priority_support')}
          />
        </FeatureSection>

        {/* Save Button */}
        <div className="sticky bottom-6 mt-8">
          <button
            onClick={saveFeatures}
            disabled={saving}
            className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transition-all"
          >
            {saving ? 'Saving...' : '💾 Save Features'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FeatureSection({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="mb-8 bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  )
}

function FeatureToggle({
  label,
  description,
  checked,
  onChange,
  badge
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
  badge?: string
}) {
  return (
    <div className="flex items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={onChange}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="ml-3 flex-1">
        <div className="flex items-center gap-2">
          <div className="font-medium text-gray-900">{label}</div>
          {badge && (
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-semibold">
              {badge}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-600 mt-1">{description}</div>
      </div>
    </div>
  )
}
