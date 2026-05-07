'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface ExportCSVButtonProps {
  clientId: string
  clientName: string
  disabled?: boolean
}

export function ExportCSVButton({ clientId, clientName, disabled }: ExportCSVButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [scheduleType, setScheduleType] = useState<'random' | 'specific' | 'draft'>('random')

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const params = new URLSearchParams({
        clientId,
        scheduleType,
      })
      
      const response = await fetch(`/api/export/sociamonials?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export failed')
      }
      
      // Create blob and trigger download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `sociamonials_import_${clientName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (error: any) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={scheduleType}
        onChange={(e) => setScheduleType(e.target.value as typeof scheduleType)}
        className="text-sm border rounded-md px-2 py-1 bg-background"
        disabled={isExporting}
      >
        <option value="random">Random times</option>
        <option value="specific">Specific schedule</option>
        <option value="draft">Draft (no schedule)</option>
      </select>
      
      <button
        onClick={handleExport}
        disabled={disabled || isExporting}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Export CSV
          </>
        )}
      </button>
    </div>
  )
}
