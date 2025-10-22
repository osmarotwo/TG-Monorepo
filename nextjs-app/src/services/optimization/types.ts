/**
 * Types for Route Optimization System
 * Algoritmo de optimización de rutas para citas
 */

import { Appointment } from '@/services/api/appointments'
import { Location } from '@/services/api/locations'

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Cita con información adicional para optimización
 */
export interface OptimizableAppointment {
  appointment: Appointment
  location: Location
  flexibility: number // 0-1: Qué tan flexible es el horario
  priority: number // 1-5: Prioridad del usuario
  canReschedule: boolean // Si se puede reprogramar
}

/**
 * Matriz de tiempos de viaje entre ubicaciones
 * Cache de Google Directions API
 */
export interface TravelMatrix {
  [fromLocationId: string]: {
    [toLocationId: string]: {
      distance: number // metros
      duration: number // minutos
      route?: any // Ruta completa de Google Maps (opcional)
      lastUpdated: Date // Para cache
      expiresAt: Date // Expira en 7 días
    }
  }
}

/**
 * Nodo en la ruta optimizada
 */
export interface RouteNode {
  appointment: OptimizableAppointment
  sequenceNumber: number // Posición en la ruta (1, 2, 3...)
  suggestedStartTime: Date
  suggestedEndTime: Date
  travelTimeFromPrevious: number // minutos
  distanceFromPrevious: number // metros
  waitTimeBeforeAppointment: number // minutos de espera
  arrivalTime: Date // Cuándo llegas
}

/**
 * Resultado de la optimización
 */
export interface OptimizedRoute {
  route: RouteNode[]
  totalDistance: number // metros
  totalTravelTime: number // minutos
  totalWaitTime: number // minutos
  conflicts: RouteConflict[]
  isViable: boolean // Si es posible completar todas las citas
  improvementMetrics: ImprovementMetrics
}

/**
 * Conflicto en la ruta (cita no alcanzable)
 */
export interface RouteConflict {
  node: RouteNode
  type: 'time' | 'business-hours' | 'other'
  message: string
  shortfallMinutes?: number // Cuántos minutos faltan
}

/**
 * Métricas de mejora (comparación antes/después)
 */
export interface ImprovementMetrics {
  distanceReduction: number // metros ahorrados
  distanceReductionPercent: number // % de reducción
  timeReduction: number // minutos ahorrados
  timeReductionPercent: number // % de reducción
  conflictsResolved: number // # de conflictos eliminados
  efficiency: number // 0-1: score de eficiencia
}

/**
 * Comparación de rutas (original vs optimizada)
 */
export interface RouteComparison {
  original: {
    route: RouteNode[]
    totalDistance: number
    totalTravelTime: number
    conflicts: number
  }
  optimized: OptimizedRoute
  improvement: ImprovementMetrics
  recommendation: 'apply' | 'review' | 'keep-original'
  recommendationReason: string
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/**
 * Factores para calcular score de próxima cita
 */
export interface ScoreFactors {
  distance: number // metros
  travelTime: number // minutos
  arrivalTime: Date
  appointmentTime: Date
  flexibility: number // 0-1
  priority: number // 1-5
  waitTime: number // minutos
}

/**
 * Pesos configurables para scoring
 */
export interface ScoringWeights {
  proximity: number // Peso de cercanía (default: 0.4)
  timing: number // Peso de timing perfecto (default: 0.3)
  priority: number // Peso de prioridad (default: 0.2)
  waitTime: number // Penalización por espera (default: -0.1)
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

/**
 * Configuración del optimizador
 */
export interface OptimizerConfig {
  weights: ScoringWeights
  maxWaitTime: number // minutos - espera máxima aceptable
  minBufferTime: number // minutos - buffer entre citas
  preferEarlyArrival: boolean // Preferir llegar temprano vs justo a tiempo
  respectBusinessHours: boolean // Respetar horarios de negocio
  allowRescheduling: boolean // Permitir sugerir reprogramación
}

/**
 * Resultado del cálculo de score
 */
export interface ScoredCandidate {
  appointment: OptimizableAppointment
  score: number
  arrivalTime: Date
  waitTime: number
  isViable: boolean // Si es viable llegar
  violationReason?: string // Por qué no es viable
}

// ============================================================================
// CACHE TYPES
// ============================================================================

/**
 * Entrada de cache para tiempos de viaje
 */
export interface CachedTravelTime {
  fromLocationId: string
  toLocationId: string
  duration: number // minutos
  distance: number // metros
  timestamp: Date
  expiresAt: Date
}

/**
 * Configuración de cache
 */
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live en milisegundos (default: 7 días)
  storageType: 'memory' | 'localStorage' | 'indexedDB'
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * Estado de la optimización en UI
 */
export type OptimizationStatus = 
  | 'idle'
  | 'analyzing'
  | 'calculating'
  | 'complete'
  | 'error'
  | 'applied'

/**
 * Props para componente de optimización
 */
export interface OptimizationCardProps {
  comparison: RouteComparison
  status: OptimizationStatus
  onApply?: () => void
  onDismiss?: () => void
  onViewDetails?: () => void
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Error de optimización
 */
export class OptimizationError extends Error {
  constructor(
    message: string,
    public code: 'NO_SOLUTION' | 'API_ERROR' | 'INVALID_DATA' | 'TIMEOUT',
    public details?: any
  ) {
    super(message)
    this.name = 'OptimizationError'
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_WEIGHTS: ScoringWeights = {
  proximity: 0.4,
  timing: 0.3,
  priority: 0.2,
  waitTime: -0.1,
}

export const DEFAULT_CONFIG: OptimizerConfig = {
  weights: DEFAULT_WEIGHTS,
  maxWaitTime: 60, // 1 hora máximo
  minBufferTime: 10, // 10 minutos de buffer
  preferEarlyArrival: true,
  respectBusinessHours: true,
  allowRescheduling: false, // MVP: solo sugerencias
}

export const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 días
