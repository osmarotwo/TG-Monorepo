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
}: AppointmentMapSectionProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [hasCalculatedRoutes, setHasCalculatedRoutes] = useState(false)
  const [travelTimesData, setTravelTimesData] = useState<AppointmentWithLocation[]>([])
  const [timeConflicts, setTimeConflicts] = useState<TimeConflict[]>([])
  
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<(google.maps.Marker | google.maps.marker.AdvancedMarkerElement)[]>([])
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const isInitializingRef = useRef(false)

  // Combinar appointments con locations - usar ref para evitar re-renders
  const appointmentsWithDetails = React.useMemo(() => {
    return appointments.map((apt) => ({
      ...apt,
      location: locations.find((loc) => loc.locationId === apt.locationId),
    }))
  }, [appointments, locations])

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
      if (validLocations.length === 0) {
        isInitializingRef.current = false
        return
      }

      const centerLat =
        validLocations.reduce((sum, apt) => sum + (apt.location?.latitude || 0), 0) /
        validLocations.length
      const centerLng =
        validLocations.reduce((sum, apt) => sum + (apt.location?.longitude || 0), 0) /
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
          userInfoWindow.open({
            anchor: userMarker,
            map,
          })
        })
      }

      // Add appointment markers (red) with numbers - usando AdvancedMarkerElement
      validLocations.forEach((apt, index) => {
        if (!apt.location) return

        // Crear elemento HTML personalizado para cada marcador
        const pin = document.createElement('div')
        pin.className = 'appointment-marker'
        pin.innerHTML = `
          <div style="
            width: 48px;
            height: 48px;
            background-color: #DC2626;
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
            ${index + 1}
          </div>
        `

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: apt.location.latitude, lng: apt.location.longitude },
          content: pin,
          title: `${apt.serviceType} - ${apt.location.name}`,
        })

        markersRef.current.push(marker)

        // InfoWindow content
        const date = new Date(apt.startTime)
        const timeStr = date.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const dateStr = date.toLocaleDateString('es-CO', {
          month: 'short',
          day: 'numeric',
        })

        const infoContent = `
          <div style="padding: 12px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #DC2626;">
              ${index + 1}. ${apt.location.name}
            </div>
            <div style="margin-bottom: 4px; color: #1F2937;">
              <strong style="color: #374151;">Servicio:</strong> ${apt.serviceType}
            </div>
            <div style="margin-bottom: 4px; color: #1F2937;">
              <strong style="color: #374151;">Fecha:</strong> ${dateStr} ${timeStr}
            </div>
            <div style="margin-bottom: 4px; color: #1F2937;">
              <strong style="color: #374151;">Especialista:</strong> ${apt.specialistName}
            </div>
            <div style="color: #4B5563; font-size: 13px; margin-top: 8px;">
              📍 ${apt.location.address}
            </div>
          </div>
        `

        const infoWindow = new google.maps.InfoWindow({
          content: infoContent,
        })

        marker.addListener('click', () => {
          infoWindow.open({
            anchor: marker,
            map,
          })
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
        location: new window.google.maps.LatLng(apt.location!.latitude, apt.location!.longitude),
        stopover: true,
      }))

    if (waypoints.length === 0) return

    // Calculate route from user location through all appointments
    const origin = new window.google.maps.LatLng(userLoc.lat, userLoc.lng)
    const destination = waypoints[waypoints.length - 1].location

    const request: any = {
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

          // Calcular conflictos de tiempo
          const conflicts: TimeConflict[] = []
          for (let i = 0; i < timesData.length - 1; i++) {
            const current = timesData[i]
            const next = timesData[i + 1]
            
            if (!current.estimatedDuration || !next.travelTimeMinutes) continue
            
            // Tiempo disponible entre fin de cita actual e inicio de siguiente
            const currentEnd = new Date(current.endTime).getTime()
            const nextStart = new Date(next.startTime).getTime()
            const availableMinutes = Math.floor((nextStart - currentEnd) / (60 * 1000))
            
            // Tiempo requerido (viaje)
            const requiredMinutes = next.travelTimeMinutes
            
            // Verificar si hay conflicto
            if (availableMinutes < requiredMinutes) {
              const shortfall = requiredMinutes - availableMinutes
              conflicts.push({
                fromAppointment: current,
                toAppointment: next,
                required: requiredMinutes,
                available: availableMinutes,
                shortfall: shortfall,
              })
              
              // Marcar la cita siguiente como no alcanzable
              timesData[i + 1].isReachable = false
              timesData[i + 1].conflictMessage = `⚠️ Faltan ${shortfall} min para llegar a tiempo`
            } else {
              timesData[i + 1].isReachable = true
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
                      {isConflicted && (
                        <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">
                          ⚠️ No alcanzable
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">{apt.serviceType}</div>
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
                  apt.location.latitude,
                  apt.location.longitude
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
                    prevApt.location.latitude,
                    prevApt.location.longitude,
                    apt.location.latitude,
                    apt.location.longitude
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
