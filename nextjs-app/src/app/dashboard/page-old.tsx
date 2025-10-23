'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import AppointmentCard from '@/components/dashboard/AppointmentCard'
import LocationCard from '@/components/dashboard/LocationCard'
import KpiCard from '@/components/dashboard/KpiCard'
import MapSection from '@/components/dashboard/MapSection'
import IndustryFilter, { type Industry } from '@/components/dashboard/IndustryFilter'
import { AppointmentCardSkeleton, LocationCardSkeleton, KpiCardSkeleton, MapSkeleton } from '@/components/dashboard/Skeletons'
import { ToastContainer, useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import NewAppointmentForm, { type AppointmentFormData } from '@/components/dashboard/NewAppointmentForm'
import { fetchUpcomingAppointments } from '@/services/api/appointments'
import { fetchBusinessesByOwner } from '@/services/api/businesses'
import { fetchLocationsByBusiness } from '@/services/api/locations'
import { fetchAggregatedKpis } from '@/services/api/kpis'
import type { DashboardData } from '@/types/dashboard'

export default function DashboardV2Page() {
  const { user, logout, status } = useAuth()
  const router = useRouter()
  const toast = useToast()
  
  // Business selection state
  const [allBusinesses, setAllBusinesses] = useState<Array<{
    businessId: string;
    name: string;
    locations?: unknown[];
  }>>([])
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    business: null,
    locations: [],
    upcomingAppointments: [],
    kpis: null,
    loading: true,
    error: null,
  })

  // Industry filter state
  const [selectedIndustry, setSelectedIndustry] = useState<Industry>('all')

  // Modal states
  const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false)

  // Redirigir si no está autenticado o si el perfil no está completo
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
    
    // Fetch dashboard data
    if (user) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user, router])

  // Reload dashboard when selected business changes
  useEffect(() => {
    if (user && selectedBusinessId) {
      loadDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusinessId, user])

  // Handle business change
  const handleBusinessChange = (businessId: string) => {
    setSelectedBusinessId(businessId)
    localStorage.setItem('selectedBusinessId', businessId)
  }
  
  // Load dashboard data
  const loadDashboardData = async () => {
    if (!user) return
    
    setDashboardData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // For demo, use test user ID
      const userId = 'test-user-camila'
      
      // Fetch ALL businesses
      const businesses = await fetchBusinessesByOwner(userId)
      setAllBusinesses(businesses)
      
      if (businesses.length === 0) {
        // No business yet - show empty state
        setDashboardData({
          business: null,
          locations: [],
          upcomingAppointments: [],
          kpis: null,
          loading: false,
          error: null,
        })
        return
      }
      
      // Select business: use selected ID, or saved in localStorage, or first one
      let businessToShow = businesses[0]
      
      if (selectedBusinessId) {
        const found = businesses.find(b => b.businessId === selectedBusinessId)
        if (found) businessToShow = found
      } else {
        // Try to get from localStorage
        const savedBusinessId = localStorage.getItem('selectedBusinessId')
        if (savedBusinessId) {
          const found = businesses.find(b => b.businessId === savedBusinessId)
          if (found) {
            businessToShow = found
            setSelectedBusinessId(savedBusinessId)
          } else {
            setSelectedBusinessId(businesses[0].businessId)
          }
        } else {
          setSelectedBusinessId(businesses[0].businessId)
        }
      }
      
      // Fetch locations for the selected business
      const locations = await fetchLocationsByBusiness(businessToShow.businessId)
      
      // Fetch upcoming appointments
      const appointments = await fetchUpcomingAppointments(userId, 2)
      
      // Fetch aggregated KPIs
      const locationIds = locations.map(loc => loc.locationId)
      const kpis = locationIds.length > 0 
        ? await fetchAggregatedKpis(locationIds)
        : null
      
      setDashboardData({
        business: businessToShow,
        locations,
        upcomingAppointments: appointments,
        kpis,
        loading: false,
        error: null,
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Error al cargar los datos del dashboard',
      }))
      toast.error('Error al cargar los datos del dashboard. Por favor, intenta de nuevo.')
    }
  }

  // Filter locations by industry
  const filteredLocations = useMemo(() => {
    if (selectedIndustry === 'all') {
      return dashboardData.locations
    }
    return dashboardData.locations.filter(
      loc => loc.industry === selectedIndustry
    )
  }, [dashboardData.locations, selectedIndustry])

  // Handle new appointment submission
  const handleNewAppointment = async (data: AppointmentFormData) => {
    try {
      // TODO: Implement API call to create appointment
      console.log('Creating appointment:', data)
      toast.success('¡Cita agendada exitosamente!')
      setIsNewAppointmentModalOpen(false)
      
      // Reload dashboard data
      await loadDashboardData()
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.error('Error al agendar la cita. Intenta de nuevo.')
    }
  }

  // Handle view appointment details
  const handleViewAppointmentDetails = (_appointmentId: string) => {
    toast.info('Detalles de cita próximamente disponibles')
    // TODO: Open appointment details modal
  }

  // Handle view all appointments
  const handleViewAllAppointments = () => {
    router.push('/appointments')
    // TODO: Navigate to appointments page
  }

  // Mostrar loading mientras se verifica
  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    )
  }

  // Loading state with skeletons
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8]">
        <header className="sticky top-0 z-10 bg-[#f6f7f8]/80 backdrop-blur-sm border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <Logo size="md" />
                <div className="h-6 w-32 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
          <div className="space-y-8">
            {/* Welcome skeleton */}
            <div className="space-y-2">
              <div className="h-10 w-3/4 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-6 w-full bg-gray-300 rounded animate-pulse"></div>
            </div>
            
            {/* Appointments skeletons */}
            <div className="space-y-4">
              <div className="h-8 w-48 bg-gray-300 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AppointmentCardSkeleton />
                <AppointmentCardSkeleton />
              </div>
            </div>
            
            {/* KPIs skeletons */}
            <div className="space-y-4">
              <div className="h-8 w-40 bg-gray-300 rounded animate-pulse"></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KpiCardSkeleton />
                <KpiCardSkeleton />
                <KpiCardSkeleton />
              </div>
            </div>
            
            {/* Locations skeletons */}
            <div className="space-y-4">
              <div className="h-8 w-32 bg-gray-300 rounded animate-pulse"></div>
              <MapSkeleton />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <LocationCardSkeleton />
                <LocationCardSkeleton />
                <LocationCardSkeleton />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 bg-[#f6f7f8]/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center justify-between py-4">
            {/* Logo + Business Selector */}
            <div className="flex items-center gap-4">
              <Logo size="md" />
              
              {/* Business Selector */}
              {allBusinesses.length > 1 && (
                <div className="relative">
                  <select
                    value={selectedBusinessId || ''}
                    onChange={(e) => handleBusinessChange(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-900 hover:border-[#13a4ec] focus:border-[#13a4ec] focus:ring-2 focus:ring-[#13a4ec]/20 focus:outline-none transition-colors cursor-pointer"
                  >
                    {allBusinesses.map((biz) => (
                      <option key={biz.businessId} value={biz.businessId}>
                        {biz.name} ({biz.locations?.length || 0} {biz.locations?.length === 1 ? 'sede' : 'sedes'})
                      </option>
                    ))}
                  </select>
                  {/* Dropdown icon */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Business Name (mobile hidden if selector present) */}
              <h1 className={`text-lg font-bold text-gray-900 ${allBusinesses.length > 1 ? 'hidden md:block' : 'hidden sm:block'}`}>
                {dashboardData.business?.name || 'Clyok'}
              </h1>
            </div>
            
            {/* Nav + Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-100 hover:text-[#13a4ec] transition-colors">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              
              {/* User Avatar */}
              <div className="h-10 w-10 rounded-full bg-[#13a4ec] flex items-center justify-center text-white font-bold cursor-pointer hover:bg-[#0f8fcd] transition-colors"
                   onClick={() => router.push('/profile')}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
              
              {/* Logout */}
              <button
                onClick={logout}
                className="text-sm font-medium text-gray-600 hover:text-[#13a4ec] transition-colors hidden sm:block"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-10">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-bold text-gray-900">
              ¡Bienvenido/a de vuelta, {user?.firstName}!
            </h2>
            <p className="text-base text-gray-600">
              Aquí tienes un resumen de tus próximas citas y ubicaciones.
            </p>
          </div>

          {/* Industry Filter */}
          {dashboardData.business && dashboardData.locations.length > 0 && (
            <IndustryFilter
              selected={selectedIndustry}
              onChange={setSelectedIndustry}
            />
          )}
          
          {/* Error State */}
          {dashboardData.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800">{dashboardData.error}</p>
              <button 
                onClick={loadDashboardData}
                className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Reintentar
              </button>
            </div>
          )}
          
          {/* Empty State - No Business */}
          {!dashboardData.business && !dashboardData.error && (
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Aún no tienes un negocio registrado
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primer negocio para empezar a gestionar citas y sedes.
              </p>
              <button className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white font-medium px-6 py-2 rounded-lg transition-colors">
                Crear Negocio
              </button>
            </div>
          )}
          
          {/* Dashboard Content - Has Business */}
          {dashboardData.business && (
            <>
              {/* Upcoming Appointments */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-gray-900">Próximas Citas</h3>
                
                {dashboardData.upcomingAppointments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {dashboardData.upcomingAppointments.map(appointment => (
                      <AppointmentCard
                        key={appointment.appointmentId}
                        appointment={appointment}
                        onViewDetails={handleViewAppointmentDetails}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-gray-600">No tienes citas próximas</p>
                    <button
                      onClick={() => setIsNewAppointmentModalOpen(true)}
                      className="mt-4 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white font-medium px-6 py-2 rounded-lg transition-colors"
                    >
                      Agendar Primera Cita
                    </button>
                  </div>
                )}
              </div>
              
              {/* KPIs Section */}
              {dashboardData.kpis && (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-gray-900">Métricas Clave</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {dashboardData.kpis['no-show-rate'] && (
                      <KpiCard
                        label="Tasa de No-show"
                        value={dashboardData.kpis['no-show-rate'].value}
                        target={dashboardData.kpis['no-show-rate'].target}
                        format="percentage"
                      />
                    )}
                    {dashboardData.kpis['occupancy'] && (
                      <KpiCard
                        label="Ocupación"
                        value={dashboardData.kpis['occupancy'].value}
                        target={dashboardData.kpis['occupancy'].target}
                        format="percentage"
                      />
                    )}
                    {dashboardData.kpis['avg-ticket'] && (
                      <KpiCard
                        label="Ticket Promedio"
                        value={dashboardData.kpis['avg-ticket'].value}
                        target={dashboardData.kpis['avg-ticket'].target}
                        format="currency"
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* Locations Section */}
              {dashboardData.locations.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">Mis Sedes</h3>
                    {selectedIndustry !== 'all' && (
                      <span className="text-sm text-gray-600">
                        {filteredLocations.length} de {dashboardData.locations.length} sedes
                      </span>
                    )}
                  </div>
                  
                  {filteredLocations.length > 0 ? (
                    <>
                      {/* Map */}
                      <MapSection locations={filteredLocations} />
                      
                      {/* Locations Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredLocations.map(location => (
                          <LocationCard
                            key={location.locationId}
                            location={location}
                            onClick={(id) => console.log('View location:', id)}
                          />
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
                      <div className="text-4xl mb-2">🔍</div>
                      <p className="text-gray-600">No hay sedes de esta industria</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button 
                  onClick={() => setIsNewAppointmentModalOpen(true)}
                  className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#13a4ec] px-6 text-sm font-bold text-white transition-all hover:bg-[#0f8fcd] hover:scale-105"
                >
                  <span>➕ Agendar Nueva Cita</span>
                </button>
                <button 
                  onClick={handleViewAllAppointments}
                  className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#13a4ec]/10 px-6 text-sm font-bold text-[#13a4ec] transition-all hover:bg-[#13a4ec]/20 hover:scale-105"
                >
                  <span>📅 Ver Todas las Citas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* New Appointment Modal */}
      <Modal
        isOpen={isNewAppointmentModalOpen}
        onClose={() => setIsNewAppointmentModalOpen(false)}
        title="Agendar Nueva Cita"
        size="lg"
      >
        <NewAppointmentForm
          onSubmit={handleNewAppointment}
          onCancel={() => setIsNewAppointmentModalOpen(false)}
        />
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
    </div>
  )
}
