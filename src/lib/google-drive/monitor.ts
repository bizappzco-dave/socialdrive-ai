import { listFolderFiles, isImageFile, isVideoFile, isAudioFile, isTextFile } from './client'
import type { GoogleDriveCredentials, GoogleDriveFile } from './client'

export interface MonitoredFile extends GoogleDriveFile {
  category: 'image' | 'video' | 'audio' | 'text' | 'unknown'
  isNew: boolean
}

export interface MonitoringResult {
  newFiles: MonitoredFile[]
  existingFiles: MonitoredFile[]
  lastChecked: string
}

// Simple file tracking (in production, use database)
const fileTracker = new Map<string, { lastModified: string; processed: boolean }>()

export async function monitorFolder(
  credentials: GoogleDriveCredentials,
  folderId: string
): Promise<MonitoringResult> {
  const result: MonitoringResult = {
    newFiles: [],
    existingFiles: [],
    lastChecked: new Date().toISOString(),
  }

  // Get all files in folder
  const { files } = await listFolderFiles(credentials, folderId)

  for (const file of files) {
    const category = categorizeFile(file.mimeType)
    const existingKey = `folder:${folderId}:file:${file.id}`
    const existing = fileTracker.get(existingKey)
    const isNew = !existing || file.modifiedTime !== existing.lastModified

    const monitoredFile: MonitoredFile = {
      ...file,
      category,
      isNew,
    }

    if (isNew) {
      result.newFiles.push(monitoredFile)
      fileTracker.set(existingKey, {
        lastModified: file.modifiedTime || '',
        processed: false,
      })
    } else {
      result.existingFiles.push(monitoredFile)
    }
  }

  return result
}

function categorizeFile(mimeType: string): 'image' | 'video' | 'audio' | 'text' | 'unknown' {
  if (isImageFile(mimeType)) return 'image'
  if (isVideoFile(mimeType)) return 'video'
  if (isAudioFile(mimeType)) return 'audio'
  if (isTextFile(mimeType)) return 'text'
  return 'unknown'
}

export function markFileAsProcessed(folderId: string, fileId: string): void {
  const key = `folder:${folderId}:file:${fileId}`
  const existing = fileTracker.get(key)
  if (existing) {
    existing.processed = true
    fileTracker.set(key, existing)
  }
}

export function getUnprocessedFiles(folderId: string): MonitoredFile[] {
  const unprocessed: MonitoredFile[] = []
  
  for (const [key, value] of fileTracker.entries()) {
    if (key.startsWith(`folder:${folderId}:`) && !value.processed) {
      // In production, fetch full file details from database
      unprocessed.push({
        id: key.split(':').pop() || '',
        name: 'Unknown',
        mimeType: 'unknown',
        category: 'unknown',
        isNew: true,
      })
    }
  }

  return unprocessed
}

export function resetTracker(): void {
  fileTracker.clear()
}
