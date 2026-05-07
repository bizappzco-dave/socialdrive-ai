'use client'

import { useState } from 'react'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'

interface GeneratePostsButtonProps {
  clientId: string
  imageUrl: string
  onGenerated?: (posts: any[]) => void
  disabled?: boolean
}

export function GeneratePostsButton({ 
  clientId, 
  imageUrl, 
  onGenerated,
  disabled 
}: GeneratePostsButtonProps) {
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState('')

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setProgress('Checking Ollama...')
    
    try {
      // Check Ollama status first
      const statusResponse = await fetch('/api/generate/captions')
      const status = await statusResponse.json()
      
      if (!status.available) {
        throw new Error(
          `Ollama is not available. ${status.hint || ''}\n\nError: ${status.error}`
        )
      }
      
      setProgress('Generating captions...')
      
      // Generate captions
      const response = await fetch('/api/generate/captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          imageUrl,
          count: 5,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Generation failed')
      }
      
      const result = await response.json()
      
      setProgress(`✅ Generated ${result.count} posts!`)
      
      if (onGenerated) {
        onGenerated(result.posts)
      }
      
    } catch (err: any) {
      console.error('Generation failed:', err)
      setError(err.message)
    } finally {
      setGenerating(false)
      setTimeout(() => setProgress(''), 3000)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={disabled || generating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium shadow-sm"
      >
        {generating ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {progress || 'Generating...'}
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5" />
            Generate Posts with AI
          </>
        )}
      </button>
      
      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Generation failed</p>
            <p className="mt-1 whitespace-pre-wrap">{error}</p>
          </div>
        </div>
      )}
      
      {progress && !error && (
        <div className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          {progress}
        </div>
      )}
    </div>
  )
}
