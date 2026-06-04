'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle, Calendar } from 'lucide-react'

export default function ReviewSuccessPage() {
  const searchParams = useSearchParams()
  const count = searchParams.get('count') || '0'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Posts Scheduled!
        </h1>
        
        <p className="text-gray-600 mb-6">
          {count} post{count !== '1' ? 's' : ''} ha{count === '1' ? 's' : 've'} been scheduled for automatic posting.
        </p>
        
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-blue-800 font-semibold">What Happens Next?</span>
          </div>
          <ul className="text-sm text-blue-700 text-left space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>Your posts will be automatically published according to the optimal schedule</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>You can view and manage all scheduled posts in your dashboard</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 font-bold">•</span>
              <span>We'll notify you when each post goes live</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-3">
          <a
            href="/dashboard"
            className="block w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </a>
          <p className="text-xs text-gray-500">
            You can upload more content anytime using your permanent link
          </p>
        </div>
      </div>
    </div>
  )
}
