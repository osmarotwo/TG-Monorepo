/**
 * Route Optimizer
 * Algoritmo Greedy con Nearest Neighbor para optimizar rutas
 */

import { Appointment } from '@/services/api/appointments'
import { Location } from '@/services/api/locations'
import {
  OptimizableAppointment,
  RouteNode,
  RouteConflict,
  ImprovementMetrics,
  RouteComparison,
  OptimizerConfig,
  DEFAULT_CONFIG,
} from './types'
import { getTravelTime } from './travelMatrixService'
import {
  calculateWaitTime,
} from './scoringEngine'

// ============================================================================
// PREPARATION
// ============================================================================

/**
 * Convertir citas normales a OptimizableAppointment
 */
export function prepareAppointments(
  appointments: Appointment[],
  locations: Location[]
): OptimizableAppointment[] {
  return appointments.map((apt) => {
    const location = locations.find((loc) => loc.locationId === apt.locationId)
    
    if (!location) {
      throw new Error(`Location not found for appointment ${apt.appointmentId}`)
    }

    return {
      appointment: apt,
      location,
      flexibility: 0.5, // Default: media flexibilidad
      priority: 3, // Default: prioridad media (1-5)
      canReschedule: false, // MVP: no reprogramar
    }
  })
}

// ============================================================================
// ROUTE BUILDING
// ============================================================================

/**
 * Construir ruta en el orden actual (sin optimizar)
 */
async function buildOriginalRoute(
  appointments: OptimizableAppointment[],
  userLocation: { lat: number; lng: number }
): Promise<RouteNode[]> {
  console.log('🔴 Building ORIGINAL route...')
  const route: RouteNode[] = []
  let currentLat = userLocation.lat
  let currentLng = userLocation.lng
  let currentTime = new Date()

  for (let i = 0; i < appointments.length; i++) {
    const apt = appointments[i]
    const startTime = new Date(apt.appointment.startTime)
    const endTime = new Date(apt.appointment.endTime)

    // Calcular tiempo de viaje desde ubicación actual
    let travelTime = 0
    let distance = 0

    if (i === 0) {
      // Desde ubicación del usuario
      const userLoc: Location = {
        locationId: 'USER',
        name: 'Tu ubicación',
        latitude: currentLat,
        longitude: currentLng,
      } as Location

      const travel = await getTravelTime(userLoc, apt.location)
      travelTime = travel.duration
      distance = travel.distance
    } else {
      // Desde cita anterior
      const prevLocation = appointments[i - 1].location
      const travel = await getTravelTime(prevLocation, apt.location)
      travelTime = travel.duration
      distance = travel.distance
    }

    const arrivalTime = new Date(currentTime.getTime() + travelTime * 60 * 1000)
    const waitTime = calculateWaitTime(arrivalTime, startTime)

    route.push({
      appointment: apt,
      sequenceNumber: i + 1,
      suggestedStartTime: startTime,
      suggestedEndTime: endTime,
      travelTimeFromPrevious: travelTime,
      distanceFromPrevious: distance,
      waitTimeBeforeAppointment: waitTime,
      arrivalTime,
    })

    // Actualizar posición y tiempo actuales
    currentLat = apt.location.latitude
    currentLng = apt.location.longitude
    currentTime = endTime
  }

  console.log('🔴 Original route built:', {
    totalStops: route.length,
    sequence: route.map(r => r.appointment.location.name),
  })

  return route
}

/**
 * Encontrar mejor próxima cita usando scoring
 * @deprecated - No usado actualmente, usar buildOptimizedRoute directamente
 */
/* async function findBestNext(
  currentLocation: { lat: number; lng: number },
  currentTime: Date,
  candidates: OptimizableAppointment[],
  config: OptimizerConfig
): Promise<ScoredCandidate | null> {
  const scoredCandidates: ScoredCandidate[] = []

  // Crear ubicación temporal para calcular desde posición actual
  const currentLoc: Location = {
    locationId: 'CURRENT',
    name: 'Ubicación actual',
    latitude: currentLocation.lat,
    longitude: currentLocation.lng,
  } as Location

  for (const candidate of candidates) {
    // Calcular tiempo de viaje
    const travel = await getTravelTime(currentLoc, candidate.location)
    const arrivalTime = new Date(currentTime.getTime() + travel.duration * 60 * 1000)
    const appointmentTime = new Date(candidate.appointment.startTime)
    const waitTime = calculateWaitTime(arrivalTime, appointmentTime)

    // Verificar viabilidad
    const viability = isAppointmentViable(arrivalTime, candidate, config.minBufferTime)

    // Calcular score
    const factors: ScoreFactors = {
      distance: travel.distance,
      travelTime: travel.duration,
      arrivalTime,
      appointmentTime,
      flexibility: candidate.flexibility,
      priority: candidate.priority,
      waitTime,
    }

    const score = calculateScore(factors, config.weights)

    scoredCandidates.push({
      appointment: candidate,
      score,
      arrivalTime,
      waitTime,
      isViable: viability.viable,
      violationReason: viability.reason,
    })
  }

  // Encontrar el mejor candidato viable
  return findBestCandidate(scoredCandidates)
} */

/**
 * Algoritmo Greedy: construir ruta optimizada
 */
async function buildOptimizedRoute(
  appointments: OptimizableAppointment[],
  userLocation: { lat: number; lng: number }
): Promise<RouteNode[]> {
  console.log('🟢 Building OPTIMIZED route using Geographic Clustering...')
  
  // Estrategia: Mantener la primera cita (cronológicamente), luego reorganizar el resto geográficamente
  const chronological = [...appointments].sort((a, b) => 
    new Date(a.appointment.startTime).getTime() - new Date(b.appointment.startTime).getTime()
  )
  
  if (chronological.length === 0) return []
  
  const route: RouteNode[] = []
  
  // PASO 1: Agregar la primera cita (no se puede mover porque es la más temprana)
  const firstApt = chronological[0]
  const firstStart = new Date(firstApt.appointment.startTime)
  const firstEnd = new Date(firstApt.appointment.endTime)
  
  // Calcular viaje desde usuario a primera cita
  const userLoc: Location = {
    locationId: 'USER',
    latitude: userLocation.lat,
    longitude: userLocation.lng,
  } as Location
  const firstTravel = await getTravelTime(userLoc, firstApt.location)
  const firstArrival = new Date(Date.now() + firstTravel.duration * 60 * 1000)
  
  route.push({
    appointment: firstApt,
    sequenceNumber: 1,
    suggestedStartTime: firstStart,
    suggestedEndTime: firstEnd,
    travelTimeFromPrevious: firstTravel.duration,
    distanceFromPrevious: firstTravel.distance,
    waitTimeBeforeAppointment: calculateWaitTime(firstArrival, firstStart),
    arrivalTime: firstArrival,
  })
  
  // PASO 2: Reorganizar el resto por proximidad geográfica (Nearest Neighbor)
  const unvisited = chronological.slice(1) // Excluir la primera
  let currentLocation = {
    lat: firstApt.location.latitude,
    lng: firstApt.location.longitude,
  }
  let currentTime = firstEnd

  while (unvisited.length > 0) {
    let bestIndex = -1
    let bestDistance = Infinity
    let bestCandidate: OptimizableAppointment | null = null
    
    // Buscar el más cercano geográficamente que sea viable temporalmente
    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i]
      const appointmentTime = new Date(candidate.appointment.startTime)
      
      // Calcular distancia
      const currentLoc: Location = {
        locationId: 'CURRENT',
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
      } as Location
      const travel = await getTravelTime(currentLoc, candidate.location)
      const arrivalTime = new Date(currentTime.getTime() + travel.duration * 60 * 1000)
      
      // Solo considerar si podemos llegar a tiempo
      const canArrive = arrivalTime.getTime() <= appointmentTime.getTime()
      
      if (canArrive && travel.distance < bestDistance) {
        bestDistance = travel.distance
        bestIndex = i
        bestCandidate = candidate
      }
    }
    
    // Si no encontramos candidato viable, tomar el siguiente cronológico
    if (bestIndex === -1) {
      console.warn('No viable candidates found, using chronological order')
      bestIndex = 0
      bestCandidate = unvisited[0]
    }
    
    const apt = bestCandidate!
    const startTime = new Date(apt.appointment.startTime)
    const endTime = new Date(apt.appointment.endTime)
    
    // Calcular métricas de viaje
    const currentLoc: Location = {
      locationId: 'CURRENT',
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
    } as Location
    const travel = await getTravelTime(currentLoc, apt.location)
    const arrivalTime = new Date(currentTime.getTime() + travel.duration * 60 * 1000)
    const waitTime = calculateWaitTime(arrivalTime, startTime)
    
    route.push({
      appointment: apt,
      sequenceNumber: route.length + 1,
      suggestedStartTime: startTime,
      suggestedEndTime: endTime,
      travelTimeFromPrevious: travel.duration,
      distanceFromPrevious: travel.distance,
      waitTimeBeforeAppointment: waitTime,
      arrivalTime,
    })
    
    // Actualizar estado
    currentLocation = {
      lat: apt.location.latitude,
      lng: apt.location.longitude,
    }
    currentTime = endTime
    
    // Remover de candidatos
    unvisited.splice(bestIndex, 1)
  }

  console.log('🟢 Optimized route built:', {
    totalStops: route.length,
    sequence: route.map((r: RouteNode) => r.appointment.location.name),
  })

  return route
}

// ============================================================================
// METRICS CALCULATION
// ============================================================================

/**
 * Calcular métricas de una ruta
 */
function calculateRouteMetrics(route: RouteNode[]): {
  totalDistance: number
  totalTravelTime: number
  totalWaitTime: number
} {
  let totalDistance = 0
  let totalTravelTime = 0
  let totalWaitTime = 0

  for (const node of route) {
    totalDistance += node.distanceFromPrevious
    totalTravelTime += node.travelTimeFromPrevious
    totalWaitTime += node.waitTimeBeforeAppointment
  }

  return { totalDistance, totalTravelTime, totalWaitTime }
}

/**
 * Detectar conflictos en una ruta
 */
function findConflicts(route: RouteNode[]): RouteConflict[] {
  const conflicts: RouteConflict[] = []

  for (const node of route) {
    const arrivalTime = node.arrivalTime
    const appointmentTime = new Date(node.appointment.appointment.startTime)
    const diffMs = appointmentTime.getTime() - arrivalTime.getTime()
    const diffMinutes = diffMs / (60 * 1000)

    if (diffMinutes < 0) {
      conflicts.push({
        node,
        type: 'time',
        message: `Llegarías ${Math.abs(diffMinutes).toFixed(0)} minutos tarde`,
        shortfallMinutes: Math.abs(diffMinutes),
      })
    }
  }

  return conflicts
}

/**
 * Calcular mejoras comparando original vs optimizada
 */
function calculateImprovement(
  original: RouteNode[],
  optimized: RouteNode[]
): ImprovementMetrics {
  const originalMetrics = calculateRouteMetrics(original)
  const optimizedMetrics = calculateRouteMetrics(optimized)

  const distanceReduction = originalMetrics.totalDistance - optimizedMetrics.totalDistance
  const distanceReductionPercent =
    originalMetrics.totalDistance > 0
      ? (distanceReduction / originalMetrics.totalDistance) * 100
      : 0

  const timeReduction = originalMetrics.totalTravelTime - optimizedMetrics.totalTravelTime
  const timeReductionPercent =
    originalMetrics.totalTravelTime > 0
      ? (timeReduction / originalMetrics.totalTravelTime) * 100
      : 0

  const originalConflicts = findConflicts(original).length
  const optimizedConflicts = findConflicts(optimized).length
  const conflictsResolved = Math.max(0, originalConflicts - optimizedConflicts)

  // Efficiency score (0-1)
  const efficiency = Math.max(
    0,
    Math.min(
      1,
      (distanceReductionPercent / 100 + timeReductionPercent / 100 + conflictsResolved / 10) / 3
    )
  )

  return {
    distanceReduction,
    distanceReductionPercent,
    timeReduction,
    timeReductionPercent,
    conflictsResolved,
    efficiency,
  }
}

// ============================================================================
// MAIN OPTIMIZATION FUNCTION
// ============================================================================

/**
 * Optimizar ruta de citas
 */
export async function optimizeRoute(
  appointments: Appointment[],
  locations: Location[],
  userLocation: { lat: number; lng: number },
  config: OptimizerConfig = DEFAULT_CONFIG
): Promise<RouteComparison> {
  // Preparar datos
  const optimizable = prepareAppointments(appointments, locations)

  console.log('🔍 Input appointments order:', appointments.map(a => ({
    id: a.appointmentId.substring(0, 8),
    location: locations.find(l => l.locationId === a.locationId)?.name,
    time: new Date(a.startTime).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  })))

  // Construir ruta original
  const originalRoute = await buildOriginalRoute(optimizable, userLocation)
  const originalMetrics = calculateRouteMetrics(originalRoute)
  const originalConflicts = findConflicts(originalRoute)

  // Construir ruta optimizada
  const optimizedRoute = await buildOptimizedRoute(optimizable, userLocation)
  const optimizedMetrics = calculateRouteMetrics(optimizedRoute)
  const optimizedConflicts = findConflicts(optimizedRoute)

  // Calcular mejoras
  const improvement = calculateImprovement(originalRoute, optimizedRoute)
  
  // Suprimir warning de config no usado
  void config

  console.log('📊 Route Optimization Metrics:', {
    originalDistance: originalMetrics.totalDistance,
    optimizedDistance: optimizedMetrics.totalDistance,
    originalTime: originalMetrics.totalTravelTime,
    optimizedTime: optimizedMetrics.totalTravelTime,
    distanceReduction: improvement.distanceReduction,
    timeReduction: improvement.timeReduction,
    efficiency: improvement.efficiency,
  })

  // Generar recomendación
  let recommendation: 'apply' | 'review' | 'keep-original' = 'keep-original'
  let recommendationReason = ''

  if (improvement.efficiency > 0.3) {
    recommendation = 'apply'
    recommendationReason = `Ahorro significativo de ${improvement.timeReduction.toFixed(0)} minutos (${improvement.timeReductionPercent.toFixed(0)}%)`
  } else if (improvement.efficiency > 0.1) {
    recommendation = 'review'
    recommendationReason = 'Mejoras moderadas - revisar si valen la pena'
  } else {
    recommendation = 'keep-original'
    recommendationReason = 'La ruta actual ya es eficiente'
  }

  return {
    original: {
      route: originalRoute,
      totalDistance: originalMetrics.totalDistance,
      totalTravelTime: originalMetrics.totalTravelTime,
      conflicts: originalConflicts.length,
    },
    optimized: {
      route: optimizedRoute,
      totalDistance: optimizedMetrics.totalDistance,
      totalTravelTime: optimizedMetrics.totalTravelTime,
      totalWaitTime: optimizedMetrics.totalWaitTime,
      conflicts: optimizedConflicts,
      isViable: optimizedConflicts.length === 0,
      improvementMetrics: improvement,
    },
    improvement,
    recommendation,
    recommendationReason,
  }
}
