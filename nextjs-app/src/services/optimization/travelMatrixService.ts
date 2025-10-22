/**
 * Travel Matrix Service
 * Gestiona cache de tiempos de viaje entre ubicaciones
 * Usa Google Directions API con fallback a Haversine
 */

import { Location } from '@/services/api/locations'
import { TravelMatrix, CachedTravelTime, CACHE_TTL } from './types'

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_KEY_PREFIX = 'travel_matrix_'
const AVERAGE_SPEED_KMH = 30 // Velocidad promedio en ciudad (km/h)

// ============================================================================
// HAVERSINE HELPER
// ============================================================================

/**
 * Calcular distancia en línea recta usando fórmula de Haversine
 */
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Radio de la Tierra en metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distancia en metros
}

/**
 * Estimar tiempo de viaje basado en distancia Haversine
 */
function estimateTravelTime(distanceMeters: number): number {
  const distanceKm = distanceMeters / 1000
  const timeHours = distanceKm / AVERAGE_SPEED_KMH
  const timeMinutes = Math.ceil(timeHours * 60)
  return Math.max(5, timeMinutes) // Mínimo 5 minutos
}

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

class TravelTimeCache {
  private memoryCache: Map<string, CachedTravelTime> = new Map()

  /**
   * Generar clave de cache
   */
  private getCacheKey(fromId: string, toId: string): string {
    return `${CACHE_KEY_PREFIX}${fromId}_${toId}`
  }

  /**
   * Obtener del cache
   */
  get(fromId: string, toId: string): CachedTravelTime | null {
    // Intentar memoria primero
    const memKey = this.getCacheKey(fromId, toId)
    const memCached = this.memoryCache.get(memKey)
    
    if (memCached && memCached.expiresAt > new Date()) {
      return memCached
    }

    // Intentar localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(memKey)
        if (stored) {
          const cached: CachedTravelTime = JSON.parse(stored)
          cached.timestamp = new Date(cached.timestamp)
          cached.expiresAt = new Date(cached.expiresAt)
          
          if (cached.expiresAt > new Date()) {
            // Guardar en memoria para acceso más rápido
            this.memoryCache.set(memKey, cached)
            return cached
          } else {
            // Expirado - remover
            localStorage.removeItem(memKey)
          }
        }
      } catch (error) {
        console.warn('Error reading from cache:', error)
      }
    }

    return null
  }

  /**
   * Guardar en cache
   */
  set(data: CachedTravelTime): void {
    const key = this.getCacheKey(data.fromLocationId, data.toLocationId)
    
    // Guardar en memoria
    this.memoryCache.set(key, data)

    // Guardar en localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(data))
      } catch (error) {
        console.warn('Error saving to cache:', error)
      }
    }
  }

  /**
   * Limpiar cache expirado
   */
  cleanup(): void {
    const now = new Date()
    
    // Limpiar memoria
    for (const [key, value] of this.memoryCache.entries()) {
      if (value.expiresAt <= now) {
        this.memoryCache.delete(key)
      }
    }

    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(CACHE_KEY_PREFIX)) {
            const stored = localStorage.getItem(key)
            if (stored) {
              const cached = JSON.parse(stored)
              if (new Date(cached.expiresAt) <= now) {
                localStorage.removeItem(key)
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error cleaning cache:', error)
      }
    }
  }
}

// Singleton instance
const cache = new TravelTimeCache()

// ============================================================================
// GOOGLE DIRECTIONS API
// ============================================================================

/**
 * Obtener tiempo de viaje usando Google Directions API
 */
async function fetchGoogleDirections(
  origin: Location,
  destination: Location
): Promise<{ distance: number; duration: number } | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.google) {
      resolve(null)
      return
    }

    const directionsService = new window.google.maps.DirectionsService()

    const request = {
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude },
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
      },
    }

    directionsService.route(request, (result: any, status: any) => {
      if (status === 'OK' && result?.routes[0]?.legs[0]) {
        const leg = result.routes[0].legs[0]
        resolve({
          distance: leg.distance?.value || 0,
          duration: Math.ceil((leg.duration?.value || 0) / 60), // Convertir a minutos
        })
      } else {
        console.warn('Directions API failed:', status)
        resolve(null)
      }
    })
  })
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Obtener tiempo de viaje entre dos ubicaciones
 * Usa cache si disponible, sino llama a API, sino usa Haversine
 */
export async function getTravelTime(
  from: Location,
  to: Location
): Promise<{ distance: number; duration: number }> {
  // Si es la misma ubicación
  if (from.locationId === to.locationId) {
    return { distance: 0, duration: 0 }
  }

  // Intentar cache
  const cached = cache.get(from.locationId, to.locationId)
  if (cached) {
    return {
      distance: cached.distance,
      duration: cached.duration,
    }
  }

  // Intentar Google Directions API
  try {
    const googleResult = await fetchGoogleDirections(from, to)
    
    if (googleResult) {
      // Guardar en cache
      const cacheEntry: CachedTravelTime = {
        fromLocationId: from.locationId,
        toLocationId: to.locationId,
        distance: googleResult.distance,
        duration: googleResult.duration,
        timestamp: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL),
      }
      cache.set(cacheEntry)
      
      return googleResult
    }
  } catch (error) {
    console.warn('Error fetching Google Directions:', error)
  }

  // Fallback a Haversine
  const distance = calculateHaversineDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  )
  const duration = estimateTravelTime(distance)

  // Guardar en cache (incluso fallback)
  const cacheEntry: CachedTravelTime = {
    fromLocationId: from.locationId,
    toLocationId: to.locationId,
    distance,
    duration,
    timestamp: new Date(),
    expiresAt: new Date(Date.now() + CACHE_TTL),
  }
  cache.set(cacheEntry)

  return { distance, duration }
}

/**
 * Construir matriz completa de tiempos de viaje
 */
export async function buildTravelMatrix(
  locations: Location[]
): Promise<TravelMatrix> {
  const matrix: TravelMatrix = {}

  // Inicializar matriz
  for (const from of locations) {
    matrix[from.locationId] = {}
  }

  // Calcular todos los pares
  for (const from of locations) {
    for (const to of locations) {
      if (from.locationId === to.locationId) {
        matrix[from.locationId][to.locationId] = {
          distance: 0,
          duration: 0,
          lastUpdated: new Date(),
          expiresAt: new Date(Date.now() + CACHE_TTL),
        }
        continue
      }

      // Obtener tiempo de viaje (con cache)
      const { distance, duration } = await getTravelTime(from, to)

      matrix[from.locationId][to.locationId] = {
        distance,
        duration,
        lastUpdated: new Date(),
        expiresAt: new Date(Date.now() + CACHE_TTL),
      }
    }
  }

  return matrix
}

/**
 * Limpiar cache expirado
 */
export function cleanupCache(): void {
  cache.cleanup()
}

/**
 * Obtener estadísticas de cache (para debugging)
 */
export function getCacheStats(): {
  memoryCacheSize: number
  localStorageCacheSize: number
} {
  let localStorageCount = 0

  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(CACHE_KEY_PREFIX)) {
          localStorageCount++
        }
      }
    } catch (error) {
      console.warn('Error reading cache stats:', error)
    }
  }

  return {
    memoryCacheSize: cache['memoryCache'].size,
    localStorageCacheSize: localStorageCount,
  }
}
