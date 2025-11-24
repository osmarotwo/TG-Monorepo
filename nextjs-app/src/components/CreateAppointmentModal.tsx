'use client'

import { useState, useEffect } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { createAppointment, CreateAppointmentData, validateAppointmentSlot } from '@/services/api/appointments'
import { fetchServicesByBusiness, type Service } from '@/services/api/services'
import { getAvailableSlots, type AvailableSlot } from '@/services/api/availabilityService'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/utils/formatPrice'

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  businessId: string
  businessName: string
  locationId: string
  locationName: string
}

export default function CreateAppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  businessId,
  businessName,
  locationId,
  locationName 
}: CreateAppointmentModalProps) {
  const { t, locale } = useLocale()
  const { user } = useAuth()
  
  const [services, setServices] = useState<Service[]>([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    serviceId: '',
    date: '',
    timeSlot: '', // Cambiado de 'time' a 'timeSlot'
    duration: '',
    specialistId: '', // Nuevo campo
    specialistName: '', // Nuevo campo
    notes: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-fill customer name from authenticated user
  useEffect(() => {
    if (isOpen && user) {
      const fullName = `${user.firstName} ${user.lastName}`.trim()
      setFormData(prev => ({
        ...prev,
        customerName: fullName
      }))
    }
  }, [isOpen, user])

  // Auto-fill today's date when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date()
      const colombiaTime = new Date(today.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
      const todayStr = colombiaTime.toISOString().split('T')[0] // YYYY-MM-DD
      setFormData(prev => ({
        ...prev,
        date: todayStr
      }))
    }
  }, [isOpen])

  // Load services when modal opens
  useEffect(() => {
    if (isOpen && businessId) {
      loadServices()
    }
  }, [isOpen, businessId])

  // Load available slots when date and service are selected
  useEffect(() => {
    if (formData.date && formData.serviceId && locationId) {
      loadAvailableSlots()
    } else {
      setAvailableSlots([])
    }
  }, [formData.date, formData.serviceId, locationId])

  const loadServices = async () => {
    try {
      setLoadingServices(true)
      console.log('🔄 Loading services for business:', businessId)
      const businessServices = await fetchServicesByBusiness(businessId)
      console.log('✅ Services loaded:', businessServices.length, 'services')
      console.log('📋 Services:', businessServices)
      setServices(businessServices)
    } catch (error) {
      console.error('❌ Error loading services:', error)
      setErrors({ services: 'Error al cargar servicios' })
    } finally {
      setLoadingServices(false)
    }
  }

  const loadAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      console.log('🔄 Loading available slots...')
      console.log('📍 Location:', locationId)
      console.log('📅 Date:', formData.date)
      console.log('🎯 Service ID:', formData.serviceId)
      
      const selectedService = services.find(s => s.serviceId === formData.serviceId)
      if (!selectedService) {
        console.log('⚠️ No service selected or service not found')
        return
      }
      
      console.log('✅ Selected service:', selectedService.name, '- Duration:', selectedService.defaultDuration)
      
      const slots = await getAvailableSlots(
        locationId,
        formData.date,
        selectedService.name,
        selectedService.defaultDuration,
        user?.userId // Pasar el userId para excluir horarios donde el usuario ya tiene citas
      )
      
      console.log('✅ Available slots loaded:', slots.length, 'slots')
      console.log('🕐 Slots:', slots)
      setAvailableSlots(slots)
    } catch (error) {
      console.error('❌ Error loading available slots:', error)
      setAvailableSlots([])
      setErrors(prev => ({ ...prev, timeSlot: 'Error al cargar horarios disponibles' }))
    } finally {
      setLoadingSlots(false)
    }
  }

  if (!isOpen) return null

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleServiceChange = (serviceId: string) => {
    const service = services.find(s => s.serviceId === serviceId)
    setFormData(prev => ({
      ...prev,
      serviceId,
      duration: service ? service.defaultDuration.toString() : '',
      timeSlot: '', // Reset time slot when service changes
      specialistId: '',
      specialistName: ''
    }))
    setErrors(prev => ({ ...prev, serviceId: '', duration: '', timeSlot: '' }))
  }

  const handleTimeSlotChange = (slotTime: string) => {
    const slot = availableSlots.find(s => s.time === slotTime)
    setFormData(prev => ({
      ...prev,
      timeSlot: slotTime,
      specialistId: slot?.specialistId || '',
      specialistName: slot?.specialistName || ''
    }))
    setErrors(prev => ({ ...prev, timeSlot: '' }))
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.customerName.trim()) {
      newErrors.customerName = t('allFieldsRequired', 'appointments')
    }
    if (!formData.serviceId) {
      newErrors.serviceId = t('allFieldsRequired', 'appointments')
    }
    if (!formData.date) {
      newErrors.date = t('allFieldsRequired', 'appointments')
    } else {
      // Comparar solo fechas (sin horas) para evitar problemas de zona horaria
      const selectedDate = new Date(formData.date + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = t('dateInPast', 'appointments')
      }
    }
    if (!formData.timeSlot) {
      newErrors.timeSlot = t('allFieldsRequired', 'appointments')
    }
    // Duración se toma automáticamente del slot seleccionado, no necesita validación

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 handleSubmit called')
    console.log('📋 Form data:', formData)
    console.log('👤 User:', user)

    if (!validate() || !user) {
      console.log('❌ Validation failed or no user')
      return
    }

    console.log('✅ Validation passed, starting submission...')
    setIsSubmitting(true)

    try {
      const selectedService = services.find(s => s.serviceId === formData.serviceId)
      const selectedSlot = availableSlots.find(s => s.time === formData.timeSlot)
      const serviceType = locale === 'es' ? selectedService?.name : selectedService?.nameEn
      
      // Usar la duración del slot seleccionado
      const duration = selectedSlot?.durationMinutes || selectedService?.defaultDuration || 30
      
      // 🔒 VALIDACIÓN: Verificar disponibilidad antes de crear
      console.log('🔍 Validating slot availability...')
      const validation = await validateAppointmentSlot(
        locationId,
        formData.date,
        formData.timeSlot,
        duration
      )
      
      if (!validation.available) {
        console.log('❌ Slot not available:', validation.reason)
        setErrors({ timeSlot: validation.reason || 'Este horario ya no está disponible' })
        setIsSubmitting(false)
        return
      }
      
      console.log('✅ Slot is available, proceeding with creation...')
      
      const appointmentData: CreateAppointmentData = {
        userId: user.userId,
        businessId: businessId,
        locationId: locationId,
        customerName: formData.customerName,
        serviceType: serviceType || '',
        serviceId: formData.serviceId, // Incluir serviceId para obtener precio
        date: formData.date,
        time: formData.timeSlot,
        duration: duration,
        notes: formData.notes
      }
      
      console.log('📤 Sending appointment data:', appointmentData)
      
      const result = await createAppointment(appointmentData)
      
      console.log('✅ Appointment created successfully:', result)
      
      // Reset form
      setFormData({
        customerName: '',
        serviceId: '',
        date: '',
        timeSlot: '',
        duration: '',
        notes: '',
        specialistId: '',
        specialistName: ''
      })
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error creating appointment:', error)
      setErrors({ submit: t('createError', 'appointments') || 'Error al crear la cita' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {t('createAppointment', 'appointments')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {businessName} - {locationName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Message */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">
                {locale === 'es' ? '📋 Reserva tu cita' : '📋 Book your appointment'}
              </span>
              <br />
              {locale === 'es' 
                ? 'Selecciona el servicio, fecha y horario que prefieras. Tu nombre ya está registrado.' 
                : 'Select the service, date and time you prefer. Your name is already registered.'}
            </p>
          </div>

          {/* Customer Name - Auto-filled from user session */}
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('customerName', 'appointments')}
            </label>
            <input
              id="customerName"
              type="text"
              value={formData.customerName}
              readOnly
              className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] border border-gray-300 text-gray-700 cursor-not-allowed"
              title={locale === 'es' ? 'Este campo se completa automáticamente con tu nombre' : 'This field is automatically filled with your name'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {locale === 'es' ? 'Nombre obtenido de tu perfil' : 'Name from your profile'}
            </p>
          </div>

          {/* Service Type */}
          <div>
            <label htmlFor="serviceId" className="block text-sm font-medium text-gray-700 mb-2">
              {t('service', 'appointments')} <span className="text-red-500">*</span>
            </label>
            <select
              id="serviceId"
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg bg-white border ${
                errors.serviceId ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-[#13a4ec] transition-all text-gray-900`}
              disabled={isSubmitting || loadingServices}
            >
              <option value="" className="text-gray-500">
                {loadingServices ? 'Cargando servicios...' : t('servicePlaceholder', 'appointments')}
              </option>
              {services.map((service) => (
                <option key={service.serviceId} value={service.serviceId} className="text-gray-900">
                  {locale === 'es' ? service.name : service.nameEn} • {service.defaultDuration} min • {formatPrice(service.basePrice, service.currency)}
                </option>
              ))}
            </select>
            {errors.serviceId && (
              <p className="text-red-500 text-sm mt-1">{errors.serviceId}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                {t('date', 'appointments')} <span className="text-red-500">*</span>
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg bg-white border ${
                  errors.date ? 'border-red-500' : 'border-gray-300'
                } focus:outline-none focus:ring-2 focus:ring-[#13a4ec] transition-all text-gray-900`}
                disabled={isSubmitting}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label htmlFor="timeSlot" className="block text-sm font-medium text-gray-700 mb-2">
                {t('time', 'appointments')} <span className="text-red-500">*</span>
              </label>
              {loadingSlots ? (
                <div className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] border border-gray-300 text-gray-500 text-center">
                  {locale === 'es' ? 'Cargando horarios disponibles...' : 'Loading available times...'}
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="w-full px-4 py-3 rounded-lg bg-[#f6f7f8] border border-gray-300 text-gray-500 text-center">
                  {locale === 'es' ? 'No hay horarios disponibles para esta fecha y servicio' : 'No available times for this date and service'}
                </div>
              ) : (
                <select
                  id="timeSlot"
                  value={formData.timeSlot}
                  onChange={(e) => handleTimeSlotChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg bg-white border ${
                    errors.timeSlot ? 'border-red-500' : 'border-gray-300'
                  } focus:outline-none focus:ring-2 focus:ring-[#13a4ec] transition-all text-gray-900`}
                  disabled={isSubmitting || !formData.date || !formData.serviceId}
                >
                  <option value="">
                    {locale === 'es' ? 'Selecciona un horario' : 'Select a time slot'}
                  </option>
                  {availableSlots.map((slot) => (
                    <option key={`${slot.time}-${slot.specialistId}`} value={slot.time}>
                      {slot.time} - {slot.specialistName} ({slot.durationMinutes} {t('minutes', 'appointments')})
                    </option>
                  ))}
                </select>
              )}
              {errors.timeSlot && (
                <p className="text-red-500 text-sm mt-1">{errors.timeSlot}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              {t('notes', 'appointments')}
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder={t('notesPlaceholder', 'appointments')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#13a4ec] transition-all resize-none text-gray-900 placeholder:text-gray-400"
              disabled={isSubmitting}
            />
          </div>

          {/* Price Summary */}
          {formData.serviceId && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {locale === 'es' ? 'Precio del servicio' : 'Service price'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {services.find(s => s.serviceId === formData.serviceId)?.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-[#13a4ec]">
                    {formatPrice(
                      services.find(s => s.serviceId === formData.serviceId)?.basePrice || 0,
                      services.find(s => s.serviceId === formData.serviceId)?.currency || 'COP'
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              {t('cancel', 'appointments')}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-[#13a4ec] text-white font-medium hover:bg-[#0f8fcd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? t('creating', 'appointments') : t('create', 'appointments')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
