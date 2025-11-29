'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import AppointmentMapSection from '@/components/dashboard/AppointmentMapSection'
import RouteOptimizationCard from '@/components/dashboard/RouteOptimizationCard'
import CreatePersonalAppointmentModal from '@/components/CreatePersonalAppointmentModal'
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
  const { t } = useLocale()
  const router = useRouter()
  const toast = useToast()
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([])
  const [appointmentLocations, setAppointmentLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [showPastAppointments, setShowPastAppointments] = useState(false)
  const [showPersonalAppointmentModal, setShowPersonalAppointmentModal] = useState(false)
  const [editingPersonalAppointment, setEditingPersonalAppointment] = useState<AppointmentWithDetails | null>(null)
  const [showEditPersonalModal, setShowEditPersonalModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [optimizationAttempted, setOptimizationAttempted] = useState(false) // Prevenir loop infinito
  const [selectedDate, setSelectedDate] = useState<string>('all') // Estado compartido para filtro de fecha

  // Filtrar citas por fecha seleccionada
  const filteredAppointments = React.useMemo(() => {
    if (selectedDate === 'all') {
      return appointments;
    }
    return appointments.filter(apt => {
      const aptDate = apt.date || apt.startTime?.split('T')[0];
      return aptDate === selectedDate;
    });
  }, [appointments, selectedDate]);

  // Hook de optimización de rutas con reprogramación - USAR CITAS FILTRADAS
  const {
    optimizationResult,
    isOptimizing,
    error: optimizationError,
    rescheduledAppointments,
    hasSignificantImprovement,
    optimize,
    applyOptimization,
    reset: dismissOptimization,
  } = useRouteOptimizationWithRescheduling(filteredAppointments, userLocation || { lat: 5.0214, lng: -73.9919 })

  console.log('📊 Dashboard optimization state:', {
    hasOptimization: hasSignificantImprovement,
    isOptimizing,
    optimizationResult: !!optimizationResult,
    appointmentsCount: appointments.length,
    filteredCount: filteredAppointments.length,
    selectedDate,
    locationsCount: appointmentLocations.length,
    hasUserLocation: !!userLocation,
    rescheduledCount: rescheduledAppointments.length
  })

  // Trigger optimization when filtered appointments change or date changes
  useEffect(() => {
    // Limpiar resultado de optimización anterior cuando cambia la fecha
    console.log('📅 Fecha cambiada a:', selectedDate, '- Limpiando optimización anterior');
    dismissOptimization();
    setOptimizationAttempted(false);
  }, [selectedDate, dismissOptimization]);

  useEffect(() => {
    if (filteredAppointments.length >= 2 && !isOptimizing && !optimizationResult && !optimizationAttempted) {
      console.log('🔄 Auto-triggering optimization for date:', selectedDate);
      console.log('📊 Citas filtradas para optimizar:', filteredAppointments.length);
      setOptimizationAttempted(true);
      optimize();
    }
  }, [filteredAppointments, isOptimizing, optimizationResult, optimizationAttempted, optimize, selectedDate]);

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
    
    // Redirect business users to business dashboard
    if (user && (user.profileType === 'business' || user.role?.includes('business'))) {
      router.replace('/business/dashboard')
      return
    }
    
    if (user && !user.profileCompleted) {
      router.replace('/onboarding')
      return
    }
    
    if (user) {
      loadAppointments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user, router])

  // Recargar citas cuando cambie el toggle
  useEffect(() => {
    if (user) {
      loadAppointments()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPastAppointments])

  // Helper para determinar si una cita ya pasó
  const isAppointmentPast = (appointment: AppointmentWithDetails): boolean => {
    if (!appointment.date || !appointment.time) return false
    
    // Crear timestamp de la cita
    const appointmentDateTime = new Date(`${appointment.date}T${appointment.time}`);
    
    // Obtener timestamp actual
    const now = new Date();
    
    // Comparar timestamps
    const isPast = appointmentDateTime.getTime() < now.getTime();
    
    console.log('🕐 Verificando cita:', { 
      date: appointment.date, 
      time: appointment.time,
      appointmentDateTime: appointmentDateTime.toISOString(),
      now: now.toISOString(),
      isPast
    });
    
    return isPast;
  }

  const loadAppointments = async () => {
    try {
      setLoading(true)
      
      if (!user?.userId) {
        console.error('No user ID available')
        return
      }
      
      // Si showPastAppointments es true, traer todas las citas (upcoming=false)
      // Si showPastAppointments es false, solo próximas (upcoming=true)
      const data = await fetchUpcomingAppointments(user.userId, 20, !showPastAppointments)
      
      // Enriquecer citas con información de location y business
      const enrichedAppointments = await Promise.all(
        data.map(async (apt) => {
          try {
            // Las citas personales no tienen location/business asociado
            if (apt.type === 'personal') {
              return {
                ...apt,
                location: undefined,
                business: undefined,
              }
            }
            
            // Si la cita ya tiene coordenadas, crear objeto location desde los datos de la cita
            if ((apt.coordinates || (apt.latitude && apt.longitude)) && apt.address) {
              const lat = apt.coordinates?.lat || apt.latitude || 0;
              const lng = apt.coordinates?.lng || apt.longitude || 0;
              
              const locationFromAppointment: Location = {
                locationId: apt.locationId,
                businessId: apt.businessId,
                name: apt.locationName || 'Location',
                address: apt.address,
                city: '',
                latitude: lat,
                longitude: lng,
                resources: [],
                specialists: [],
                status: 'active' as const,
                createdAt: apt.createdAt || new Date().toISOString(),
                updatedAt: apt.updatedAt || new Date().toISOString()
              }
              
              return {
                ...apt,
                location: locationFromAppointment,
                business: {
                  businessId: apt.businessId,
                  name: apt.businessName || 'Business',
                  industry: 'beauty' as const,
                  ownerId: apt.userId,
                  totalLocations: 1,
                  createdAt: apt.createdAt || new Date().toISOString(),
                  updatedAt: apt.updatedAt || new Date().toISOString()
                }
              }
            }
            
            // Fallback: intentar cargar desde API (para citas antiguas sin coordenadas)
            try {
              const location = await fetchLocationById(apt.locationId)
              const business = location ? await fetchBusinessById(apt.businessId) : null
              return {
                ...apt,
                location: location || undefined,
                business: business || undefined,
              }
            } catch (apiError) {
              // Si falla la API, usar datos básicos de la cita
              return {
                ...apt,
                location: {
                  locationId: apt.locationId,
                  businessId: apt.businessId,
                  name: apt.locationName || 'Location',
                  address: apt.address || '',
                  city: '',
                  latitude: apt.coordinates?.lat || apt.latitude || 5.0214,
                  longitude: apt.coordinates?.lng || apt.longitude || -74.0637,
                  resources: [],
                  specialists: [],
                  status: 'active' as const,
                  createdAt: apt.createdAt || new Date().toISOString(),
                  updatedAt: apt.updatedAt || new Date().toISOString()
                },
                business: {
                  businessId: apt.businessId,
                  name: apt.businessName || 'Business',
                  industry: 'beauty' as const,
                  ownerId: apt.userId,
                  totalLocations: 1,
                  createdAt: apt.createdAt || new Date().toISOString(),
                  updatedAt: apt.updatedAt || new Date().toISOString()
                }
              }
            }
          } catch (error) {
            console.error(`Error loading details for appointment ${apt.appointmentId}:`, error)
            return apt
          }
        })
      )
      
      // Ordenar citas por fecha y hora (más próximas primero)
      const sortedAppointments = enrichedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
        return dateA.getTime() - dateB.getTime();
      });
      
      setAppointments(sortedAppointments)
      
      // Guardar ubicaciones para el mapa
      const locations = sortedAppointments
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

  const handleEditPersonalAppointment = (appointment: AppointmentWithDetails) => {
    setEditingPersonalAppointment(appointment)
    setShowEditPersonalModal(true)
  }

  const handleSaveEditPersonalAppointment = async (data: { date: string; time: string; title: string; description?: string; address?: string }) => {
    if (!editingPersonalAppointment) return

    try {
      // Calcular startTime y endTime
      const startTime = new Date(`${data.date}T${data.time}`)
      const duration = editingPersonalAppointment.duration || editingPersonalAppointment.estimatedDuration || 60
      const endTime = new Date(startTime.getTime() + duration * 60000)

      const { updatePersonalAppointment } = await import('@/services/api/appointments')
      await updatePersonalAppointment(
        editingPersonalAppointment.appointmentId,
        editingPersonalAppointment.userId,
        {
          title: data.title,
          description: data.description,
          address: data.address,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        }
      )

      toast.success('Cita personal actualizada exitosamente')
      setShowEditPersonalModal(false)
      setEditingPersonalAppointment(null)
      loadAppointments() // Recargar lista
    } catch (error) {
      console.error('Error updating personal appointment:', error)
      toast.error('Error al actualizar la cita')
    }
  }

  const handleDeletePersonalAppointment = async (appointment: AppointmentWithDetails) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita personal?')) return

    try {
      const { deleteAppointment } = await import('@/services/api/appointments')
      await deleteAppointment(appointment.appointmentId, appointment.type)
      toast.success('Cita eliminada exitosamente')
      loadAppointments() // Recargar lista
    } catch (error) {
      console.error('Error deleting appointment:', error)
      toast.error('Error al eliminar la cita')
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
      <div className="min-h-screen bg-[#f6f7f8] pb-20 md:pb-8">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('dashboard.welcome', 'dashboard')}, {user?.firstName}!
            </h1>
            <p className="text-gray-500 mt-1 text-sm sm:text-base">
              {t('dashboard.welcomeMessage', 'dashboard')}
            </p>
          </div>

          {/* Error de optimización */}
          {optimizationError && (
            <div className="mb-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start">
                <span className="text-2xl mr-3">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-1">
                    {t('dashboard.optimizationCalculationError', 'dashboard')}
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
                  {t('dashboard.retryOptimization', 'dashboard')}
                </button>
              </div>
            </div>
          )}

          {/* Upcoming Appointments */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Próximas Citas
              </h2>
              
              {/* Botones de acción - Stack en móvil, inline en desktop */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Botón para crear cita personal */}
                <button
                  onClick={() => setShowPersonalAppointmentModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#13a4ec] hover:bg-[#0f8fcd] text-white transition-colors font-medium shadow-md"
                >
                  <span className="text-lg">📝</span>
                  <span>Agregar Cita Personal</span>
                </button>

                {/* Toggle para mostrar citas pasadas */}
                <button
                  onClick={() => setShowPastAppointments(!showPastAppointments)}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium text-gray-700 bg-white"
                >
                  <span className="text-lg">{showPastAppointments ? '🕙' : '🕐'}</span>
                  <span>Mostrar Citas Pasadas</span>
                </button>
              </div>
            </div>
            
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
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {showPastAppointments ? t('dashboard.noAppointmentsFound', 'dashboard') : t('dashboard.noAppointments', 'dashboard')}
                </h3>
                <p className="text-gray-600 mb-6">
                  {showPastAppointments 
                    ? t('dashboard.noAppointmentsCreated', 'dashboard')
                    : t('dashboard.noAppointmentsMessage', 'dashboard')}
                </p>
                <button
                  onClick={() => router.push('/appointments')}
                  className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  {t('dashboard.bookNewAppointment', 'dashboard')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {appointments.slice(0, 4).map((appointment: AppointmentWithDetails) => {
                  const isPast = isAppointmentPast(appointment)
                  const isPersonal = appointment.type === 'personal'
                  
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
                      className={`rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow cursor-pointer relative ${
                        isPast 
                          ? 'bg-gray-50 border-2 border-gray-200 opacity-75' 
                          : isPersonal
                          ? 'bg-purple-50 border-2 border-purple-200'
                          : 'bg-white'
                      }`}
                    >
                      {/* Badge de "Pasada" */}
                      {isPast && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-500 text-white text-xs font-semibold rounded-full">
                          ✓ Completed
                        </div>
                      )}
                      
                      {/* Badge de "Personal" */}
                      {!isPast && isPersonal && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500 text-white text-xs font-semibold rounded-full">
                          📝 Personal
                        </div>
                      )}
                      
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Business Logo o ícono personal */}
                        {isPersonal ? (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                            📝
                          </div>
                        ) : appointment.business?.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={appointment.business.logoUrl}
                            alt={appointment.business.name}
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                            {appointment.business?.industry ? industryEmojis[appointment.business.industry] : '🏢'}
                          </div>
                        )}
                        
                        <div className="flex-1">
                          {/* Category Badge */}
                          {!isPersonal && appointment.business?.industry && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-[#13a4ec] text-xs font-medium rounded-full mb-2">
                              {industryEmojis[appointment.business.industry]}
                              <span>{industryLabels[appointment.business.industry]}</span>
                            </div>
                          )}
                          
                          <div className={`text-sm font-medium mb-1 ${isPast ? 'text-gray-500' : isPersonal ? 'text-purple-600' : 'text-[#13a4ec]'}`}>
                            {isPast ? 'Past Appointment' : isPersonal ? 'Personal Appointment' : 'Next Appointment'}
                          </div>
                          
                          <h3 className={`text-lg font-bold mb-1 ${isPast ? 'text-gray-600' : 'text-gray-900'}`}>
                            {isPersonal ? appointment.title : appointment.serviceType}
                          </h3>
                          
                          {/* Business Name (solo para citas de negocio) */}
                          {!isPersonal && appointment.business?.name && (
                            <p className="text-sm font-semibold text-gray-700 mb-1">
                              {appointment.business.name}
                            </p>
                          )}
                          
                          {/* Descripción (solo para citas personales) */}
                          {isPersonal && appointment.description && (
                            <p className="text-sm text-gray-600 mb-1">
                              {appointment.description}
                            </p>
                          )}
                          
                          {/* Location */}
                          <p className="text-sm text-gray-600 mb-1">
                            📍 {isPersonal ? appointment.address : (appointment.location?.name || appointment.locationName || 'Location')}
                          </p>
                          
                          {/* Date & Time */}
                          <p className="text-sm text-gray-600 mb-1">
                            {new Date(appointment.startTime).toLocaleDateString()} • {new Date(`2000-01-01T${appointment.time}`).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                          
                          {/* Duración */}
                          {(appointment.duration || appointment.estimatedDuration) && (
                            <p className="text-sm text-gray-600 mb-3">
                              ⏱️ {appointment.duration || appointment.estimatedDuration} min
                            </p>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2">
                            {isPersonal && (
                              <>
                                <button 
                                  onClick={() => handleEditPersonalAppointment(appointment)}
                                  className="text-sm text-[#13a4ec] font-medium hover:text-[#0f8fcd]"
                                >
                                  ✏️ Editar
                                </button>
                                <button 
                                  onClick={() => handleDeletePersonalAppointment(appointment)}
                                  className="text-sm text-red-600 font-medium hover:text-red-800"
                                >
                                  🗑️ Eliminar
                                </button>
                              </>
                            )}
                            {!isPersonal && (
                              <button className="text-sm text-[#13a4ec] font-medium hover:text-[#0f8fcd]">
                                Ver Detalles
                              </button>
                            )}
                          </div>
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
              <h2 className="text-xl font-bold text-gray-900 mb-4">📍 {t('dashboard.appointmentLocationsRoutes', 'dashboard')}</h2>
              <p className="text-gray-600 mb-6">
                {t('dashboard.viewAppointmentsOnMap', 'dashboard')}
              </p>
              <AppointmentMapSection 
                appointments={appointments} 
                locations={appointmentLocations}
                height="h-[500px]"
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>
          )}

          {/* Route Optimization Card - Justo debajo del mapa */}
          {hasSignificantImprovement && optimizationResult && !optimizationError && (
            <div className="mb-12">
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
                      toast.success(t('dashboard.optimizationApplied', 'dashboard'))
                    }
                  } catch (error) {
                    console.error('❌ Error aplicando optimización:', error)
                    toast.error(t('dashboard.optimizationApplyError', 'dashboard'))
                  }
                }}
                onDismiss={dismissOptimization}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 gap-6">
            <button
              onClick={() => router.push('/appointments')}
              className="bg-white/50 backdrop-blur-sm hover:bg-white border border-gray-100 rounded-2xl p-8 text-left transition-all hover:shadow-lg group"
            >
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('dashboard.bookNewAppointmentCard', 'dashboard')}
              </h3>
              <p className="text-gray-600">
                {t('dashboard.findAndBookServices', 'dashboard')}
              </p>
            </button>
          </div>
        </main>
        <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      </div>

      {/* Personal Appointment Modal */}
      <CreatePersonalAppointmentModal
        isOpen={showPersonalAppointmentModal}
        onClose={() => setShowPersonalAppointmentModal(false)}
        onSuccess={() => {
          loadAppointments()
          toast.success(`✅ ${t('dashboard.personalAppointmentCreated', 'dashboard')}`)
        }}
      />

      {/* Edit Personal Appointment Modal */}
      {editingPersonalAppointment && (
        <EditPersonalAppointmentModal
          appointment={editingPersonalAppointment}
          isOpen={showEditPersonalModal}
          onClose={() => {
            setShowEditPersonalModal(false)
            setEditingPersonalAppointment(null)
          }}
          onSave={handleSaveEditPersonalAppointment}
        />
      )}
    </>
  )
}

// Modal de edición de cita personal
interface EditPersonalAppointmentModalProps {
  appointment: AppointmentWithDetails
  isOpen: boolean
  onClose: () => void
  onSave: (data: { date: string; time: string; title: string; description?: string; address?: string }) => Promise<void>
}

function EditPersonalAppointmentModal({ appointment, isOpen, onClose, onSave }: EditPersonalAppointmentModalProps) {
  const [title, setTitle] = useState(appointment.title || '')
  const [date, setDate] = useState(appointment.date || '')
  const [time, setTime] = useState(appointment.time || '')
  const [description, setDescription] = useState(appointment.description || '')
  const [address, setAddress] = useState(appointment.address || '')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ date, time, title, description, address })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Editar Cita Personal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Título */}
            <div>
              <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 mb-1">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Fecha */}
            <div>
              <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="edit-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Hora */}
            <div>
              <label htmlFor="edit-time" className="block text-sm font-medium text-gray-700 mb-1">
                Hora <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                id="edit-time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
                required
              />
            </div>

            {/* Descripción */}
            <div>
              <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                placeholder="Agrega una descripción..."
              />
            </div>

            {/* Dirección */}
            <div>
              <label htmlFor="edit-address" className="block text-sm font-medium text-gray-700 mb-1">
                Dirección (opcional)
              </label>
              <input
                type="text"
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900 placeholder:text-gray-400"
                placeholder="Ej: Calle 123 #45-67"
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
