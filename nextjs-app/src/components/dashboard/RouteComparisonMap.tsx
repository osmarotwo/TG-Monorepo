/**
 * RouteComparisonMap
 * Muestra en un mismo mapa la ruta actual (roja) vs la ruta optimizada (verde)
 * Usa Google Directions API para mostrar rutas reales por carretera
 */

'use client'

import React, { useState, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, DirectionsRenderer } from '@react-google-maps/api'
import { RouteNode } from '@/services/optimization/types'

interface RouteComparisonMapProps {
  originalRoute: RouteNode[]
  optimizedRoute: RouteNode[]
  userLocation?: { lat: number; lng: number }
  height?: string
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export default function RouteComparisonMap({
  originalRoute,
  optimizedRoute,
  userLocation,
  height = 'h-[500px]',
}: RouteComparisonMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  })

  const [, setMap] = useState<google.maps.Map | null>(null)
  const [originalDirections, setOriginalDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [optimizedDirections, setOptimizedDirections] = useState<google.maps.DirectionsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Calcular centro del mapa
  const center = React.useMemo(() => {
    if (originalRoute.length === 0) {
      return userLocation || { lat: 4.711, lng: -74.073 }
    }
    const firstLocation = originalRoute[0].appointment.location
    return {
      lat: firstLocation.latitude,
      lng: firstLocation.longitude,
    }
  }, [originalRoute, userLocation])

  // Calcular rutas usando Directions API
  useEffect(() => {
    if (!isLoaded || originalRoute.length === 0 || optimizedRoute.length === 0) {
      return
    }

    const directionsService = new google.maps.DirectionsService()
    setLoading(true)
    setError(null)

    // Función helper para calcular una ruta
    const calculateRoute = async (
      route: RouteNode[],
      origin: { lat: number; lng: number }
    ): Promise<google.maps.DirectionsResult | null> => {
      if (route.length === 0) return null

      const waypoints = route.slice(0, -1).map((node) => ({
        location: {
          lat: node.appointment.location.latitude,
          lng: node.appointment.location.longitude,
        },
        stopover: true,
      }))

      const destination = {
        lat: route[route.length - 1].appointment.location.latitude,
        lng: route[route.length - 1].appointment.location.longitude,
      }

      try {
        const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
          directionsService.route(
            {
              origin,
              destination,
              waypoints,
              travelMode: google.maps.TravelMode.DRIVING,
              optimizeWaypoints: false, // NO optimizar, usar el orden dado
            },
            (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result)
              } else {
                reject(new Error(`Directions request failed: ${status}`))
              }
            }
          )
        })
        return result
      } catch (err) {
        console.error('Error calculating route:', err)
        return null
      }
    }

    // Calcular ambas rutas
    Promise.all([
      calculateRoute(originalRoute, userLocation || center),
      calculateRoute(optimizedRoute, userLocation || center),
    ])
      .then(([original, optimized]) => {
        setOriginalDirections(original)
        setOptimizedDirections(optimized)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error calculating routes:', err)
        setError('Error al calcular rutas')
        setLoading(false)
      })
  }, [isLoaded, originalRoute, optimizedRoute, userLocation, center])

  if (!isLoaded) {
    return (
      <div className={`${height} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13a4ec] mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Cargando mapa...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${height} bg-red-50 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-medium mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-600">Intenta recargar la página</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${height} rounded-lg overflow-hidden border-2 border-gray-200 relative`}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={11}
        onLoad={setMap}
        options={{
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: true,
        }}
      >
        {/* Ruta ORIGINAL (roja) */}
        {originalDirections && (
          <DirectionsRenderer
            directions={originalDirections}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#EF4444',
                strokeOpacity: 0.6,
                strokeWeight: 5,
              },
              markerOptions: {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: '#EF4444',
                  fillOpacity: 0.8,
                  strokeColor: '#DC2626',
                  strokeWeight: 2,
                },
              },
            }}
          />
        )}

        {/* Ruta OPTIMIZADA (verde) */}
        {optimizedDirections && (
          <DirectionsRenderer
            directions={optimizedDirections}
            options={{
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#10B981',
                strokeOpacity: 0.9,
                strokeWeight: 6,
              },
              markerOptions: {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#10B981',
                  fillOpacity: 1,
                  strokeColor: '#059669',
                  strokeWeight: 2,
                },
              },
            }}
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#13a4ec] mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Calculando rutas...</p>
            </div>
          </div>
        )}
      </GoogleMap>

      {/* Leyenda */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-sm z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-1.5 bg-red-500 rounded"></div>
          <span className="text-gray-700 font-medium">Ruta Actual</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1.5 bg-green-500 rounded"></div>
          <span className="text-gray-700 font-medium">Ruta Optimizada</span>
        </div>
      </div>
    </div>
  )
}
