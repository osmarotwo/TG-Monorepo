'use client'

import { useState, useEffect, useRef } from 'react'
import Script from 'next/script'
import { useLocale } from '@/contexts/LocaleContext'
import { createAppointment, CreateAppointmentData, validateAppointmentSlot } from '@/services/api/appointments'
import { fetchServicesByBusiness, type Service } from '@/services/api/services'
import { getAvailableSlots, type AvailableSlot } from '@/services/api/availabilityService'
import { useAuth } from '@/contexts/AuthContext'
import { formatPrice } from '@/utils/formatPrice'
import { generateOrderId, generateBoldHash, calculateDeposit, formatAmountForBold } from '@/services/api/boldPayment'

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
  
  // Estados para pago Bold
  const [paymentStep, setPaymentStep] = useState<'form' | 'payment' | 'processing'>('form')
  const [boldOrderId, setBoldOrderId] = useState<string>('')
  const [boldHash, setBoldHash] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState<number>(0)
  const [servicePrice, setServicePrice] = useState<number>(0)
  const boldButtonContainerRef = useRef<HTMLDivElement>(null)

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

  // Efecto para inyectar el botón de Bold cuando se muestra el paso de pago
  useEffect(() => {
    if (paymentStep === 'payment' && boldOrderId && boldHash && depositAmount > 0 && user) {
      console.log('💳 Inyectando botón de Bold con datos:', {
        orderId: boldOrderId,
        amount: depositAmount,
        hash: boldHash
      })

      const container = document.getElementById('bold-button-container')
      if (!container) {
        console.error('❌ Contenedor del botón no encontrado')
        return
      }

      // Limpiar contenedor
      container.innerHTML = ''

      const selectedService = services.find(s => s.serviceId === formData.serviceId)
      const serviceName = selectedService?.name || 'Servicio'

      // Crear el script del botón con todos los atributos data-* (ATRIBUTOS REQUERIDOS)
      const buttonScript = document.createElement('script')
      buttonScript.setAttribute('src', 'https://checkout.bold.co/library/boldPaymentButton.js')
      buttonScript.setAttribute('data-bold-button', 'dark-L')
      
      // ATRIBUTOS OBLIGATORIOS
      buttonScript.setAttribute('data-api-key', 'kNL9SEkKTHnDfI68ws-J_IKl6UKjj-cKtbUeY_I2Zks')
      buttonScript.setAttribute('data-order-id', boldOrderId)
      buttonScript.setAttribute('data-currency', 'COP')
      buttonScript.setAttribute('data-amount', depositAmount.toString())
      buttonScript.setAttribute('data-integrity-signature', boldHash)
      
      // ATRIBUTOS OPCIONALES
      buttonScript.setAttribute('data-description', `Reserva de cita - ${serviceName}`)
      buttonScript.setAttribute('data-render-mode', 'embedded')
      
      // Bold requiere formato especial para localhost según documentación:
      // "Para pruebas locales no usar 127.0.0.1, en vez debe usar localhost"
      // Sin https:// para localhost
      if (!window.location.origin.includes('localhost')) {
        // Solo agregar redirection-url en producción con https
        buttonScript.setAttribute('data-redirection-url', `${window.location.origin}/appointments/payment-success`)
      }
      // En localhost, Bold usará la URL base automáticamente
      
      // Datos del cliente (pre-llenar formulario) - JSON como string
      const customerData = {
        email: user.email || '',
        fullName: `${user.firstName} ${user.lastName}`,
        phone: user.phone || '',
        dialCode: '+57'
      }
      buttonScript.setAttribute('data-customer-data', JSON.stringify(customerData))
      
      console.log('📋 Atributos del botón Bold:', {
        apiKey: 'kNL9SEkKTHnDfI68ws-J_IKl6UKjj-cKtbUeY_I2Zks',
        orderId: boldOrderId,
        currency: 'COP',
        amount: depositAmount.toString(),
        hash: boldHash,
        description: `Reserva de cita - ${serviceName}`,
        redirectionUrl: `${window.location.origin}/appointments/payment-success`,
        renderMode: 'embedded',
        customerData
      })

      // Agregar al contenedor
      container.appendChild(buttonScript)

      console.log('✅ Botón de Bold inyectado correctamente')
    }

    // Escuchar evento de pago exitoso de Bold (modo embedded)
    const handleBoldPaymentSuccess = async (event: MessageEvent) => {
      // Log todos los mensajes para debugging
      console.log('📨 Mensaje recibido:', {
        origin: event.origin,
        data: event.data,
        type: typeof event.data
      })
      
      // Bold en modo embedded envía mensajes con diferentes formatos
      // Verificar si viene de Bold (checkout.bold.co)
      if (!event.origin.includes('bold.co')) {
        return
      }
      
      // Bold puede enviar el orderId en el mensaje
      const eventData = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      const isPaymentComplete = (
        eventData?.status === 'approved' ||
        eventData?.status === 'APPROVED' ||
        eventData?.txStatus === 'approved' || // Bold callback format
        eventData?.txStatus === 'APPROVED' ||
        eventData?.type === 'payment_success' ||
        (eventData?.orderId === boldOrderId && eventData?.success === true)
      )
      
      console.log('💳 💳 💳 PAYMENT CALLBACK RECEIVED FROM BOLD:', {
        eventData,
        isPaymentComplete,
        hasUser: !!user,
        userId: user?.userId,
        timestamp: new Date().toISOString()
      })
      
      if (isPaymentComplete) {
        console.log('✅ Pago exitoso detectado de Bold:', eventData)
        
        // PASO 1: Registrar el pago exitoso inmediatamente (incluso si no hay sesión)
        const paymentRecord = {
          orderId: eventData.orderId || boldOrderId,
          txStatus: eventData.txStatus || eventData.status,
          timestamp: Date.now(),
          amount: depositAmount,
          allParams: eventData
        }
        console.log('💰 Registrando pago exitoso:', paymentRecord)
        
        // PASO 1.5: SIEMPRE guardar en localStorage antes de continuar
        // Esto es necesario porque Bold puede redirigir y perder el contexto
        const selectedService = services.find(s => s.serviceId === formData.serviceId)
        const selectedSlot = availableSlots.find(s => s.time === formData.timeSlot)
        const serviceType = locale === 'es' ? selectedService?.name : selectedService?.nameEn
        const duration = selectedSlot?.durationMinutes || selectedService?.defaultDuration || 30
        
        const appointmentData: CreateAppointmentData = {
          userId: user?.userId || '',
          businessId: businessId,
          locationId: locationId,
          customerName: formData.customerName,
          serviceType: serviceType || '',
          serviceId: formData.serviceId,
          date: formData.date,
          time: formData.timeSlot,
          duration: duration,
          notes: formData.notes
        }
        
        localStorage.setItem('pendingAppointmentPayment', JSON.stringify({
          boldOrderId: boldOrderId,
          appointmentData: appointmentData,
          paymentRecord: paymentRecord,
          timestamp: Date.now()
        }))
        console.log('💾 Información de cita guardada en localStorage para callback')
        
        // PASO 2: Intentar crear la cita inmediatamente si hay sesión
        if (!user) {
          console.warn('⚠️ Sesión expirada, redirigiendo al login')
          alert(locale === 'es' 
            ? 'Tu pago fue exitoso. Por favor inicia sesión nuevamente para confirmar tu cita.' 
            : 'Your payment was successful. Please log in again to confirm your appointment.')
          return
        }
        
        // PASO 3: Crear cita inmediatamente con sesión activa
        console.log('🚀 Creando cita inmediatamente - Usuario autenticado:', user.userId)
        setPaymentStep('processing')
        
        try {
          const selectedService = services.find(s => s.serviceId === formData.serviceId)
          const selectedSlot = availableSlots.find(s => s.time === formData.timeSlot)
          const serviceType = locale === 'es' ? selectedService?.name : selectedService?.nameEn
          const duration = selectedSlot?.durationMinutes || selectedService?.defaultDuration || 30
          
          // Validar disponibilidad antes de crear
          console.log('🔍 Validando disponibilidad del horario...')
          const validation = await validateAppointmentSlot(
            locationId,
            formData.date,
            formData.timeSlot,
            duration
          )
          
          if (!validation.available) {
            throw new Error(validation.reason || 'Horario no disponible')
          }
          
          // Crear cita con información de pago
          const appointmentData: CreateAppointmentData = {
            userId: user.userId,
            businessId: businessId,
            locationId: locationId,
            customerName: formData.customerName,
            serviceType: serviceType || '',
            serviceId: formData.serviceId,
            date: formData.date,
            time: formData.timeSlot,
            duration: duration,
            notes: `Pago confirmado - Order ID: ${boldOrderId}${formData.notes ? '\n' + formData.notes : ''}`,
            specialistId: formData.specialistId,
            specialistName: formData.specialistName,
          }
          
          console.log('📤 CREANDO CITA CON PAGO CONFIRMADO:', {
            appointmentData,
            boldOrderId,
            timestamp: new Date().toISOString()
          })
          
          const result = await createAppointment(appointmentData)
          
          console.log('✅ ✅ ✅ CITA CREADA EXITOSAMENTE EN DYNAMODB:', {
            result,
            appointmentId: result.appointmentId,
            timestamp: new Date().toISOString()
          })
          
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
          setPaymentStep('form')
          setBoldOrderId('')
          setBoldHash('')
          setDepositAmount(0)
          setServicePrice(0)
          
          onSuccess?.()
          onClose()
        } catch (error) {
          console.error('❌ Error al crear cita después del pago:', error)
          setErrors({ 
            submit: `Error al confirmar la cita. Tu pago fue exitoso (Order ID: ${boldOrderId}). Por favor contacta soporte.` 
          })
          setPaymentStep('payment')
        }
      }
    }

    window.addEventListener('message', handleBoldPaymentSuccess)

    return () => {
      window.removeEventListener('message', handleBoldPaymentSuccess)
    }
  }, [paymentStep, boldOrderId, boldHash, depositAmount, formData, services, availableSlots, user, locale, locationId, businessId, onSuccess, onClose])

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

  /**
   * Prepara el pago con Bold (paso 1: validar formulario y mostrar resumen de pago)
   */
  const handleProceedToPayment = async () => {
    if (!validate() || !user) {
      return
    }

    const selectedService = services.find(s => s.serviceId === formData.serviceId)
    if (!selectedService) {
      setErrors({ serviceId: 'Servicio no encontrado' })
      return
    }

    try {
      setIsSubmitting(true)

      // Calcular anticipo (20% del precio del servicio)
      const deposit = calculateDeposit(selectedService.basePrice)
      const amount = formatAmountForBold(deposit)

      // Generar orderId único
      const orderId = await generateOrderId(user.userId)

      // Generar hash de integridad
      const hashData = await generateBoldHash(orderId, amount, selectedService.currency)

      // Guardar datos del pago
      setBoldOrderId(orderId)
      setBoldHash(hashData.hash)
      setDepositAmount(amount)
      setServicePrice(selectedService.basePrice)

      // 🔑 CRÍTICO: Guardar información de la cita en localStorage ANTES de mostrar Bold
      // Esto garantiza que esté disponible cuando Bold redirija después del pago
      const selectedSlot = availableSlots.find(s => s.time === formData.timeSlot)
      const serviceType = locale === 'es' ? selectedService?.name : selectedService?.nameEn
      const duration = selectedSlot?.durationMinutes || selectedService?.defaultDuration || 30
      
      const appointmentDataToSave: CreateAppointmentData = {
        userId: user.userId,
        businessId: businessId,
        locationId: locationId,
        customerName: formData.customerName,
        serviceType: serviceType || '',
        serviceId: formData.serviceId,
        date: formData.date,
        time: formData.timeSlot,
        duration: duration,
        notes: formData.notes
      }
      
      localStorage.setItem('pendingAppointmentPayment', JSON.stringify({
        boldOrderId: orderId,
        appointmentData: appointmentDataToSave,
        timestamp: Date.now()
      }))
      console.log('💾 Información de cita pre-guardada en localStorage:', {
        orderId,
        appointmentData: appointmentDataToSave
      })

      // Cambiar a vista de pago
      setPaymentStep('payment')
      
      console.log('💳 Payment prepared:', { orderId, amount, hash: hashData.hash })
    } catch (error) {
      console.error('❌ Error preparing payment:', error)
      setErrors({ submit: 'Error al preparar el pago. Por favor intenta nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
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
    <>
      {/* Bold Payment Button Script */}
      <Script 
        src="https://checkout.bold.co/library/boldPaymentButton.js"
        strategy="lazyOnload"
      />
      
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {paymentStep === 'form' && (t('createAppointment', 'appointments'))}
              {paymentStep === 'payment' && (locale === 'es' ? '💳 Confirmar pago' : '💳 Confirm payment')}
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

        {/* Progress Indicator */}
        <div className="px-4 sm:px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <div className={`flex items-center ${paymentStep === 'form' ? 'text-[#13a4ec]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paymentStep === 'form' ? 'bg-[#13a4ec] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">
                {locale === 'es' ? 'Datos de la cita' : 'Appointment details'}
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${paymentStep === 'payment' ? 'text-[#13a4ec]' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${paymentStep === 'payment' ? 'bg-[#13a4ec] text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:inline">
                {locale === 'es' ? 'Pago' : 'Payment'}
              </span>
            </div>
          </div>
        </div>

        {/* Form - Paso 1: Formulario */}
        {paymentStep === 'form' && (
          <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
              disabled={isSubmitting || !formData.serviceId || !formData.date || !formData.timeSlot}
            >
              {isSubmitting ? (locale === 'es' ? 'Preparando...' : 'Preparing...') : (locale === 'es' ? 'Continuar al pago' : 'Continue to payment')}
            </button>
          </div>
        </form>
        )}

        {/* Paso 2: Vista de Pago con Bold */}
        {paymentStep === 'payment' && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Resumen de la cita */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {locale === 'es' ? '📋 Resumen de tu cita' : '📋 Appointment summary'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{locale === 'es' ? 'Servicio:' : 'Service:'}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {services.find(s => s.serviceId === formData.serviceId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{locale === 'es' ? 'Fecha:' : 'Date:'}</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(formData.date + 'T00:00:00').toLocaleDateString('es-CO', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{locale === 'es' ? 'Hora:' : 'Time:'}</span>
                  <span className="text-sm font-semibold text-gray-900">{formData.timeSlot}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{locale === 'es' ? 'Ubicación:' : 'Location:'}</span>
                  <span className="text-sm font-semibold text-gray-900">{locationName}</span>
                </div>
                
                <div className="border-t border-blue-300 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-medium text-gray-700">
                      {locale === 'es' ? 'Precio total:' : 'Total price:'}
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatPrice(servicePrice, 'COP')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 bg-white rounded-lg p-3 border-2 border-[#13a4ec]">
                    <span className="text-base font-bold text-[#13a4ec]">
                      {locale === 'es' ? 'Anticipo a pagar (20%):' : 'Deposit to pay (20%):'}
                    </span>
                    <span className="text-2xl font-bold text-[#13a4ec]">
                      {formatPrice(depositAmount, 'COP')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del pago */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <span className="text-2xl">💡</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-900 mb-1">
                    {locale === 'es' ? '¿Por qué pagar un anticipo?' : 'Why pay a deposit?'}
                  </p>
                  <p className="text-xs text-yellow-800">
                    {locale === 'es' 
                      ? 'El anticipo del 20% confirma tu reserva y garantiza tu espacio. El resto lo pagas al recibir el servicio.'
                      : 'The 20% deposit confirms your reservation and guarantees your spot. You pay the rest when receiving the service.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Contenedor del botón de Bold */}
            <div className="flex flex-col items-center py-4 space-y-4">
              <div id="bold-button-container" className="w-full max-w-md"></div>
              
              {/* Información de seguridad */}
              <div className="text-center text-xs text-gray-500">
                <p>🔒 {locale === 'es' ? 'Pago seguro procesado por Bold' : 'Secure payment processed by Bold'}</p>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setPaymentStep('form')}
                className="flex-1 px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                ← {locale === 'es' ? 'Volver' : 'Back'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}
