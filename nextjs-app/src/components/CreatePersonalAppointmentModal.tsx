'use client'

import { useState, useEffect, useCallback } from 'react'
import { useLocale } from '@/contexts/LocaleContext'
import { useAuth } from '@/contexts/AuthContext'

interface CreatePersonalAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function CreatePersonalAppointmentModal({ 
  isOpen, 
  onClose, 
  onSuccess
}: CreatePersonalAppointmentModalProps) {
  const { t, locale } = useLocale()
  const { user } = useAuth()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    address: '',
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  })
  
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false)
  const [geocodingError, setGeocodingError] = useState<string | null>(null)
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [mapMarker, setMapMarker] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleMapsReady, setIsGoogleMapsReady] = useState(false)

  // Check if Google Maps is fully loaded
  const checkGoogleMapsReady = useCallback(() => {
    if (typeof window === 'undefined') return false
    
    const google = (window as any).google
    return !!(
      google &&
      google.maps &&
      google.maps.places &&
      google.maps.places.AutocompleteService &&
      google.maps.Geocoder &&
      google.maps.marker &&
      google.maps.marker.AdvancedMarkerElement
    )
  }, [])

  // Wait for Google Maps to load
  useEffect(() => {
    if (isOpen) {
      const checkInterval = setInterval(() => {
        if (checkGoogleMapsReady()) {
          setIsGoogleMapsReady(true)
          clearInterval(checkInterval)
          console.log('✅ Google Maps API completamente cargada')
        }
      }, 100)

      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(checkInterval)
        if (!checkGoogleMapsReady()) {
          console.error('❌ Timeout esperando Google Maps API')
        }
      }, 10000)

      return () => {
        clearInterval(checkInterval)
        clearTimeout(timeout)
      }
    }
  }, [isOpen, checkGoogleMapsReady])

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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        address: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: ''
      })
      setCoordinates(null)
      setGeocodingError(null)
      setAddressSuggestions([])
      setShowSuggestions(false)
      setShowMapPicker(false)
      setMapInstance(null)
      setMapMarker(null)
      setErrors({})
      setIsGoogleMapsReady(false)
    }
  }, [isOpen])

  // Initialize map when map picker is shown
  useEffect(() => {
    if (showMapPicker && isGoogleMapsReady) {
      const mapContainer = document.getElementById('map-picker-container')
      if (!mapContainer || mapInstance) return

      // Default center (Colombia)
      const defaultCenter = coordinates || { lat: 4.711, lng: -74.0721 }

      const map = new (window as any).google.maps.Map(mapContainer, {
        center: defaultCenter,
        zoom: coordinates ? 15 : 12,
        mapId: 'APPOINTMENT_MAP_PICKER', // Required for AdvancedMarkerElement
      })

      setMapInstance(map)

      // Add click listener to map
      map.addListener('click', (e: any) => {
        const clickedLocation = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
        }

        // Update coordinates
        setCoordinates(clickedLocation)

        // Remove existing marker
        if (mapMarker) {
          mapMarker.map = null
        }

        // Create new marker
        const markerPin = document.createElement('div')
        markerPin.innerHTML = `
          <div style="
            background-color: #13a4ec;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            📍
          </div>
        `

        const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
          map,
          position: clickedLocation,
          content: markerPin,
          title: 'Ubicación seleccionada',
        })

        setMapMarker(marker)

        // Reverse geocode to get address
        const geocoder = new (window as any).google.maps.Geocoder()
        geocoder.geocode({ location: clickedLocation }, (results: any[], status: string) => {
          if (status === 'OK' && results && results.length > 0) {
            const address = results[0].formatted_address
            setFormData(prev => ({ ...prev, address }))
            setGeocodingError(null)
          }
        })
      })

      // Add existing marker if coordinates are set
      if (coordinates) {
        const markerPin = document.createElement('div')
        markerPin.innerHTML = `
          <div style="
            background-color: #13a4ec;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            📍
          </div>
        `

        const marker = new (window as any).google.maps.marker.AdvancedMarkerElement({
          map,
          position: coordinates,
          content: markerPin,
          title: 'Ubicación seleccionada',
        })

        setMapMarker(marker)
      }
    }
  }, [showMapPicker, coordinates, isGoogleMapsReady])

  // Initialize Google Places Autocomplete Service
  const getAddressSuggestions = useCallback(async (input: string) => {
    if (!input || input.length < 3) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    if (!isGoogleMapsReady) {
      console.warn('⚠️ Google Maps API aún no está lista')
      return
    }

    setIsLoadingSuggestions(true)

    try {
      const autocompleteService = new (window as any).google.maps.places.AutocompleteService()
      
      autocompleteService.getPlacePredictions(
        {
          input: input,
          language: locale === 'es' ? 'es' : 'en',
        },
        (predictions: any[], status: string) => {
          if (status === 'OK' && predictions) {
            setAddressSuggestions(predictions.slice(0, 5))
            setShowSuggestions(true)
          } else {
            setAddressSuggestions([])
            setShowSuggestions(false)
          }
          setIsLoadingSuggestions(false)
        }
      )
    } catch (error) {
      console.error('❌ Error fetching address suggestions:', error)
      setAddressSuggestions([])
      setShowSuggestions(false)
      setIsLoadingSuggestions(false)
    }
  }, [locale, isGoogleMapsReady])

  // Debounced address suggestions
  useEffect(() => {
    if (!formData.address) {
      setAddressSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(() => {
      getAddressSuggestions(formData.address)
    }, 300) // Faster debounce for suggestions (300ms)

    return () => clearTimeout(timeoutId)
  }, [formData.address, getAddressSuggestions])

  // Geocoding function using Google Maps JavaScript API
  const geocodeAddress = useCallback(async (address: string) => {
    if (!address.trim()) {
      setCoordinates(null)
      setGeocodingError(null)
      return
    }

    if (!isGoogleMapsReady) {
      console.warn('⚠️ Google Maps API aún no está lista')
      setGeocodingError(locale === 'es' 
        ? 'Cargando servicio de mapas...' 
        : 'Loading maps service...')
      return
    }

    setIsGeocodingAddress(true)
    setGeocodingError(null)

    try {
      const geocoder = new (window as any).google.maps.Geocoder()
      
      geocoder.geocode({ address: address }, (results: any[], status: string) => {
        if (status === 'OK' && results && results.length > 0) {
          const location = results[0].geometry.location
          const lat = typeof location.lat === 'function' ? location.lat() : location.lat
          const lng = typeof location.lng === 'function' ? location.lng() : location.lng
          
          // Validate coordinates are valid numbers
          if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
            setCoordinates({ lat, lng })
            console.log('✅ Geocoding exitoso:', { address, lat, lng })
          } else {
            setGeocodingError(locale === 'es' 
              ? 'No se pudo obtener coordenadas válidas.' 
              : 'Could not get valid coordinates.')
            setCoordinates(null)
            console.warn('⚠️ Coordenadas inválidas:', { lat, lng })
          }
        } else {
          setGeocodingError(locale === 'es' 
            ? 'No se pudo encontrar la ubicación. Verifica la dirección.' 
            : 'Location not found. Please check the address.')
          setCoordinates(null)
          console.warn('⚠️ Geocoding falló:', status)
        }
        setIsGeocodingAddress(false)
      })
    } catch (error) {
      console.error('❌ Error en geocoding:', error)
      setGeocodingError(locale === 'es' 
        ? 'Error al buscar la ubicación. Intenta de nuevo.' 
        : 'Error finding location. Please try again.')
      setCoordinates(null)
      setIsGeocodingAddress(false)
    }
  }, [locale, isGoogleMapsReady])

  // Select a suggestion from the dropdown
  const handleSelectSuggestion = (suggestion: any) => {
    const selectedAddress = suggestion.description
    setFormData(prev => ({ ...prev, address: selectedAddress }))
    setShowSuggestions(false)
    setAddressSuggestions([])
    
    // Immediately geocode the selected address
    geocodeAddress(selectedAddress)
  }

  // Debounced geocoding when address changes (only if not selecting from suggestions)
  useEffect(() => {
    if (!formData.address || showSuggestions) {
      return
    }

    const timeoutId = setTimeout(() => {
      geocodeAddress(formData.address)
    }, 1000) // Wait 1s after user stops typing if not using suggestions

    return () => clearTimeout(timeoutId)
  }, [formData.address, geocodeAddress, showSuggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.address-autocomplete-container')) {
        setShowSuggestions(false)
      }
    }

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSuggestions])

  if (!isOpen) return null

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  // Get minimum time for time pickers based on selected date
  const getMinTime = (): string | undefined => {
    if (!formData.date) return undefined

    const today = new Date()
    const colombiaTime = new Date(today.toLocaleString('en-US', { timeZone: 'America/Bogota' }))
    const todayStr = colombiaTime.toISOString().split('T')[0]

    // If selected date is today, return current time
    if (formData.date === todayStr) {
      const hours = colombiaTime.getHours().toString().padStart(2, '0')
      const minutes = colombiaTime.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }

    // For future dates, no minimum
    return undefined
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required fields
    if (!formData.title.trim()) {
      newErrors.title = locale === 'es' ? 'El título es requerido' : 'Title is required'
    }
    if (!formData.address.trim()) {
      newErrors.address = locale === 'es' ? 'La dirección es requerida' : 'Address is required'
    }
    if (!formData.date) {
      newErrors.date = locale === 'es' ? 'La fecha es requerida' : 'Date is required'
    } else {
      // Validate date is not in the past
      const selectedDate = new Date(formData.date + 'T00:00:00')
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        newErrors.date = locale === 'es' ? 'La fecha no puede estar en el pasado' : 'Date cannot be in the past'
      }
    }
    if (!formData.startTime) {
      newErrors.startTime = locale === 'es' ? 'La hora de inicio es requerida' : 'Start time is required'
    }
    if (!formData.endTime) {
      newErrors.endTime = locale === 'es' ? 'La hora de fin es requerida' : 'End time is required'
    }

    // Validate end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`)
      const end = new Date(`2000-01-01T${formData.endTime}`)
      if (end <= start) {
        newErrors.endTime = locale === 'es' 
          ? 'La hora de fin debe ser posterior a la hora de inicio' 
          : 'End time must be after start time'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Personal appointment submit called')
    console.log('📋 Form data:', formData)
    console.log('📍 Coordinates:', coordinates)

    if (!validate() || !user) {
      console.log('❌ Validation failed or no user')
      return
    }

    console.log('✅ Validation passed, starting submission...')
    setIsSubmitting(true)

    try {
      // Validate coordinates
      const hasValidCoordinates = coordinates && 
        typeof coordinates.lat === 'number' && 
        typeof coordinates.lng === 'number' &&
        !isNaN(coordinates.lat) && 
        !isNaN(coordinates.lng)
      
      const appointmentData = {
        userId: user.userId,
        title: formData.title,
        description: formData.description,
        address: formData.address,
        latitude: hasValidCoordinates ? coordinates.lat : null,
        longitude: hasValidCoordinates ? coordinates.lng : null,
        date: formData.date,
        startTime: formData.startTime, // Send as HH:MM format
        endTime: formData.endTime,     // Send as HH:MM format
        notes: formData.notes
      }
      
      console.log('📤 Sending personal appointment data:', appointmentData)
      
      const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL
      const response = await fetch(`${API_BASE_URL}/api/appointments/personal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Conflict - time slot occupied
          setErrors({ 
            startTime: data.message || (locale === 'es' 
              ? 'Este horario se solapa con otra cita existente' 
              : 'This time slot conflicts with an existing appointment')
          })
          setIsSubmitting(false)
          return
        }
        throw new Error(data.message || 'Error creating personal appointment')
      }
      
      console.log('✅ Personal appointment created successfully:', data)
      
      // Call success callback
      if (onSuccess) {
        onSuccess()
      }
      
      // Close modal
      onClose()
    } catch (error) {
      console.error('❌ Error creating personal appointment:', error)
      setErrors({ 
        submit: locale === 'es' 
          ? 'Error al crear la cita personal. Por favor intenta nuevamente.' 
          : 'Error creating personal appointment. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {locale === 'es' ? '📝 Crear Cita Personal' : '📝 Create Personal Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              {locale === 'es' ? 'Título' : 'Title'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 placeholder-gray-400 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={locale === 'es' ? 'Ej: Reunión con cliente' : 'e.g., Client meeting'}
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              {locale === 'es' ? 'Descripción' : 'Description'}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 placeholder-gray-400"
              rows={3}
              placeholder={locale === 'es' ? 'Detalles opcionales...' : 'Optional details...'}
            />
          </div>

          {/* Address */}
          <div className="relative address-autocomplete-container">
            <label className="block text-sm font-medium text-gray-900 mb-1">
              {locale === 'es' ? 'Dirección' : 'Address'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => {
                  handleChange('address', e.target.value)
                  setCoordinates(null) // Reset coordinates when typing
                  setGeocodingError(null)
                }}
                onFocus={() => {
                  if (addressSuggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 placeholder-gray-400 ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={locale === 'es' ? 'Ej: Calle 45 #123-45, Bogotá' : 'e.g., 123 Main St, City'}
                autoComplete="off"
              />
              {(isLoadingSuggestions || isGeocodingAddress) && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#13a4ec]"></div>
                </div>
              )}
            </div>

            {/* Address Suggestions Dropdown */}
            {showSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {addressSuggestions.map((suggestion, index) => (
                  <button
                    key={suggestion.place_id}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors flex items-start gap-3 ${
                      index !== addressSuggestions.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                  >
                    <span className="text-[#13a4ec] mt-0.5">📍</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {suggestion.structured_formatting?.main_text || suggestion.description}
                      </p>
                      {suggestion.structured_formatting?.secondary_text && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {suggestion.structured_formatting.secondary_text}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
            
            {/* Google Maps Loading Indicator */}
            {!isGoogleMapsReady && isOpen && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#13a4ec] mt-0.5"></div>
                <p className="text-sm text-blue-800">
                  {locale === 'es' ? 'Cargando servicio de mapas...' : 'Loading maps service...'}
                </p>
              </div>
            )}
            
            {/* Toggle Map Picker */}
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                disabled={!isGoogleMapsReady}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  isGoogleMapsReady 
                    ? 'text-[#13a4ec] hover:text-[#0f8fcd]' 
                    : 'text-gray-400 cursor-not-allowed'
                }`}
              >
                <span>{showMapPicker ? '🗺️' : '📍'}</span>
                <span>
                  {showMapPicker 
                    ? (locale === 'es' ? 'Ocultar mapa' : 'Hide map')
                    : (locale === 'es' ? 'Seleccionar en mapa' : 'Select on map')}
                </span>
              </button>
            </div>

            {/* Map Picker */}
            {showMapPicker && (
              <div className="mt-3">
                <div 
                  id="map-picker-container" 
                  className="w-full h-80 rounded-lg border border-gray-300 overflow-hidden"
                  style={{ minHeight: '320px' }}
                ></div>
                <p className="text-xs text-gray-600 mt-2">
                  {locale === 'es' 
                    ? '💡 Haz clic en el mapa para seleccionar la ubicación exacta' 
                    : '💡 Click on the map to select the exact location'}
                </p>
              </div>
            )}
            
            {/* Geocoding Success */}
            {coordinates && !isGeocodingAddress && !showSuggestions && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-green-600 text-sm">✓</span>
                <div className="flex-1">
                  <p className="text-sm text-green-800 font-medium">
                    {locale === 'es' ? 'Ubicación encontrada' : 'Location found'}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    {locale === 'es' ? 'Coordenadas:' : 'Coordinates:'} {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
            
            {/* Geocoding Error */}
            {geocodingError && !isGeocodingAddress && !showSuggestions && (
              <div className="mt-2 flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span className="text-yellow-600 text-sm">⚠️</span>
                <p className="text-sm text-yellow-800">{geocodingError}</p>
              </div>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              {locale === 'es' ? 'Fecha' : 'Date'} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 ${
                errors.date ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                {locale === 'es' ? 'Hora de Inicio' : 'Start Time'} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                min={getMinTime()}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 ${
                  errors.startTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                {locale === 'es' ? 'Hora de Fin' : 'End Time'} <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                min={formData.startTime || getMinTime()}
                className={`w-full px-3 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 ${
                  errors.endTime ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              {locale === 'es' ? 'Notas Adicionales' : 'Additional Notes'}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#13a4ec] text-gray-900 placeholder-gray-400"
              rows={2}
              placeholder={locale === 'es' ? 'Notas opcionales...' : 'Optional notes...'}
            />
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">ℹ️ {locale === 'es' ? 'Nota:' : 'Note:'}</span>{' '}
              {locale === 'es' 
                ? 'Las citas personales no pueden ser reprogramadas automáticamente por el sistema de optimización de rutas.' 
                : 'Personal appointments cannot be automatically rescheduled by the route optimization system.'}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              {locale === 'es' ? 'Cancelar' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (locale === 'es' ? 'Creando...' : 'Creating...') 
                : (locale === 'es' ? 'Crear Cita Personal' : 'Create Personal Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
