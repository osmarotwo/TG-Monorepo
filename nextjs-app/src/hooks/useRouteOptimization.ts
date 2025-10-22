/**
 * useRouteOptimization Hook
 * Detecta ineficiencias en rutas y calcula optimización
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Appointment } from '@/services/api/appointments'
import { Location } from '@/services/api/locations'
import {
  RouteComparison,
  OptimizationStatus,
  OptimizationError,
} from '@/services/optimization/types'
import { optimizeRoute } from '@/services/optimization'

interface UseRouteOptimizationOptions {
  enabled?: boolean
  autoCalculate?: boolean
  minEfficiencyThreshold?: number // 0-1
}

interface UseRouteOptimizationReturn {
  comparison: RouteComparison | null
  status: OptimizationStatus
  error: Error | null
  hasOptimization: boolean
  optimizedAppointments: Appointment[] | null
  calculate: () => Promise<void>
  dismiss: () => void
  apply: () => Promise<Appointment[]>
}

export function useRouteOptimization(
  appointments: Appointment[],
  locations: Location[],
  userLocation: { lat: number; lng: number } | null,
  options: UseRouteOptimizationOptions = {}
): UseRouteOptimizationReturn {
  const {
    enabled = true,
    autoCalculate = true,
    minEfficiencyThreshold = 0.1,
  } = options

  const [comparison, setComparison] = useState<RouteComparison | null>(null)
  const [status, setStatus] = useState<OptimizationStatus>('idle')
  const [error, setError] = useState<Error | null>(null)

  /**
   * Calcular optimización
   */
  const calculate = useCallback(async () => {
    console.log('🔍 useRouteOptimization.calculate() called', {
      enabled,
      hasUserLocation: !!userLocation,
      appointmentsCount: appointments.length,
      locationsCount: locations.length,
    })

    if (!enabled || !userLocation || appointments.length < 2) {
      console.log('⚠️ Skipping calculation:', {
        enabled,
        hasUserLocation: !!userLocation,
        appointmentsCount: appointments.length,
        reason: !enabled ? 'disabled' : !userLocation ? 'no user location' : 'less than 2 appointments',
      })
      return
    }

    try {
      console.log('🚀 Starting route optimization...')
      setStatus('calculating')
      setError(null)

      // Ejecutar algoritmo de optimización
      const result = await optimizeRoute(appointments, locations, userLocation)
      console.log('✅ Optimization result:', result)

      // Solo mostrar si hay mejora significativa
      if (result.improvement.efficiency >= minEfficiencyThreshold) {
        console.log('✅ Optimization has significant improvement:', result.improvement.efficiency)
        setComparison(result)
        setStatus('complete')
      } else {
        console.log('⚠️ Optimization improvement too small:', result.improvement.efficiency, 'threshold:', minEfficiencyThreshold)
        setComparison(null)
        setStatus('idle')
      }
    } catch (err) {
      console.error('❌ Error calculating route optimization:', err)
      setError(err as Error)
      setStatus('error')
    }
  }, [enabled, userLocation, appointments, locations, minEfficiencyThreshold])

  /**
   * Descartar sugerencia
   */
  const dismiss = useCallback(() => {
    setComparison(null)
    setStatus('idle')
    setError(null)
  }, [])

  /**
   * Aplicar optimización
   * Retorna el array de appointments reordenado
   */
  const apply = useCallback(async (): Promise<Appointment[]> => {
    if (!comparison) {
      return []
    }

    try {
      setStatus('applied')
      
      // Reordenar appointments según la ruta optimizada
      const optimizedAppointments = comparison.optimized.route.map(node => node.appointment.appointment)
      
      // TODO: En Fase 2, aquí se llamaría a la API para actualizar las citas
      // await updateAppointmentTimes(comparison.optimized.route)
      
      console.log('Optimization applied!')
      console.log('Optimized route:', comparison.optimized.route)
      console.log('Reordered appointments:', optimizedAppointments)
      
      return optimizedAppointments
    } catch (err) {
      console.error('Error applying optimization:', err)
      setError(err as Error)
      setStatus('error')
      return []
    }
  }, [comparison])

  /**
   * Auto-calcular cuando cambien las dependencias
   */
  useEffect(() => {
    console.log('🔄 useRouteOptimization useEffect triggered:', {
      autoCalculate,
      enabled,
      hasUserLocation: !!userLocation,
      appointmentsCount: appointments.length,
      locationsCount: locations.length,
    })

    if (autoCalculate && enabled && userLocation && appointments.length >= 2) {
      console.log('⏱️ Scheduling calculation in 1 second...')
      // Pequeño delay para evitar cálculos innecesarios durante carga inicial
      const timer = setTimeout(() => {
        console.log('⏰ Timer elapsed, calling calculate()')
        calculate()
      }, 1000)

      return () => {
        console.log('🧹 Cleaning up timer')
        clearTimeout(timer)
      }
    } else {
      console.log('⏭️ Skipping auto-calculation:', {
        autoCalculate,
        enabled,
        hasUserLocation: !!userLocation,
        appointmentsCount: appointments.length,
      })
    }
  }, [autoCalculate, enabled, userLocation, appointments, locations, calculate])

  return {
    comparison,
    status,
    error,
    hasOptimization: comparison !== null && status === 'complete',
    optimizedAppointments: comparison ? comparison.optimized.route.map(node => node.appointment.appointment) : null,
    calculate,
    dismiss,
    apply,
  }
}
