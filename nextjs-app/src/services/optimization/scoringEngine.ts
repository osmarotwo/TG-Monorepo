/**
 * Scoring Engine
 * Calcula scores para seleccionar la mejor próxima cita
 */

import {
  ScoreFactors,
  ScoringWeights,
  DEFAULT_WEIGHTS,
  ScoredCandidate,
  OptimizableAppointment,
} from './types'

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

/**
 * Calcular score de proximidad (qué tan cerca está)
 * Retorna valor entre 0-1 (1 = muy cerca, 0 = muy lejos)
 */
function calculateProximityScore(distanceMeters: number): number {
  // Normalizar usando función sigmoidea inversa
  // Distancias < 1km = score alto
  // Distancias > 20km = score bajo
  const distanceKm = distanceMeters / 1000
  const normalized = 1 / (1 + distanceKm / 5)
  return Math.max(0, Math.min(1, normalized))
}

/**
 * Calcular score de timing (qué tan bien coincide con el horario)
 * Retorna valor entre 0-1 (1 = timing perfecto, 0 = muy desalineado)
 */
function calculateTimingScore(
  arrivalTime: Date,
  appointmentTime: Date
): number {
  const diffMinutes = (appointmentTime.getTime() - arrivalTime.getTime()) / (60 * 1000)

  // Caso ideal: llegar 5-15 minutos antes
  if (diffMinutes >= 5 && diffMinutes <= 15) {
    return 1.0
  }

  // Llegar muy temprano (> 15 min) = penalizar ligeramente
  if (diffMinutes > 15) {
    const penalty = Math.min((diffMinutes - 15) / 60, 0.5) // Max penalty 0.5
    return Math.max(0.5, 1.0 - penalty)
  }

  // Llegar justo a tiempo (0-5 min antes) = bueno pero no ideal
  if (diffMinutes >= 0 && diffMinutes < 5) {
    return 0.8
  }

  // Llegar tarde = muy malo
  if (diffMinutes < 0) {
    return 0 // No viable
  }

  return 0
}

/**
 * Calcular score de prioridad
 * Retorna valor entre 0-1 basado en prioridad 1-5
 */
function calculatePriorityScore(priority: number): number {
  return Math.max(0, Math.min(1, priority / 5))
}

/**
 * Calcular score de tiempo de espera
 * Retorna valor entre 0-1 (penaliza esperas largas)
 */
function calculateWaitTimeScore(waitMinutes: number): number {
  // Sin espera = perfecto
  if (waitMinutes <= 0) {
    return 1.0
  }

  // Espera corta (< 15 min) = aceptable
  if (waitMinutes <= 15) {
    return 0.8
  }

  // Espera media (15-30 min) = no ideal
  if (waitMinutes <= 30) {
    return 0.6
  }

  // Espera larga (30-60 min) = malo
  if (waitMinutes <= 60) {
    return 0.4
  }

  // Espera muy larga (> 60 min) = muy malo
  return Math.max(0, 0.4 - (waitMinutes - 60) / 120)
}

// ============================================================================
// MAIN SCORING FUNCTION
// ============================================================================

/**
 * Calcular score total para una cita candidata
 */
export function calculateScore(
  factors: ScoreFactors,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): number {
  const proximityScore = calculateProximityScore(factors.distance)
  const timingScore = calculateTimingScore(factors.arrivalTime, factors.appointmentTime)
  const priorityScore = calculatePriorityScore(factors.priority)
  const waitScore = calculateWaitTimeScore(factors.waitTime)

  const totalScore =
    proximityScore * weights.proximity +
    timingScore * weights.timing +
    priorityScore * weights.priority +
    waitScore * weights.waitTime // Nota: weight es negativo para penalizar

  return Math.max(0, Math.min(1, totalScore))
}

/**
 * Determinar si una cita es viable dado el tiempo de llegada
 */
export function isAppointmentViable(
  arrivalTime: Date,
  appointment: OptimizableAppointment,
  minBufferTime: number = 10
): { viable: boolean; reason?: string } {
  const appointmentTime = new Date(appointment.appointment.startTime)
  const diffMinutes = (appointmentTime.getTime() - arrivalTime.getTime()) / (60 * 1000)

  // Llega tarde
  if (diffMinutes < 0) {
    return {
      viable: false,
      reason: `Llegarías ${Math.abs(diffMinutes).toFixed(0)} minutos tarde`,
    }
  }

  // Llega muy justo (sin buffer)
  if (diffMinutes < minBufferTime) {
    return {
      viable: false,
      reason: `No hay suficiente tiempo de buffer (necesitas al menos ${minBufferTime} min)`,
    }
  }

  // Verificar horarios del negocio (si existen)
  if (appointment.location.operatingHours) {
    // Por ahora, asumimos que operatingHours es un objeto con días
    // Simplificación: verificar solo si hay horarios
    // En producción, deberíamos verificar el día específico
    const hours = appointment.location.operatingHours
    const todayKey = Object.keys(hours)[0] // Simplificación
    
    if (todayKey && hours[todayKey]) {
      const hoursStr = hours[todayKey]
      const match = hoursStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/)
      
      if (match) {
        const [, openHour, openMin, closeHour, closeMin] = match.map(Number)
        const appointmentHour = appointmentTime.getHours() + appointmentTime.getMinutes() / 60
        const openTime = openHour + openMin / 60
        const closeTime = closeHour + closeMin / 60

        if (appointmentHour < openTime || appointmentHour > closeTime) {
          return {
            viable: false,
            reason: `Fuera del horario de atención`,
          }
        }
      }
    }
  }

  return { viable: true }
}

/**
 * Calcular tiempo de espera entre llegada y cita
 */
export function calculateWaitTime(
  arrivalTime: Date,
  appointmentTime: Date
): number {
  const diffMs = appointmentTime.getTime() - arrivalTime.getTime()
  return Math.max(0, Math.floor(diffMs / (60 * 1000)))
}

/**
 * Ordenar candidatos por score (mayor a menor)
 */
export function rankCandidates(candidates: ScoredCandidate[]): ScoredCandidate[] {
  return [...candidates].sort((a, b) => b.score - a.score)
}

/**
 * Filtrar solo candidatos viables
 */
export function filterViableCandidates(
  candidates: ScoredCandidate[]
): ScoredCandidate[] {
  return candidates.filter((c) => c.isViable)
}

/**
 * Encontrar el mejor candidato de una lista
 */
export function findBestCandidate(
  candidates: ScoredCandidate[]
): ScoredCandidate | null {
  const viable = filterViableCandidates(candidates)
  const ranked = rankCandidates(viable)
  return ranked[0] || null
}

// ============================================================================
// HELPERS PARA DEBUGGING
// ============================================================================

/**
 * Generar reporte detallado de scoring (útil para debugging)
 */
export function generateScoreReport(
  factors: ScoreFactors,
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  totalScore: number
  breakdown: {
    proximity: { score: number; weight: number; contribution: number }
    timing: { score: number; weight: number; contribution: number }
    priority: { score: number; weight: number; contribution: number }
    waitTime: { score: number; weight: number; contribution: number }
  }
} {
  const proximityScore = calculateProximityScore(factors.distance)
  const timingScore = calculateTimingScore(factors.arrivalTime, factors.appointmentTime)
  const priorityScore = calculatePriorityScore(factors.priority)
  const waitScore = calculateWaitTimeScore(factors.waitTime)

  return {
    totalScore: calculateScore(factors, weights),
    breakdown: {
      proximity: {
        score: proximityScore,
        weight: weights.proximity,
        contribution: proximityScore * weights.proximity,
      },
      timing: {
        score: timingScore,
        weight: weights.timing,
        contribution: timingScore * weights.timing,
      },
      priority: {
        score: priorityScore,
        weight: weights.priority,
        contribution: priorityScore * weights.priority,
      },
      waitTime: {
        score: waitScore,
        weight: weights.waitTime,
        contribution: waitScore * weights.waitTime,
      },
    },
  }
}
