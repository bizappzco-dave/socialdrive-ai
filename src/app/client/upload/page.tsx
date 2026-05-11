'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function UploadPage() {
  const [uploading, setUploading] = useState(false)
  const [uploadCount, setUploadCount] = useState(0)
  const [message, setMessage] = useState('')
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setUploading(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('❌ Please sign in first')
        return
      }
      
      // Get client profile
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!client) {
        setMessage('❌ Client profile not found')
        return
      }
      
      // Upload each file
      let successCount = 0
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('client-uploads')
          .upload(`${client.id}/${fileName}`, file)
        
        if (uploadError) {
          console.error('Upload error:', uploadError)
          continue
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('client-uploads')
          .getPublicUrl(`${client.id}/${fileName}`)
        
        // Create post record
        const { error: postError } = await supabase
          .from('posts')
          .insert({
            client_id: client.id,
            image_url: publicUrl,
            image_filename: file.name,
            caption_style: 'auto',
            status: 'pending',
          })
        
        if (postError) {
          console.error('Post creation error:', postError)
          continue
        }
        
        successCount++
      }
      
      setUploadCount(successCount)
      setMessage(`✅ Successfully uploaded ${successCount} photo${successCount !== 1 ? 's' : ''}! Your AI captions will be ready in 2-5 minutes.`)
      
    } catch (error: any) {
      console.error('Upload error:', error)
      setMessage(`❌ Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Photos 📸
        </h2>
        <p className="text-gray-600 mb-6">
          Upload images and our AI will generate engaging captions for your social media.
        </p>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer"
          >
            <div className="text-6xl mb-4">📷</div>
            <p className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-sm text-gray-500">
              PNG, JPG, GIF up to 10MB each
            </p>
          </label>
        </div>
        
        {/* Status Message */}
        {message && (
          <div className={`mt-6 p-4 rounded-lg ${message.startsWith('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}
        
        {/* Upload Count */}
        {uploadCount > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800 font-medium">
              🎉 {uploadCount} photo{uploadCount !== 1 ? 's' : ''} uploaded!
            </p>
            <p className="text-blue-600 text-sm mt-1">
              Check back in a few minutes to review your AI-generated captions.
            </p>
          </div>
        )}
        
        {/* Tips */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">💡 Tips for Best Results</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Upload 3-5 photos at a time for batch processing</li>
            <li>• Use good lighting and clear images</li>
            <li>• Add context in the filename if helpful (e.g., "new-summer-menu.jpg")</li>
            <li>• Before/after photos work great for service businesses</li>
          </ul>
        </div>
        
        {/* WhatsApp Alternative */}
        <div className="mt-6 p-6 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">📱 Prefer WhatsApp?</h3>
          <p className="text-green-800 text-sm">
            Send photos directly via WhatsApp and get captions back automatically. 
            Contact your account manager for the WhatsApp number.
          </p>
        </div>
      </div>
    </div>
  )
}
