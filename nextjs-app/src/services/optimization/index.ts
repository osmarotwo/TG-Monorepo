/**
 * Route Optimization Service
 * Entry point para el sistema de optimización de rutas
 */

// Types
export * from './types'

// Services
export { getTravelTime, buildTravelMatrix, cleanupCache, getCacheStats } from './travelMatrixService'

export {
  calculateScore,
  isAppointmentViable,
  calculateWaitTime,
  findBestCandidate,
  generateScoreReport,
} from './scoringEngine'

export { optimizeRoute, prepareAppointments } from './routeOptimizer'
