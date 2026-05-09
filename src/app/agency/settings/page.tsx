'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react'

export default function AgencySettingsPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  
  const [settings, setSettings] = useState({
    fireworks_api_key: '',
    anthropic_api_key: '',
    ollama_enabled: true,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const response = await fetch('/api/agency/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    }
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const response = await fetch('/api/agency/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
    } catch (error: any) {
      alert('Failed to save settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agency Settings</h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure AI models and API keys
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* AI Models Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Models</h2>
            
            {/* Ollama Cloud */}
            <div className="mb-6">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.ollama_enabled}
                  onChange={(e) => setSettings({ ...settings, ollama_enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <div>
                  <div className="font-medium text-gray-900">Ollama Cloud (Default)</div>
                  <div className="text-sm text-gray-600">Free, unlimited • qwen3.5:397b</div>
                </div>
              </label>
            </div>

            {/* Claude API */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Claude API Key (Premium)
              </label>
              <div className="relative">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={settings.anthropic_api_key}
                  onChange={(e) => setSettings({ ...settings, anthropic_api_key: e.target.value })}
                  placeholder="sk-ant-api03-..."
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your key from <a href="https://console.anthropic.com" target="_blank" className="text-blue-600 hover:underline">console.anthropic.com</a>
              </p>
            </div>

            {/* Fireworks AI */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fireworks API Key (Mistral Large 3)
              </label>
              <div className="relative">
                <input
                  type={showKeys ? 'text' : 'password'}
                  value={settings.fireworks_api_key}
                  onChange={(e) => setSettings({ ...settings, fireworks_api_key: e.target.value })}
                  placeholder="fw_..."
                  className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <button
                  onClick={() => setShowKeys(!showKeys)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKeys ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Get your key from <a href="https://fireworks.ai/api-keys" target="_blank" className="text-blue-600 hover:underline">fireworks.ai/api-keys</a>
              </p>
            </div>
          </div>

          {/* Model Comparison */}
          <div className="p-6 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Model Comparison</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ollama Cloud</span>
                <span className="font-medium text-green-600">Free, unlimited</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Claude Sonnet 4.5</span>
                <span className="font-medium text-yellow-600">€2-5 per long conversation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Mistral Large 3</span>
                <span className="font-medium text-orange-600">€0.50-1 per batch</span>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="p-6 border-t border-gray-200">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : saved ? (
                <>
                  <Save className="h-4 w-4" />
                  Saved!
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> API keys are stored in environment variables on the server. 
            Changes require a server restart to take effect.
          </p>
        </div>
      </div>
    </div>
  )
}
