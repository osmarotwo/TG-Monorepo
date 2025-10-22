'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import AppointmentMapSection from '@/components/dashboard/AppointmentMapSection'
import RouteOptimizationCard from '@/components/dashboard/RouteOptimizationCard'
import { fetchUpcomingAppointments, type Appointment as AppointmentType } from '@/services/api/appointments'
import { fetchLocationById, type Location } from '@/services/api/locations'
import { fetchBusinessById, type Business } from '@/services/api/businesses'
import { useToast, ToastContainer } from '@/components/Toast'
import { useRouteOptimizationWithRescheduling } from '@/hooks/useRouteOptimizationWithRescheduling'

interface AppointmentWithDetails extends AppointmentType {
  location?: Location
  business?: Business
}

export default function DashboardPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const toast = useToast()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [appointmentLocations, setAppointmentLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [optimizationAttempted, setOptimizationAttempted] = useState(false) // Prevenir loop infinito

  // Hook de optimización de rutas con reprogramación
  const {
    optimizationResult,
    isOptimizing,
    error: optimizationError,
    rescheduledAppointments,
    hasSignificantImprovement,
    optimize,
    applyOptimization,
    reset: dismissOptimization,
  } = useRouteOptimizationWithRescheduling(appointments, userLocation || { lat: 5.0214, lng: -73.9919 })

  console.log('📊 Dashboard optimization state:', {
    hasOptimization: hasSignificantImprovement,
    isOptimizing,
    optimizationResult: !!optimizationResult,
    appointmentsCount: appointments.length,
    locationsCount: appointmentLocations.length,
    hasUserLocation: !!userLocation,
    rescheduledCount: rescheduledAppointments.length
  })

  // Trigger optimization when appointments are loaded (solo una vez)
  useEffect(() => {
    if (appointments.length >= 2 && !isOptimizing && !optimizationResult && !optimizationAttempted) {
      console.log('🔄 Auto-triggering optimization...');
      setOptimizationAttempted(true); // Marcar como intentado
      optimize();
    }
  }, [appointments, isOptimizing, optimizationResult, optimizationAttempted, optimize]);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('📍 Ubicación detectada:', {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          // Silenciar error si es "unavailable" (común en localhost)
          if (error.code !== 2) {
            console.warn('⚠️ Geolocalización no disponible:', error.message)
          }
          // Fallback a Zipaquirá (centro de las citas de prueba)
          console.log('📍 Usando ubicación por defecto: Zipaquirá')
          setUserLocation({ lat: 5.0214, lng: -74.0637 })
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000, // Cache por 5 minutos
        }
      )
    } else {
      // Fallback a Zipaquirá
      console.log('📍 Geolocalización no soportada, usando Zipaquirá')
      setUserLocation({ lat: 5.0214, lng: -74.0637 })
    }
  }, [])

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
      loadAppointments()
    }
  }, [status, user, router])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      
      if (!user?.userId) {
        console.error('No user ID available')
        return
      }
      
      const data = await fetchUpcomingAppointments(user.userId, 10)
      
      // Enriquecer citas con información de location y business
      const enrichedAppointments = await Promise.all(
        data.map(async (apt) => {
          try {
            const location = await fetchLocationById(apt.locationId)
            const business = location ? await fetchBusinessById(apt.businessId) : null
            return {
              ...apt,
              location: location || undefined,
              business: business || undefined,
            }
          } catch (error) {
            console.error(`Error loading details for appointment ${apt.appointmentId}:`, error)
            return apt
          }
        })
      )
      
      setAppointments(enrichedAppointments)
      
      // Guardar ubicaciones para el mapa
      const locations = enrichedAppointments
        .map((apt: AppointmentWithDetails) => apt.location)
        .filter((loc): loc is Location => loc !== undefined)
      setAppointmentLocations(locations)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoading(false)
    }
  }

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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-gray-600 mt-2">
              Here's a snapshot of your upcoming appointments and nearby options.
            </p>
          </div>

          {/* Error de optimización */}
          {optimizationError && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    Optimización no disponible temporalmente
                  </h3>
                  <p className="text-sm text-yellow-800">
                    No pudimos verificar disponibilidad de horarios. Intenta más tarde.
                  </p>
                  {optimizationError && (
                    <p className="text-xs text-yellow-700 mt-2">
                      Error: {optimizationError.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => {
                    setOptimizationAttempted(false);
                    optimize();
                  }}
                  className="ml-4 text-sm text-yellow-900 hover:text-yellow-700 font-medium"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Route Optimization Card - Solo mostrar si hay mejora */}
          {hasSignificantImprovement && optimizationResult && !optimizationError && (
            <div className="mb-8">
              <RouteOptimizationCard
                optimizationResult={optimizationResult}
                rescheduledAppointments={rescheduledAppointments}
                isOptimizing={isOptimizing}
                userLocation={userLocation || undefined}
                onApply={async () => {
                  try {
                    const reorderedAppointments = await applyOptimization()
                    if (reorderedAppointments.length > 0) {
                      // Actualizar el estado con las citas reordenadas
                      const enrichedReordered = reorderedAppointments.map((apt: AppointmentType) => {
                        const original = appointments.find(a => a.appointmentId === apt.appointmentId)
                        return {
                          ...(original || apt),
                          startTime: apt.startTime,
                          endTime: apt.endTime,
                          date: apt.date,
                          time: apt.time,
                        }
                      })
                      setAppointments(enrichedReordered as AppointmentWithDetails[])
                      dismissOptimization() // Ocultar tarjeta de optimización
                      toast.success('✅ Optimización aplicada! Citas actualizadas en la base de datos.')
                    }
                  } catch (error) {
                    console.error('❌ Error aplicando optimización:', error)
                    toast.error('❌ Error al aplicar optimización. Por favor intenta de nuevo.')
                  }
                }}
                onDismiss={dismissOptimization}
                onViewDetails={() => {
                  console.log('View details:', optimizationResult)
                  // TODO: Abrir modal con detalles completos
                }}
              />
            </div>
          )}

          {/* Upcoming Appointments */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Upcoming Appointments</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map((i) => (
                  <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center">
                <div className="text-6xl mb-4">📅</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No upcoming appointments</h3>
                <p className="text-gray-600 mb-6">
                  Book your first appointment to get started!
                </p>
                <button
                  onClick={() => router.push('/appointments')}
                  className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  Book New Appointment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.slice(0, 4).map((appointment: AppointmentWithDetails) => {
                  const industryEmojis = {
                    beauty: '💅',
                    restaurant: '🍽️',
                    retail: '🛍️',
                    logistics: '📦',
                    banking: '🏦',
                  }
                  
                  const industryLabels = {
                    beauty: 'Beauty',
                    restaurant: 'Restaurant',
                    retail: 'Retail',
                    logistics: 'Logistics',
                    banking: 'Banking',
                  }
                  
                  return (
                    <div
                      key={appointment.appointmentId}
                      className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        {/* Business Logo */}
                        {appointment.business?.logoUrl ? (
                          <img
                            src={appointment.business.logoUrl}
                            alt={appointment.business.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-2xl flex-shrink-0">
                            {appointment.business?.industry ? industryEmojis[appointment.business.industry] : '🏢'}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          {/* Category Badge */}
                          {appointment.business?.industry && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#13a4ec] text-xs font-medium rounded-full mb-2">
                              {industryEmojis[appointment.business.industry]}
                              <span>{industryLabels[appointment.business.industry]}</span>
                            </div>
                          )}
                          
                          <div className="text-sm text-[#13a4ec] font-medium mb-1">
                            Next Appointment
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-1">
                            {appointment.serviceType}
                          </h3>
                          
                          {/* Business Name */}
                          {appointment.business?.name && (
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              {appointment.business.name}
                            </p>
                          )}
                          
                          {/* Location */}
                          <p className="text-sm text-gray-600 mb-1">
                            📍 {appointment.location?.name || appointment.locationName || 'Location'}
                          </p>
                          
                          {/* Date & Time */}
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(appointment.startTime).toLocaleDateString()} • {new Date(appointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          
                          {/* Duración estimada */}
                          {appointment.estimatedDuration && (
                            <p className="text-sm text-gray-600 mb-3">
                              ⏱️ Duración: {appointment.estimatedDuration} min
                            </p>
                          )}
                          
                          <button className="text-sm text-[#13a4ec] font-medium hover:text-[#0f8fcd]">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Map Section - Ubicaciones de próximas citas */}
          {!loading && appointmentLocations.length > 0 && appointments.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 Appointment Locations & Routes</h2>
              <p className="text-gray-600 mb-6">
                View your upcoming appointments on the map with travel times and routes
              </p>
              <AppointmentMapSection 
                appointments={appointments} 
                locations={appointmentLocations}
                height="h-[500px]"
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button
              onClick={() => router.push('/appointments')}
              className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white p-8 rounded-xl text-left transition-colors"
            >
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-xl font-bold mb-2">Book New Appointment</h3>
              <p className="text-blue-100">Find and book services near you</p>
            </button>

            <button
              onClick={() => router.push('/locations')}
              className="bg-white hover:shadow-md p-8 rounded-xl text-left transition-shadow border-2 border-gray-200"
            >
              <div className="text-4xl mb-3">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Services</h3>
              <p className="text-gray-600">Discover locations near you</p>
            </button>
          </div>
        </main>
        <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      </div>
    </>
  )
}
