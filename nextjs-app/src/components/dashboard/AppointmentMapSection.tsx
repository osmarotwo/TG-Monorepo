/**
 * AppointmentMapSection Component
 * Mapa especializado para mostrar citas con:
 * - Marcadores rojos con información de cita
 * - Time to arrival desde ubicación del usuario
 * - Rutas entre citas consecutivas
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Location } from '@/services/api/locations'
import { Appointment } from '@/services/api/appointments'

interface AppointmentMapSectionProps {
  appointments: Appointment[]
  locations: Location[]
  height?: string
  selectedDate?: string
  onDateChange?: (date: string) => void
}

interface AppointmentWithLocation extends Appointment {
  location?: Location
  travelTimeFromUser?: string
  travelTimeFromPrevious?: string
  distanceFromUser?: string
  distanceFromPrevious?: string
  travelTimeMinutes?: number // Tiempo de viaje en minutos
  isReachable?: boolean // Si es viable llegar a tiempo
  conflictMessage?: string // Mensaje de alerta si hay conflicto
}

interface TimeConflict {
  fromAppointment: AppointmentWithLocation
  toAppointment: AppointmentWithLocation
  required: number // Tiempo requerido (servicio + viaje)
  available: number // Tiempo disponible entre citas
  shortfall: number // Diferencia (minutos que faltan)
}

export default function AppointmentMapSection({
  appointments,
  locations,
  height = 'h-96',
  selectedDate: selectedDateProp,
  onDateChange,
}: AppointmentMapSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [hasCalculatedRoutes, setHasCalculatedRoutes] = useState(false)
  const [travelTimesData, setTravelTimesData] = useState<AppointmentWithLocation[]>([])
  const [timeConflicts, setTimeConflicts] = useState<TimeConflict[]>([])
  
  // Usar estado del padre si existe, sino usar estado local
  const selectedDate = selectedDateProp || 'all';
  const setSelectedDate = onDateChange || (() => {});
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<(google.maps.Marker | google.maps.marker.AdvancedMarkerElement)[]>([])
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const activeInfoWindowRef = useRef<google.maps.InfoWindow | null>(null)
  const isInitializingRef = useRef(false)

  // Filtrar citas por la fecha seleccionada
  const filteredAppointments = React.useMemo(() => {
    console.log('🔍 AppointmentMapSection - Filtrando citas:', {
      totalAppointments: appointments.length,
      selectedDate,
      appointmentsData: appointments.map(a => ({
        id: a.appointmentId,
        type: a.type,
        date: a.date,
        startTime: a.startTime,
        hasLocation: !!(a.address || (a.coordinates?.lat && a.coordinates?.lng))
      }))
    })
    
    // Si selectedDate es 'all', mostrar todas las citas
    if (selectedDate === 'all') {
      console.log('📅 Mostrando TODAS las citas:', appointments.length)
      return appointments
    }
    
    const filtered = appointments.filter(apt => {
      const aptDate = apt.date || apt.startTime?.split('T')[0]
      const matches = aptDate === selectedDate
      
      // Log detallado para cada cita
      if (!matches) {
        console.log(`❌ Cita NO coincide - aptDate: "${aptDate}" vs selectedDate: "${selectedDate}"`, {
          id: apt.appointmentId,
          type: apt.type,
          date: apt.date,
          startTime: apt.startTime,
          calculated_aptDate: aptDate,
          selectedDate: selectedDate,
          comparison: `"${aptDate}" === "${selectedDate}" = ${aptDate === selectedDate}`
        })
      } else {
        console.log(`✅ Cita coincide:`, {
          id: apt.appointmentId,
          aptDate,
          type: apt.type,
          title: apt.title || apt.serviceType
        })
      }
      
      return matches
    })
    
    console.log('📅 Resultado del filtro:', {
      selectedDate,
      filtered: filtered.length,
      total: appointments.length
    })
    
    return filtered
  }, [appointments, selectedDate])

  // Combinar appointments con locations - usar ref para evitar re-renders
  const appointmentsWithDetails = React.useMemo(() => {
    return filteredAppointments.map((apt) => {
      // Citas personales tienen coordenadas directas
      if (apt.type === 'personal' && apt.coordinates) {
        return {
          ...apt,
          location: {
            locationId: 'personal',
            businessId: '',
            name: apt.title || 'Personal Appointment',
            address: apt.address || 'Dirección no disponible', // Mantener como string
            coordinates: apt.coordinates,
            isPrimary: false,
            createdAt: apt.createdAt || '',
            updatedAt: apt.updatedAt || ''
          }
        }
      }
      
      // Citas de negocio: usar datos embebidos de la cita (vienen de DynamoDB)
      // o buscar en locations array como fallback
      const locationFromArray = locations.find((loc) => loc.locationId === apt.locationId)
      
      return {
        ...apt,
        location: locationFromArray || {
          locationId: apt.locationId || '',
          businessId: apt.businessId || '',
          name: apt.locationName || apt.businessName || 'Ubicación',
          address: apt.address || 'Dirección no disponible', // Usar address de la cita
          coordinates: apt.coordinates || { lat: 0, lng: 0 },
          isPrimary: false,
          createdAt: apt.createdAt || '',
          updatedAt: apt.updatedAt || ''
        }
      }
    })
  }, [filteredAppointments, locations])

  // Obtener ubicación del usuario - SOLO UNA VEZ
  useEffect(() => {
    let mounted = true
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (mounted) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          }
        },
        () => {
          // Usuario denegó permisos o error - usar Bogotá por defecto
          if (mounted) {
            setUserLocation({ lat: 4.711, lng: -74.073 })
          }
        },
        { timeout: 5000, maximumAge: 300000 } // Cache por 5 minutos
      )
    } else {
      setUserLocation({ lat: 4.711, lng: -74.073 })
    }

    return () => {
      mounted = false
    }
  }, []) // Solo ejecutar una vez al montar

  // Reset route calculation when date changes
  useEffect(() => {
    setHasCalculatedRoutes(false)
    setTravelTimesData([])
    setTimeConflicts([])
  }, [selectedDate])

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      setMapError('Google Maps API key no configurada')
      return
    }

    if (window.google?.maps?.Map) {
      setIsLoaded(true)
      return
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]')

    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkInterval)
          setIsLoaded(true)
        }
      }, 100)

      setTimeout(() => clearInterval(checkInterval), 10000)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`
    script.async = true
    script.defer = true
    script.id = 'google-maps-script'
    
    script.onerror = () => {
      setMapError('Error al cargar Google Maps. Verifica tu API key y cuota.')
    }
    
    script.onload = () => {
      const checkInterval = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(checkInterval)
          setIsLoaded(true)
        }
      }, 100)

      setTimeout(() => {
        clearInterval(checkInterval)
        if (!window.google?.maps?.Map) {
          setMapError('Google Maps no se cargó correctamente')
        }
      }, 10000)
    }
    
    document.head.appendChild(script)
  }, [])

  // Update markers when filtered appointments change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    
    console.log('🔄 Actualizando marcadores para fecha:', selectedDate);
    console.log('📍 Citas filtradas:', filteredAppointments.length);
    
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      if ('setMap' in marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      } else if ('map' in marker) {
        (marker as google.maps.marker.AdvancedMarkerElement).map = null;
      }
    });
    markersRef.current = [];
    
    // Clear existing routes
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null);
      directionsRendererRef.current = null;
    }
    
    // Reset routes calculation flag
    setHasCalculatedRoutes(false);
    
    // Re-add user marker if exists
    if (userLocation) {
      const userPin = document.createElement('div');
      userPin.className = 'user-location-marker';
      userPin.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background-color: #4285F4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        "></div>
      `;

      const userMarker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: userLocation,
        content: userPin,
        title: 'Tu ubicación',
      });
      
      markersRef.current.push(userMarker);
    }
    
    // Add markers for filtered appointments
    const validLocations = appointmentsWithDetails.filter((apt) => apt.location);
    
    validLocations.forEach((apt, index) => {
      const position = {
        lat: apt.location!.latitude,
        lng: apt.location!.longitude,
      };

      const pinElement = document.createElement('div');
      pinElement.className = 'custom-pin';
      
      const bgColor = apt.type === 'personal' ? '#8B5CF6' : '#DC2626';
      
      pinElement.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background-color: ${bgColor};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: white;
          font-size: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          cursor: pointer;
        ">
          ${index + 1}
        </div>
      `;

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: position,
        content: pinElement,
        title: apt.location!.name,
      });

      markersRef.current.push(marker);

      // InfoWindow
      const serviceOrTitle = apt.type === 'personal' ? (apt.title || 'Cita Personal') : (apt.serviceType || 'Servicio');
      const date = apt.startTime ? new Date(apt.startTime) : new Date();
      const timeStr = apt.time || date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const dateStr = apt.date || date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' });

      const infoContent = `
        <div style="padding: 12px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${bgColor};">
            ${index + 1}. ${apt.location!.name}
          </div>
          ${apt.type === 'personal' ? `
            <div style="display: inline-block; background-color: #8B5CF6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
              📝 Personal
            </div>
          ` : ''}
          <div style="margin-bottom: 4px; color: #1F2937;">
            <strong style="color: #374151;">${apt.type === 'personal' ? 'Evento' : 'Servicio'}:</strong> ${serviceOrTitle}
          </div>
          <div style="margin-bottom: 4px; color: #1F2937;">
            <strong style="color: #374151;">Fecha:</strong> ${dateStr} ${timeStr}
          </div>
          <div style="color: #4B5563; font-size: 13px; margin-top: 8px;">
            📍 ${apt.location!.address}
          </div>
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: infoContent });
      marker.addListener('click', () => {
        infoWindow.open({ anchor: marker, map: mapInstanceRef.current });
      });
    });
    
  }, [selectedDate, filteredAppointments, appointmentsWithDetails, isLoaded, userLocation]);

  // Calculate routes when userLocation becomes available
  useEffect(() => {
    // Si ya tenemos mapa, ubicación del usuario, y no hemos calculado rutas
    if (mapInstanceRef.current && userLocation && !hasCalculatedRoutes && appointmentsWithDetails.length > 0) {
      const validLocations = appointmentsWithDetails.filter((apt) => apt.location)
      
      if (validLocations.length > 0) {
        calculateRoutes(mapInstanceRef.current, userLocation, validLocations)
        setHasCalculatedRoutes(true)
      }
    }
  }, [userLocation, hasCalculatedRoutes, appointmentsWithDetails])

  // Initialize map and markers - MEJORADO PARA EVITAR RE-RENDERS
  useEffect(() => {
    // Prevenir múltiples inicializaciones
    if (isInitializingRef.current) return
    if (!isLoaded || !mapRef.current || appointmentsWithDetails.length === 0) return
    if (mapInstanceRef.current) return // Ya existe el mapa

    isInitializingRef.current = true

    try {
      // Calculate center
      const validLocations = appointmentsWithDetails.filter((apt) => apt.location)
      
      console.log('🗺️ Creating map with appointments:', {
        total: appointmentsWithDetails.length,
        withLocation: validLocations.length,
        details: appointmentsWithDetails.map(apt => ({
          id: apt.appointmentId,
          type: apt.type,
          title: apt.title,
          hasLocation: !!apt.location,
          locationName: apt.location?.name,
          coords: apt.location ? `${apt.location.coordinates.lat}, ${apt.location.coordinates.lng}` : 'none'
        }))
      })
      
      if (validLocations.length === 0) {
        console.warn('⚠️ No valid locations found for map')
        isInitializingRef.current = false
        return
      }

      const centerLat =
        validLocations.reduce((sum, apt) => sum + (apt.location?.coordinates.lat || 0), 0) /
        validLocations.length
      const centerLng =
        validLocations.reduce((sum, apt) => sum + (apt.location?.coordinates.lng || 0), 0) /
        validLocations.length

      // Crear mapa solo si no existe
      const map = new google.maps.Map(mapRef.current, {
        zoom: 12,
        center: { lat: centerLat, lng: centerLng },
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapId: 'APPOINTMENT_MAP', // Requerido para AdvancedMarkerElement
      })

      mapInstanceRef.current = map

      // Clear previous markers
      markersRef.current.forEach((marker) => {
        if ('setMap' in marker && typeof marker.setMap === 'function') {
          marker.setMap(null) // Old API
        } else if ('map' in marker) {
          (marker as google.maps.marker.AdvancedMarkerElement).map = null // New API
        }
      })
      markersRef.current = []

      // Add user location marker (blue) - usando AdvancedMarkerElement
      if (userLocation) {
        // Crear elemento HTML personalizado para el marcador de usuario
        const userPin = document.createElement('div')
        userPin.className = 'user-location-marker'
        userPin.innerHTML = `
          <div style="
            width: 24px;
            height: 24px;
            background-color: #4285F4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">
            📍
          </div>
        `

        const userMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: userLocation,
          content: userPin,
          title: 'Tu ubicación',
        })

        markersRef.current.push(userMarker)

        const userInfoWindow = new google.maps.InfoWindow({
          content: `<div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;"><strong style="color: #1F2937;">📍 Tu ubicación</strong></div>`,
        })

        userMarker.addListener('click', () => {
          // Cerrar el InfoWindow anterior si existe
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close()
          }
          
          // Abrir el nuevo InfoWindow
          userInfoWindow.open({
            anchor: userMarker,
            map,
          })
          
          // Guardar referencia al InfoWindow activo
          activeInfoWindowRef.current = userInfoWindow
        })
      }

      // Add appointment markers (red for business, purple for personal) with numbers - usando AdvancedMarkerElement
      validLocations.forEach((apt, index) => {
        if (!apt.location) return

        const isPersonal = apt.type === 'personal'
        const markerColor = isPersonal ? '#8B5CF6' : '#DC2626' // Purple for personal, red for business
        const serviceOrTitle = apt.type === 'personal' ? apt.title : apt.serviceType

        // Crear elemento HTML personalizado para cada marcador
        const pin = document.createElement('div')
        pin.className = 'appointment-marker'
        pin.innerHTML = `
          <div style="
            width: 48px;
            height: 48px;
            background-color: ${markerColor};
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: bold;
            color: white;
            cursor: pointer;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
            ${isPersonal ? '📝' : (index + 1)}
          </div>
        `

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: apt.location.coordinates.lat, lng: apt.location.coordinates.lng },
          content: pin,
          title: `${serviceOrTitle} - ${apt.location.name}`,
        })

        markersRef.current.push(marker)

        // InfoWindow content
        const date = apt.startTime ? new Date(apt.startTime) : new Date()
        const timeStr = apt.time || date.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const dateStr = apt.date || date.toLocaleDateString('es-CO', {
          month: 'short',
          day: 'numeric',
        })

        // Formatear dirección correctamente
        const addressStr = typeof apt.location.address === 'string' 
          ? apt.location.address 
          : apt.location.address?.street || 'Dirección no disponible'

        const infoContent = `
          <div style="padding: 12px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: ${isPersonal ? '#8B5CF6' : '#DC2626'};">
              ${isPersonal ? '📝' : (index + 1) + '.'} ${apt.location.name}
            </div>
            ${apt.type === 'personal' ? `
              <div style="display: inline-block; background-color: #8B5CF6; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; margin-bottom: 8px;">
                Cita Personal
              </div>
            ` : ''}
            <div style="margin-bottom: 4px; color: #1F2937;">
              <strong style="color: #374151;">${apt.type === 'personal' ? 'Evento' : 'Servicio'}:</strong> ${serviceOrTitle || 'Sin especificar'}
            </div>
            <div style="margin-bottom: 4px; color: #1F2937;">
              <strong style="color: #374151;">Fecha:</strong> ${dateStr} ${timeStr}
            </div>
            ${apt.specialistName ? `
              <div style="margin-bottom: 4px; color: #1F2937;">
                <strong style="color: #374151;">Especialista:</strong> ${apt.specialistName}
              </div>
            ` : ''}
            <div style="color: #4B5563; font-size: 13px; margin-top: 8px;">
              📍 ${addressStr}
            </div>
          </div>
        `

        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
        })

        marker.addListener('click', () => {
          // Cerrar el InfoWindow anterior si existe
          if (activeInfoWindowRef.current) {
            activeInfoWindowRef.current.close()
          }
          
          // Abrir el nuevo InfoWindow
          infoWindow.open({
            anchor: marker,
            map,
          })
          
          // Guardar referencia al InfoWindow activo
          activeInfoWindowRef.current = infoWindow
        })
      })

      // Calculate and display routes if we have user location
      if (userLocation && validLocations.length > 0 && !hasCalculatedRoutes) {
        calculateRoutes(map, userLocation, validLocations)
        setHasCalculatedRoutes(true)
      }

      isInitializingRef.current = false
    } catch (error) {
      console.error('Error initializing map:', error)
      isInitializingRef.current = false
      setMapError('Error al inicializar el mapa')
    }
  }, [isLoaded, appointmentsWithDetails, userLocation, hasCalculatedRoutes]) // Dependencias controladas

  // Calculate routes and travel times
  const calculateRoutes = async (
    map: google.maps.Map,
    userLoc: { lat: number; lng: number },
    appointments: AppointmentWithLocation[]
  ) => {
    if (!window.google?.maps?.DirectionsService) {
      setMapError('no-directions-api')
      return
    }

    const directionsService = new window.google.maps.DirectionsService()

    // Clear previous directions
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
    }

    // Create waypoints from appointments
    const waypoints = appointments
      .filter((apt) => apt.location)
      .map((apt) => ({
        location: new window.google.maps.LatLng(apt.location!.coordinates.lat, apt.location!.coordinates.lng),
        stopover: true,
      }))

    if (waypoints.length === 0) return

    // Calculate route from user location through all appointments
    const origin = new window.google.maps.LatLng(userLoc.lat, userLoc.lng)
    const destination = waypoints[waypoints.length - 1].location

    const request: google.maps.DirectionsRequest = {
      origin,
      destination,
      waypoints: waypoints.slice(0, -1),
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false, // Mantener el orden de las citas
    }

    try {
      directionsService.route(request, (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === 'OK' && result && result.routes && result.routes[0]) {
          // ✅ SUCCESS: Usar datos reales de la API
          const directionsRenderer = new window.google.maps.DirectionsRenderer({
            map,
            directions: result,
            suppressMarkers: true, // Usar nuestros propios marcadores
            polylineOptions: {
              strokeColor: '#13a4ec',
              strokeOpacity: 0.7,
              strokeWeight: 4,
            },
          })

          directionsRendererRef.current = directionsRenderer

          // Extract travel times and distances
          const legs = result.routes[0].legs
          const timesData = appointments.map((apt, index) => {
            if (index === 0 && legs[0]) {
              // First appointment: from user
              return {
                ...apt,
                travelTimeFromUser: legs[0].duration?.text || 'N/A',
                distanceFromUser: legs[0].distance?.text || 'N/A',
                travelTimeMinutes: Math.ceil((legs[0].duration?.value || 0) / 60), // Convertir a minutos
                isReachable: true, // Primera cita siempre es alcanzable
              }
            } else if (index > 0 && legs[index]) {
              // Subsequent appointments: from previous
              const travelMinutes = Math.ceil((legs[index].duration?.value || 0) / 60)
              return {
                ...apt,
                travelTimeFromPrevious: legs[index].duration?.text || 'N/A',
                distanceFromPrevious: legs[index].distance?.text || 'N/A',
                travelTimeMinutes: travelMinutes,
              }
            }
            return apt
          })

          // 🔥 ORDENAR las citas cronológicamente antes de calcular conflictos
          const sortedTimesData = [...timesData].sort((a, b) => {
            return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          })

          // Calcular conflictos de tiempo usando el orden cronológico
          const conflicts: TimeConflict[] = []
          
          // Crear un mapa para encontrar el índice en timesData de cada cita
          const aptIndexMap = new Map<string, number>()
          timesData.forEach((apt, idx) => {
            aptIndexMap.set(apt.appointmentId, idx)
          })
          
          for (let i = 0; i < sortedTimesData.length - 1; i++) {
            const current = sortedTimesData[i]
            const next = sortedTimesData[i + 1]
            
            // 🔥 IMPORTANTE: Calcular el tiempo de viaje ENTRE estas dos citas consecutivas cronológicamente
            // No podemos usar next.travelTimeMinutes porque ese es el tiempo desde la cita ANTERIOR en la ruta del mapa
            // Necesitamos calcular la distancia real entre current y next
            
            if (!current.location || !next.location || !current.estimatedDuration) continue
            
            // Calcular distancia entre estas dos ubicaciones
            const lat1 = current.location.coordinates.lat
            const lng1 = current.location.coordinates.lng
            const lat2 = next.location.coordinates.lat
            const lng2 = next.location.coordinates.lng
            
            // Fórmula de Haversine para distancia
            const R = 6371 // Radio de la Tierra en km
            const dLat = (lat2 - lat1) * Math.PI / 180
            const dLng = (lng2 - lng1) * Math.PI / 180
            const a = 
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const distanceKm = R * c
            
            // Estimar tiempo de viaje (30 km/h promedio en ciudad)
            const travelTimeMinutes = Math.ceil((distanceKm / 30) * 60)
            
            // Tiempo disponible entre fin de cita actual e inicio de siguiente
            const currentEnd = new Date(current.endTime).getTime()
            const nextStart = new Date(next.startTime).getTime()
            const availableMinutes = Math.floor((nextStart - currentEnd) / (60 * 1000))
            
            // Verificar si hay conflicto
            if (availableMinutes < travelTimeMinutes) {
              const shortfall = travelTimeMinutes - availableMinutes
              conflicts.push({
                fromAppointment: current,
                toAppointment: next,
                required: travelTimeMinutes,
                available: availableMinutes,
                shortfall: shortfall,
              })
              
              // Marcar la cita como no alcanzable en timesData
              const nextIdx = aptIndexMap.get(next.appointmentId)
              if (nextIdx !== undefined) {
                timesData[nextIdx].isReachable = false
                timesData[nextIdx].conflictMessage = `⚠️ Faltan ${shortfall} min para llegar a tiempo`
              }
            } else {
              const nextIdx = aptIndexMap.get(next.appointmentId)
              if (nextIdx !== undefined) {
                timesData[nextIdx].isReachable = true
              }
            }
          }

          setTravelTimesData(timesData)
          setTimeConflicts(conflicts)
          setMapError(null) // Limpiar cualquier error previo
        } else if (status === 'OVER_QUERY_LIMIT' || status === 'REQUEST_DENIED') {
          // ⚠️ ERROR DE CUOTA: Activar fallback con cálculos aproximados
          console.warn('🚫 Directions API quota exceeded:', status)
          setMapError('quota-exceeded')
          setTravelTimesData([]) // Forzar uso de fallback
        } else {
          // Otros errores (ZERO_RESULTS, NOT_FOUND, etc.)
          console.warn('Could not calculate route:', status)
          setMapError('route-error')
          setTravelTimesData([])
        }
      })
    } catch (error) {
      console.warn('Error calculating route:', error)
      setMapError('route-error')
      setTravelTimesData([])
    }
  }

  if (mapError) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl ${height} flex items-center justify-center`}>
        <div className="text-center p-6 max-w-md">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-800 font-semibold mb-2">{mapError}</p>
          <p className="text-red-600 text-sm">
            Si has excedido la cuota gratuita de Google Maps, puedes:
          </p>
          <ul className="text-left text-red-600 text-sm mt-2 space-y-1">
            <li>• Habilitar facturación en Google Cloud Console</li>
            <li>• Usar una API key diferente</li>
            <li>• Esperar hasta mañana (se resetea diariamente)</li>
          </ul>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`bg-gray-100 rounded-xl ${height} flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#13a4ec] mx-auto mb-3"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  if (appointmentsWithDetails.length === 0) {
    return (
      <div className={`bg-gray-100 rounded-xl ${height} flex items-center justify-center`}>
        <p className="text-gray-600">No appointments to display</p>
      </div>
    )
  }

  // Función para calcular distancia aproximada (Haversine)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * (Math.PI / 180)
    const dLon = (lon2 - lon1) * (Math.PI / 180)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c // Distancia en km
  }

  // Estimar tiempo de viaje basado en distancia (promedio 30 km/h en ciudad)
  const estimateTime = (distanceKm: number): string => {
    const hours = distanceKm / 30 // Asumiendo 30 km/h en tráfico urbano
    const minutes = Math.round(hours * 60)
    if (minutes < 60) {
      return `~${minutes} mins`
    } else {
      const h = Math.floor(minutes / 60)
      const m = minutes % 60
      return `~${h}h ${m}m`
    }
  }

  return (
    <div className="space-y-4">
      {/* Date Selector */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <label htmlFor="route-date" className="text-sm font-medium text-gray-700 whitespace-nowrap">
            📅 Ver rutas para:
          </label>
          <select
            id="route-date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value)
              setHasCalculatedRoutes(false) // Reset para recalcular rutas
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent text-gray-900 bg-white"
          >
            <option value="all">📆 Todas las citas</option>
            {/* Generar opciones dinámicas basadas en las fechas de las citas */}
            {Array.from(new Set(appointments.map(apt => apt.date || apt.startTime?.split('T')[0]).filter(Boolean)))
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
                  <option key={date} value={date}>
                    {formatted}
                  </option>
                )
              })}
          </select>
          <span className="text-sm text-gray-600 whitespace-nowrap">
            {selectedDate === 'all' 
              ? `${filteredAppointments.length} citas`
              : `${filteredAppointments.length} cita${filteredAppointments.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      </div>



      {/* No appointments message */}
      {filteredAppointments.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">📅</div>
          <p className="text-blue-800 font-medium">No appointments scheduled for this date</p>
          <p className="text-blue-600 text-sm mt-1">Select a different date or create a new appointment</p>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className={`bg-gray-100 rounded-xl ${height} w-full`}></div>

      {/* Alerta de Conflictos de Tiempo */}
      {timeConflicts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-xl p-5 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                Conflictos de Tiempo Detectados
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Los siguientes trayectos no tienen tiempo suficiente considerando la duración del servicio y el tiempo de viaje:
              </p>
              <div className="space-y-2">
                {timeConflicts.map((conflict, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                    <div className="font-semibold text-red-900 text-sm">
                      {conflict.fromAppointment.location?.name} → {conflict.toAppointment.location?.name}
                    </div>
                    <div className="text-xs text-red-700 mt-1">
                      Tiempo disponible: <span className="font-medium">{conflict.available} min</span> | 
                      Tiempo necesario: <span className="font-medium">{conflict.required} min</span> | 
                      <span className="font-bold text-red-800"> Faltan {conflict.shortfall} minutos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Travel Times Summary - Con API de Directions (Por defecto) */}
      {travelTimesData.length > 0 && 
       travelTimesData.some((apt) => apt.travelTimeFromUser || apt.travelTimeFromPrevious) && 
       mapError !== 'quota-exceeded' && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">🚗 Tiempos de Desplazamiento</h3>
          <div className="space-y-3">
            {travelTimesData.map((apt, index) => {
              if (!apt.location) return null

              const isConflicted = apt.isReachable === false
              const markerColor = isConflicted ? 'bg-red-600' : 'bg-[#13a4ec]'
              const borderColor = isConflicted ? 'border-red-200 bg-red-50' : 'border-gray-100'

              return (
                <div key={apt.appointmentId} className={`flex items-start gap-3 pb-3 border-b last:border-0 ${borderColor}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${markerColor} text-white flex items-center justify-center font-bold text-sm`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">{apt.location.name}</div>
                      {apt.type === 'personal' && (
                        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-bold">
                          📝 Personal
                        </span>
                      )}
                      {isConflicted && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                          ⚠️ No alcanzable
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {apt.type === 'personal' ? apt.title : apt.serviceType}
                    </div>
                    {/* Mostrar fecha y hora */}
                    <div className="text-xs text-gray-500 mt-1">
                      📅 {apt.date} • ⏰ {apt.time || apt.startTime?.substring(11, 16)}
                      {apt.estimatedDuration && ` • ${apt.estimatedDuration} min`}
                    </div>
                    {index === 0 && apt.travelTimeFromUser && (
                      <div className="text-sm text-[#13a4ec] font-medium mt-1">
                        📍 Desde tu ubicación: {apt.travelTimeFromUser} ({apt.distanceFromUser})
                      </div>
                    )}
                    {index > 0 && apt.travelTimeFromPrevious && (
                      <div className={`text-sm font-medium mt-1 ${isConflicted ? 'text-red-600' : 'text-[#13a4ec]'}`}>
                        ➡️ Desde cita anterior: {apt.travelTimeFromPrevious} ({apt.distanceFromPrevious})
                      </div>
                    )}
                    {isConflicted && apt.conflictMessage && (
                      <div className="text-xs text-red-700 font-semibold mt-1 bg-red-100 px-2 py-1 rounded">
                        {apt.conflictMessage}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Travel Times Summary - Fallback SOLO cuando hay error de cuota */}
      {mapError === 'quota-exceeded' && 
       appointmentsWithDetails.length > 0 && 
       userLocation && (
        <div className="bg-white rounded-xl p-6 border-2 border-yellow-200">
          <div className="flex items-start gap-2 mb-4">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">🚗 Tiempos de Desplazamiento (Estimados)</h3>
              <p className="text-sm text-yellow-700 mt-1">
                Calculados en línea recta. Los tiempos reales pueden variar según el tráfico y las rutas.
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {appointmentsWithDetails.map((apt, index) => {
              if (!apt.location) return null

              // Calcular distancia desde ubicación del usuario (primera cita)
              let distanceKm = 0
              let timeEstimate = ''
              let travelMinutes = 0
              
              if (index === 0) {
                distanceKm = calculateDistance(
                  userLocation.lat,
                  userLocation.lng,
                  apt.location.coordinates.lat,
                  apt.location.coordinates.lng
                )
                timeEstimate = estimateTime(distanceKm)
                // Extraer minutos del estimado (formato: "X min")
                const match = timeEstimate.match(/(\d+)/)
                travelMinutes = match ? parseInt(match[1]) : 0
              } else {
                // Calcular distancia desde cita anterior
                const prevApt = appointmentsWithDetails[index - 1]
                if (prevApt?.location) {
                  distanceKm = calculateDistance(
                    prevApt.location.coordinates.lat,
                    prevApt.location.coordinates.lng,
                    apt.location.coordinates.lat,
                    apt.location.coordinates.lng
                  )
                  timeEstimate = estimateTime(distanceKm)
                  // Extraer minutos del estimado
                  const match = timeEstimate.match(/(\d+)/)
                  travelMinutes = match ? parseInt(match[1]) : 0
                }
              }

              // Detectar conflicto con tiempos estimados
              let isConflicted = false
              let conflictMessage = ''
              
              if (index > 0 && travelMinutes > 0) {
                const prevApt = appointmentsWithDetails[index - 1]
                const prevEnd = new Date(prevApt.endTime).getTime()
                const currentStart = new Date(apt.startTime).getTime()
                const availableMinutes = Math.floor((currentStart - prevEnd) / (60 * 1000))
                
                if (availableMinutes < travelMinutes) {
                  isConflicted = true
                  const shortfall = travelMinutes - availableMinutes
                  conflictMessage = `⚠️ Faltan ${shortfall} minutos (estimado)`
                }
              }

              const markerColor = isConflicted ? 'bg-red-600' : 'bg-yellow-600'
              const borderColor = isConflicted ? 'border-red-200 bg-red-50' : 'border-gray-100'

              return (
                <div key={apt.appointmentId} className={`flex items-start gap-3 pb-3 border-b last:border-0 ${borderColor}`}>
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${markerColor} text-white flex items-center justify-center font-bold text-sm`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-gray-900">{apt.location.name}</div>
                      {isConflicted && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                          ⚠️ No alcanzable
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{apt.serviceType}</div>
                    {index === 0 ? (
                      <div className="text-sm text-yellow-700 font-medium mt-1">
                        📍 Desde tu ubicación: {timeEstimate} (~{distanceKm.toFixed(1)} km en línea recta)
                      </div>
                    ) : (
                      <div className={`text-sm font-medium mt-1 ${isConflicted ? 'text-red-600' : 'text-yellow-700'}`}>
                        ➡️ Desde cita anterior: {timeEstimate} (~{distanceKm.toFixed(1)} km en línea recta)
                      </div>
                    )}
                    {isConflicted && conflictMessage && (
                      <div className="text-xs text-red-700 font-semibold mt-1 bg-red-100 px-2 py-1 rounded">
                        {conflictMessage}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            💡 <strong>Tip:</strong> Para ver rutas y tiempos exactos, configura una API key de Google Maps con cuota disponible.
          </div>
        </div>
      )}
    </div>
  )
}
