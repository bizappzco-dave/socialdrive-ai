import { google } from 'googleapis'
import { Readable } from 'stream'

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: number
  createdTime?: string
  modifiedTime?: string
  webViewLink?: string
  webContentLink?: string
}

export interface GoogleDriveCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
}

let oauth2Client: any = null

function getOAuth2Client(credentials: GoogleDriveCredentials) {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      credentials.clientId,
      credentials.clientSecret,
      'postmessage'
    )
    oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    })
  }
  return oauth2Client
}

export function getDriveClient(credentials: GoogleDriveCredentials) {
  const auth = getOAuth2Client(credentials)
  return google.drive({ version: 'v3', auth })
}

export async function listFolderFiles(
  credentials: GoogleDriveCredentials,
  folderId: string,
  pageToken?: string
): Promise<{ files: GoogleDriveFile[]; nextPageToken?: string }> {
  const drive = getDriveClient(credentials)

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink), nextPageToken',
    spaces: 'drive',
    pageToken,
  })

  return {
    files: response.data.files as GoogleDriveFile[],
    nextPageToken: response.data.nextPageToken || undefined,
  }
}

export async function getFileContent(
  credentials: GoogleDriveCredentials,
  fileId: string
): Promise<Buffer> {
  const drive = getDriveClient(credentials)

  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  )

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    const stream = response.data as Readable

    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    stream.on('end', () => resolve(Buffer.concat(chunks)))
    stream.on('error', reject)
  })
}

export async function moveFile(
  credentials: GoogleDriveCredentials,
  fileId: string,
  fromFolderId: string,
  toFolderId: string
): Promise<void> {
  const drive = getDriveClient(credentials)

  await drive.files.update({
    fileId,
    addParents: toFolderId,
    removeParents: fromFolderId,
    fields: 'id, parents',
  })
}

export async function createFolder(
  credentials: GoogleDriveCredentials,
  name: string,
  parentFolderId?: string
): Promise<string> {
  const drive = getDriveClient(credentials)

  const fileMetadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  }

  if (parentFolderId) {
    fileMetadata.parents = [parentFolderId]
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    fields: 'id',
  })

  return response.data.id || ''
}

export async function getFileMetadata(
  credentials: GoogleDriveCredentials,
  fileId: string
): Promise<GoogleDriveFile> {
  const drive = getDriveClient(credentials)

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink',
  })

  return response.data as GoogleDriveFile
}

export function isImageFile(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)
}

export function isVideoFile(mimeType: string): boolean {
  return ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'].includes(mimeType)
}

export function isAudioFile(mimeType: string): boolean {
  return ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm'].includes(mimeType)
}

export function isTextFile(mimeType: string): boolean {
  return ['text/plain', 'text/markdown'].includes(mimeType)
}
