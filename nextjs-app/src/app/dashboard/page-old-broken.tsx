'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/Logo'
import AppointmentCard from '@/components/dashboard/AppointmentCard'
import LocationCard from '@/components/dashboard/LocationCard'
import KpiCard from '@/components/dashboard/KpiCard'
import MapSection from '@/components/dashboard/MapSection'
import { fetchUpcomingAppointments } from '@/services/api/appointments'
import { fetchBusinessesByOwner } from '@/services/api/businesses'
import { fetchLocationsByBusiness } from '@/services/api/locations'
import { fetchAggregatedKpis } from '@/services/api/kpis'
import type { DashboardData } from '@/types/dashboard'

export default function DashboardV2Page() {
  const { user, logout, status } = useAuth()
  const router = useRouter()
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    business: null,
    locations: [],
    upcomingAppointments: [],
    kpis: null,
    loading: true,
    error: null,
  })

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
  
  // Load dashboard data
  const loadDashboardData = async () => {
    if (!user) return
    
    setDashboardData(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // For demo, use test user ID
      const userId = 'test-user-camila'
      
      // Fetch businesses
      const businesses = await fetchBusinessesByOwner(userId)
      const business = businesses.length > 0 ? businesses[0] : null
      
      if (!business) {
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
      
      // Fetch locations for the business
      const locations = await fetchLocationsByBusiness(business.businessId)
      
      // Fetch upcoming appointments
      const appointments = await fetchUpcomingAppointments(userId, 2)
      
      // Fetch aggregated KPIs
      const locationIds = locations.map(loc => loc.locationId)
      const kpis = locationIds.length > 0 
        ? await fetchAggregatedKpis(locationIds)
        : null
      
      setDashboardData({
        business,
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
    }
  }

  // Mostrar loading mientras se verifica
  if (status === 'loading' || !user) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec]"></div>
      </div>
    )
  }

  // Loading state
  if (dashboardData.loading) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#13a4ec] mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Header Sticky */}
      <header className="sticky top-0 z-10 bg-[#f6f7f8]/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-10">
          <div className="flex items-center justify-between py-4">
            {/* Logo + Business Name */}
            <div className="flex items-center gap-4">
              <Logo size="md" />
              <h1 className="text-lg font-bold text-gray-900 hidden sm:block">
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
                        onViewDetails={(id) => console.log('View details:', id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/50 backdrop-blur-sm rounded-xl p-8 text-center">
                    <div className="text-4xl mb-2">📅</div>
                    <p className="text-gray-600">No tienes citas próximas</p>
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
                  <h3 className="text-xl font-bold text-gray-900">Mis Sedes</h3>
                  
                  {/* Map */}
                  <MapSection locations={dashboardData.locations} />
                  
                  {/* Locations Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {dashboardData.locations.map(location => (
                      <LocationCard
                        key={location.locationId}
                        location={location}
                        onClick={(id) => console.log('View location:', id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#13a4ec] px-6 text-sm font-bold text-white transition-opacity hover:bg-[#0f8fcd]">
                  <span>Agendar Nueva Cita</span>
                </button>
                <button className="flex h-12 flex-1 items-center justify-center rounded-lg bg-[#13a4ec]/10 px-6 text-sm font-bold text-[#13a4ec] transition-colors hover:bg-[#13a4ec]/20">
                  <span>Ver Todas las Citas</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
