import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/signin?returnTo=/client')
  }
  
  // Check if user has a client profile
  const { data: clientProfile } = await supabase
    .from('clients')
    .select('id, name, metadata')
    .eq('user_id', user.id)
    .single()
  
  if (!clientProfile) {
    // User doesn't have a client profile - redirect to onboarding
    redirect('/client/onboarding')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {clientProfile.name}
            </h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {user.email}
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
