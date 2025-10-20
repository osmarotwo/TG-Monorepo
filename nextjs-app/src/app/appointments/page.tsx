'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import MapSection from '@/components/dashboard/MapSection'
import { fetchBusinessesByOwner } from '@/services/api/businesses'
import { fetchLocationsByBusiness, type Location as LocationType } from '@/services/api/locations'
import { ToastContainer, useToast } from '@/components/Toast'

type Industry = 'all' | 'beauty' | 'fitness' | 'health' | 'food'

interface Business {
  businessId: string
  name: string
  industry: string
  description?: string
  logo?: string
}

export default function AppointmentsPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('all')
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [locations, setLocations] = useState<LocationType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.replace('/')
      return
    }
    
    if (user && !user.profileCompleted) {
      router.replace('/onboarding')
      return
    }
    
    if (user) {
      loadBusinesses()
    }
  }, [status, user, router])

  const loadBusinesses = async () => {
    try {
      setLoading(true)
      // En producción, esto debería obtener TODOS los negocios disponibles, no solo del owner
      // Por ahora, usamos el test user para obtener los negocios de prueba
      const businesses = await fetchBusinessesByOwner('test-user-camila')
      setAllBusinesses(businesses)
    } catch (error) {
      console.error('Error loading businesses:', error)
      toast.error('Error al cargar los comercios')
    } finally {
      setLoading(false)
    }
  }

  const loadLocations = async (businessId: string) => {
    try {
      const locs = await fetchLocationsByBusiness(businessId)
      setLocations(locs)
    } catch (error) {
      console.error('Error loading locations:', error)
      toast.error('Error al cargar las sedes')
    }
  }

  const handleBusinessClick = async (business: Business) => {
    setSelectedBusiness(business)
    await loadLocations(business.businessId)
  }

  const handleBackToBusinesses = () => {
    setSelectedBusiness(null)
    setLocations([])
  }

  const filteredBusinesses = allBusinesses.filter(business => {
    if (selectedIndustry === 'all') return true
    return business.industry.toLowerCase() === selectedIndustry
  })

  const industryFilters: { value: Industry; label: string; emoji: string }[] = [
    { value: 'all', label: 'All', emoji: '🏢' },
    { value: 'beauty', label: 'Beauty', emoji: '💇' },
    { value: 'fitness', label: 'Fitness', emoji: '💪' },
    { value: 'health', label: 'Health', emoji: '🏥' },
    { value: 'food', label: 'Food & Drinks', emoji: '☕' },
  ]

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
          
          {/* Vista 1: Explorar Comercios */}
          {!selectedBusiness && (
            <>
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
                <p className="text-gray-600 mt-2">
                  Choose a business and location to get started
                </p>
              </div>

              {/* Industry Filters */}
              <div className="mb-8">
                <div className="flex flex-wrap gap-3">
                  {industryFilters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setSelectedIndustry(filter.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedIndustry === filter.value
                          ? 'bg-[#13a4ec] text-white shadow-md'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>{filter.emoji}</span>
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Businesses Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                      <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : filteredBusinesses.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No businesses found</h3>
                  <p className="text-gray-600">
                    Try selecting a different category
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBusinesses.map((business) => (
                    <button
                      key={business.businessId}
                      onClick={() => handleBusinessClick(business)}
                      className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
                    >
                      {/* Business Logo/Icon */}
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-3xl mb-4">
                        {business.industry === 'beauty' && '💇'}
                        {business.industry === 'fitness' && '💪'}
                        {business.industry === 'health' && '🏥'}
                        {business.industry === 'food' && '☕'}
                      </div>

                      {/* Business Info */}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {business.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {business.description || 'Professional services'}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-[#13a4ec] font-medium">
                        <span>View Locations</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Vista 2: Ver Sedes del Comercio Seleccionado */}
          {selectedBusiness && (
            <>
              {/* Back Button */}
              <button
                onClick={handleBackToBusinesses}
                className="flex items-center gap-2 text-gray-600 hover:text-[#13a4ec] mb-6 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to all businesses
              </button>

              {/* Business Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{selectedBusiness.name}</h1>
                <p className="text-gray-600 mt-2">
                  Select a location to book your appointment
                </p>
              </div>

              {/* Map with Locations */}
              {locations.length > 0 && (
                <div className="mb-8">
                  <MapSection locations={locations} />
                </div>
              )}

              {/* Locations List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map((location) => (
                  <button
                    key={location.locationId}
                    onClick={() => {
                      console.log('Selected location:', location)
                      // TODO: Navegar a página de selección de servicio/horario
                      toast.info('Booking flow coming soon!')
                    }}
                    className="bg-white rounded-xl p-6 text-left hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[#13a4ec] flex items-center justify-center text-white flex-shrink-0">
                        📍
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">{location.name}</h3>
                        <p className="text-sm text-gray-600">{location.address}</p>
                      </div>
                    </div>
                    {location.phone && (
                      <p className="text-sm text-gray-500 mb-3">📞 {location.phone}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[#13a4ec] font-medium">
                      <span>Book Here</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </main>
        <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      </div>
    </>
  )
}
