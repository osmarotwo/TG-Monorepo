'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import MapSection from '@/components/dashboard/MapSection'
import CreateAppointmentModal from '@/components/CreateAppointmentModal'
import { fetchBusinessesByOwner } from '@/services/api/businesses'
import { fetchLocationsByBusiness, type Location as LocationType } from '@/services/api/locations'
import { fetchUpcomingAppointments, type Appointment, deleteAppointment } from '@/services/api/appointments'
import { ToastContainer, useToast } from '@/components/Toast'
import { formatPrice } from '@/utils/formatPrice'
import { getAvailableSlots, type AvailableSlot } from '@/services/api/availabilityService'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<LocationType | null>(null)
  
  // Estado para citas programadas
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('all')
  const [showScheduledAppointments, setShowScheduledAppointments] = useState(true)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

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
      loadAppointments()
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

  const loadAppointments = async () => {
    if (!user?.userId) return
    
    try {
      setLoadingAppointments(true)
      const data = await fetchUpcomingAppointments(user.userId, 50, true) // Obtener próximas citas
      
      // Enriquecer citas con información faltante
      const enrichedAppointments = await Promise.all(data.map(async (appointment) => {
        const enriched = { ...appointment }
        
        // Si es cita de negocio y le falta información
        if (appointment.type !== 'personal') {
          // Obtener nombre de ubicación si falta
          if (!enriched.locationName && enriched.locationId) {
            try {
              const locationData = await fetchLocationsByBusiness(enriched.businessId)
              const location = locationData.find(loc => loc.locationId === enriched.locationId)
              if (location) {
                enriched.locationName = location.name
              }
            } catch (error) {
              console.error('Error fetching location:', error)
            }
          }
          
          // Obtener precio del servicio si falta
          if (!enriched.servicePrice && enriched.businessId) {
            try {
              const { fetchServicesByBusiness } = await import('@/services/api/services')
              const services = await fetchServicesByBusiness(enriched.businessId)
              const service = services.find(s => 
                s.name === enriched.serviceType || 
                s.name === enriched.serviceName
              )
              if (service) {
                enriched.servicePrice = service.basePrice
                enriched.serviceCurrency = service.currency
              }
            } catch (error) {
              console.error('Error fetching service price:', error)
            }
          }
        }
        
        return enriched
      }))
      
      // Ordenar por fecha y hora
      const sorted = enrichedAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time || '00:00'}`)
        const dateB = new Date(`${b.date}T${b.time || '00:00'}`)
        return dateA.getTime() - dateB.getTime()
      })
      setAppointments(sorted)
    } catch (error) {
      console.error('Error loading appointments:', error)
      toast.error('Error al cargar las citas')
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleDeleteAppointment = async (appointment: Appointment) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cita?')) return
    
    try {
      await deleteAppointment(appointment.appointmentId, appointment.type)
      toast.success('Cita eliminada exitosamente')
      loadAppointments() // Recargar lista
    } catch (error) {
      console.error('Error deleting appointment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la cita'
      toast.error(errorMessage)
    }
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment)
    setShowEditModal(true)
  }

  const handleSaveEdit = async (updatedData: { date: string; time: string; notes?: string }) => {
    if (!editingAppointment) return

    try {
      // Construir startTime y endTime
      const startTime = new Date(`${updatedData.date}T${updatedData.time}`)
      const endTime = new Date(startTime.getTime() + (editingAppointment.estimatedDuration || 60) * 60000)

      // Importar y usar la función de actualización
      const { updateAppointmentTimes } = await import('@/services/api/appointments')
      await updateAppointmentTimes(
        editingAppointment.appointmentId,
        editingAppointment.userId,
        startTime.toISOString(),
        endTime.toISOString()
      )

      toast.success('Cita actualizada exitosamente')
      setShowEditModal(false)
      setEditingAppointment(null)
      loadAppointments() // Recargar lista
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast.error('Error al actualizar la cita')
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
    setSelectedLocation(null)
  }

  const handleLocationClick = (location: LocationType) => {
    setSelectedLocation(location)
    setIsModalOpen(true)
  }

  const handleModalSuccess = () => {
    toast.success('Cita creada exitosamente')
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
                <h1 className="text-3xl font-bold text-gray-900">Gestión de Citas</h1>
                <p className="text-gray-600 mt-2">
                  Administra tus citas programadas o reserva una nueva
                </p>
              </div>

              {/* Toggle: Citas Programadas / Reservar Nueva Cita */}
              <div className="mb-8">
                <div className="inline-flex rounded-lg bg-white p-1 shadow-sm border border-gray-200">
                  <button
                    onClick={() => setShowScheduledAppointments(true)}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      showScheduledAppointments
                        ? 'bg-[#13a4ec] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📋 Citas Programadas
                  </button>
                  <button
                    onClick={() => setShowScheduledAppointments(false)}
                    className={`px-6 py-2 rounded-md font-medium transition-all ${
                      !showScheduledAppointments
                        ? 'bg-[#13a4ec] text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ➕ Reservar Nueva Cita
                  </button>
                </div>
              </div>

              {/* Sección: Citas Programadas */}
              {showScheduledAppointments && (
                <div className="mb-12">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Header con filtro de fecha */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-xl font-bold text-gray-900">Mis Citas Programadas</h2>
                        <div className="flex items-center gap-3">
                          <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                            Filtrar por fecha:
                          </label>
                          <select
                            id="date-filter"
                            value={selectedDateFilter}
                            onChange={(e) => setSelectedDateFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900 bg-white"
                          >
                            <option value="all">Todas las fechas</option>
                            {Array.from(new Set(appointments.map(apt => apt.date).filter(Boolean)))
                              .sort()
                              .map(date => {
                                const dateObj = new Date(date + 'T00:00:00')
                                const formatted = dateObj.toLocaleDateString('es-CO', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                                return (
                                  <option key={date} value={date}>{formatted}</option>
                                )
                              })}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Tabla de citas */}
                    <div className="overflow-x-auto">
                      {loadingAppointments ? (
                        <div className="p-12 text-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec] mx-auto"></div>
                          <p className="mt-4 text-gray-600">Cargando citas...</p>
                        </div>
                      ) : appointments.filter(apt => selectedDateFilter === 'all' || apt.date === selectedDateFilter).length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="text-6xl mb-4">📅</div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">No hay citas programadas</h3>
                          <p className="text-gray-600 mb-6">Reserva tu primera cita para comenzar</p>
                          <button
                            onClick={() => setShowScheduledAppointments(false)}
                            className="bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-lg font-medium transition-colors"
                          >
                            Reservar Cita
                          </button>
                        </div>
                      ) : (
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tipo
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Servicio/Evento
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ubicación
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha y Hora
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duración
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Precio
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {appointments
                              .filter(apt => selectedDateFilter === 'all' || apt.date === selectedDateFilter)
                              .map((appointment) => {
                                const isPersonal = appointment.type === 'personal'
                                const dateObj = new Date(`${appointment.date}T${appointment.time || '00:00'}`)
                                const formattedDate = dateObj.toLocaleDateString('es-CO', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })
                                const formattedTime = appointment.time || dateObj.toLocaleTimeString('es-CO', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })

                                return (
                                  <tr key={appointment.appointmentId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {isPersonal ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                          📝 Personal
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          🏢 Negocio
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm font-medium text-gray-900">
                                        {isPersonal ? appointment.title : appointment.serviceType}
                                      </div>
                                      {!isPersonal && appointment.customerName && (
                                        <div className="text-sm text-gray-500">
                                          Cliente: {appointment.customerName}
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="text-sm text-gray-900">
                                        {isPersonal 
                                          ? (appointment.address || 'N/A')
                                          : (appointment.locationName || 'N/A')
                                        }
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{formattedDate}</div>
                                      <div className="text-sm text-gray-500">{formattedTime}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {appointment.duration || appointment.estimatedDuration || 'N/A'} min
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {appointment.servicePrice && appointment.serviceCurrency ? (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-[#13a4ec] border border-blue-200">
                                          {formatPrice(appointment.servicePrice, appointment.serviceCurrency)}
                                        </span>
                                      ) : (
                                        <span className="text-sm text-gray-400">N/A</span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleEditAppointment(appointment)}
                                          className="text-[#13a4ec] hover:text-[#0f8fcd] font-medium transition-colors"
                                          title="Editar cita"
                                        >
                                          ✏️ Editar
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAppointment(appointment)}
                                          className="text-red-600 hover:text-red-800 font-medium transition-colors"
                                          title="Eliminar cita"
                                        >
                                          🗑️ Eliminar
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sección: Reservar Nueva Cita */}
              {!showScheduledAppointments && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reservar Nueva Cita</h2>
                    <p className="text-gray-600">
                      Selecciona un comercio y ubicación para agendar tu cita
                    </p>
                  </div>
                </>
              )}

              {/* Industry Filters - Solo mostrar si está en modo reservar */}
              {!showScheduledAppointments && (
              <>
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
                    onClick={() => handleLocationClick(location)}
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
        
        {/* Modal */}
        {selectedLocation && selectedBusiness && (
          <CreateAppointmentModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleModalSuccess}
            businessId={selectedBusiness.businessId}
            businessName={selectedBusiness.name}
            locationId={selectedLocation.locationId}
            locationName={selectedLocation.name}
          />
        )}

        {/* Modal de Edición */}
        {showEditModal && editingAppointment && (
          <EditAppointmentModal
            appointment={editingAppointment}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false)
              setEditingAppointment(null)
            }}
            onSave={handleSaveEdit}
          />
        )}
        
        <ToastContainer toasts={toast.toasts} onClose={toast.closeToast} />
      </div>
    </>
  )
}

// Modal de Edición de Cita
interface EditAppointmentModalProps {
  appointment: Appointment
  isOpen: boolean
  onClose: () => void
  onSave: (data: { date: string; time: string; notes?: string }) => Promise<void>
}

function EditAppointmentModal({ appointment, isOpen, onClose, onSave }: EditAppointmentModalProps) {
  const [date, setDate] = useState(appointment.date || '')
  const [time, setTime] = useState(appointment.time || '')
  const [notes, setNotes] = useState(appointment.notes || '')
  const [saving, setSaving] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [servicePrice, setServicePrice] = useState<number | null>(appointment.servicePrice || null)
  const [serviceCurrency, setServiceCurrency] = useState<string>(appointment.serviceCurrency || 'COP')

  const isPersonal = appointment.type === 'personal'

  // Obtener precio del servicio si no está en la cita
  useEffect(() => {
    if (!isPersonal && !servicePrice && appointment.businessId) {
      fetchServicePrice()
    }
  }, [isPersonal, servicePrice, appointment.businessId])

  // Cargar slots disponibles cuando cambia la fecha (solo para citas de negocio)
  useEffect(() => {
    if (!isPersonal && date && appointment.locationId) {
      loadAvailableSlots()
    } else {
      setAvailableSlots([])
    }
  }, [date, isPersonal, appointment.locationId])

  const fetchServicePrice = async () => {
    try {
      const { fetchServicesByBusiness } = await import('@/services/api/services')
      const services = await fetchServicesByBusiness(appointment.businessId)
      const service = services.find(s => 
        s.name === appointment.serviceType || 
        s.name === appointment.serviceName
      )
      if (service) {
        setServicePrice(service.basePrice)
        setServiceCurrency(service.currency)
      }
    } catch (error) {
      console.error('Error fetching service price:', error)
    }
  }

  const loadAvailableSlots = async () => {
    if (!appointment.locationId) return
    
    try {
      setLoadingSlots(true)
      const slots = await getAvailableSlots(
        appointment.locationId,
        date,
        appointment.serviceType || appointment.serviceName,
        appointment.duration || appointment.estimatedDuration,
        appointment.userId
      )
      setAvailableSlots(slots)
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({ date, time, notes })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Editar Cita</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información de la cita */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {isPersonal ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                📝 Personal
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                🏢 Negocio
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-900">
            {isPersonal ? appointment.title : appointment.serviceType}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {isPersonal ? appointment.address : appointment.locationName}
          </p>
          {!isPersonal && appointment.customerName && (
            <p className="text-sm text-gray-500 mt-1">
              Cliente: {appointment.customerName}
            </p>
          )}
          {!isPersonal && servicePrice && serviceCurrency && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Precio del servicio:</span>
                <span className="text-lg font-bold text-[#13a4ec]">
                  {formatPrice(servicePrice, serviceCurrency)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {/* Fecha */}
            <div>
              <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
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
                Hora
              </label>
              {isPersonal ? (
                <input
                  type="time"
                  id="edit-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
                  required
                />
              ) : loadingSlots ? (
                <div className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] border border-gray-300 text-gray-500 text-center">
                  Cargando horarios disponibles...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] border border-gray-300 text-gray-500 text-center text-sm">
                  No hay horarios disponibles para esta fecha. Selecciona otra fecha.
                </div>
              ) : (
                <select
                  id="edit-time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900"
                  required
                >
                  <option value="" className="text-gray-500">Selecciona un horario</option>
                  {availableSlots.map((slot) => (
                    <option key={`${slot.time}-${slot.specialistId}`} value={slot.time} className="text-gray-900">
                      {slot.time} - {slot.specialistName} ({slot.durationMinutes} min)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Notas */}
            <div>
              <label htmlFor="edit-notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                placeholder="Agrega notas adicionales..."
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
