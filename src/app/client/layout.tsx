import { redirect } from 'next/navigation'
import { getCurrentUserClientAccess } from '@/lib/client-access'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const accessResult = await getCurrentUserClientAccess()

  if (!accessResult) {
    redirect('/auth/signin?returnTo=/client')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {accessResult.access.clientName || 'Client Dashboard'}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Role: {accessResult.access.role}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

