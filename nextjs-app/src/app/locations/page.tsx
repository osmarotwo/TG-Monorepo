'use client'

import { useAuth } from '@/contexts/AuthContext'
import Navigation from '@/components/Navigation'

export default function LocationsPage() {
  const { user, status } = useAuth()

  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-[#f6f7f8]">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📍</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Nearby Locations</h1>
            <p className="text-gray-600">Coming soon...</p>
          </div>
        </main>
      </div>
    </>
  )
}
