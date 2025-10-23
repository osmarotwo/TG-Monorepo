/**
 * RouteOptimizationCard
 * Muestra sugerencia de optimización de ruta con comparación antes/después
 * NUEVA VERSIÓN con reprogramación de citas
 */

'use client'

import React, { useState, useMemo } from 'react'
import { OptimizationResult } from '@/services/optimization/routeOptimizerWithRescheduling'
import { RescheduledAppointment } from '@/services/api/availabilityService'
import ReschedulingProposalTable from './ReschedulingProposalTable'
import RouteComparisonMap from './RouteComparisonMap'
import type { RouteNode } from '@/services/optimization/types'

interface RouteOptimizationCardProps {
  optimizationResult: OptimizationResult
  rescheduledAppointments: RescheduledAppointment[]
  isOptimizing: boolean
  userLocation?: { lat: number; lng: number }
  onApply?: () => void
  onDismiss?: () => void
}

export default function RouteOptimizationCard({
  optimizationResult,
  rescheduledAppointments,
  isOptimizing,
  userLocation,
  onApply,
  onDismiss,
}: RouteOptimizationCardProps) {
  const { originalMetrics, optimizedMetrics, improvements, originalRoute: originalAppointments, optimizedRoute: optimizedAppointments } = optimizationResult
  const [showMap, setShowMap] = useState(false)

  // Convertir Appointments a RouteNodes para el mapa (solo los campos necesarios para visualización)
  const originalRoute = useMemo(() => {
    return originalAppointments.map((apt, index) => ({
      appointment: {
        id: apt.id,
        locationId: apt.locationId,
        locationName: apt.locationName,
        serviceType: apt.serviceType,
        startTime: apt.startTime,
        location: {
          latitude: apt.location.lat,
          longitude: apt.location.lng,
          address: apt.location.address,
        },
      },
      sequenceNumber: index + 1,
      suggestedStartTime: new Date(apt.startTime),
      suggestedEndTime: new Date(apt.endTime),
      travelTimeFromPrevious: 0,
      distanceFromPrevious: 0,
      waitTimeBeforeAppointment: 0,
      arrivalTime: new Date(apt.startTime),
    }))
  }, [originalAppointments])

  const optimizedRoute = useMemo(() => {
    return optimizedAppointments.map((apt, index) => ({
      appointment: {
        id: apt.id,
        locationId: apt.locationId,
        locationName: apt.locationName,
        serviceType: apt.serviceType,
        startTime: apt.startTime,
        location: {
          latitude: apt.location.lat,
          longitude: apt.location.lng,
          address: apt.location.address,
        },
      },
      sequenceNumber: index + 1,
      suggestedStartTime: new Date(apt.startTime),
      suggestedEndTime: new Date(apt.endTime),
      travelTimeFromPrevious: 0,
      distanceFromPrevious: 0,
      waitTimeBeforeAppointment: 0,
      arrivalTime: new Date(apt.startTime),
    }))
  }, [optimizedAppointments])

  console.log('🎴 RouteOptimizationCard rendering:', {
    distanceReduction: improvements.distanceReduction,
    distanceReductionPercentage: improvements.distanceReductionPercentage,
    timeReduction: improvements.timeReduction,
    timeReductionPercentage: improvements.timeReductionPercentage,
    rescheduledCount: rescheduledAppointments.length
  })

  // Formatear distancia
  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`
    }
    return `${km.toFixed(1)} km`
  }

  // Formatear tiempo
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes.toFixed(0)} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins.toFixed(0)}min`
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-[#13a4ec] rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">⚡</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Optimización de Ruta Sugerida
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ruta optimizada con {improvements.distanceReductionPercentage.toFixed(1)}% menos distancia
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Original Route */}
        <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">❌</span>
            <h4 className="font-bold text-gray-900">Ruta Actual</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Distancia:</span>
              <span className="font-bold text-gray-900">{formatDistance(originalMetrics.totalDistance)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Tiempo:</span>
              <span className="font-bold text-gray-900">{formatTime(originalMetrics.totalTime)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Citas:</span>
              <span className="font-bold text-gray-900">{originalMetrics.appointmentCount}</span>
            </div>
          </div>
        </div>

        {/* Optimized Route */}
        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✅</span>
            <h4 className="font-bold text-gray-900">Ruta Optimizada</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Distancia:</span>
              <span className="font-bold text-green-700">
                {formatDistance(optimizedMetrics.totalDistance)}
                {improvements.distanceReduction > 0 && (
                  <span className="ml-2 text-xs">
                    (-{improvements.distanceReductionPercentage.toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Tiempo:</span>
              <span className="font-bold text-green-700">
                {formatTime(optimizedMetrics.totalTime)}
                {improvements.timeReduction > 0 && (
                  <span className="ml-2 text-xs">
                    (-{improvements.timeReductionPercentage.toFixed(0)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700 font-medium">Citas:</span>
              <span className="font-bold text-gray-900">{optimizedMetrics.appointmentCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <div>
              <div className="font-semibold text-gray-900">Ahorro Total</div>
              <div className="text-xs text-gray-600">Con esta optimización</div>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatDistance(improvements.distanceReduction)}
              </div>
              <div className="text-xs text-gray-600">Menos distancia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatTime(improvements.timeReduction)}
              </div>
              <div className="text-xs text-gray-600">Menos tiempo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Rescheduling Proposal Table */}
      <div className="bg-white rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📅</span>
          <div>
            <h4 className="font-semibold text-gray-900">Cambios de Horario Propuestos</h4>
            <p className="text-xs text-gray-600">Revisa las citas que se reprogramarán</p>
          </div>
        </div>

        {rescheduledAppointments.length > 0 ? (
          <>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>{rescheduledAppointments.length} cita(s)</strong> requieren cambio de horario para optimizar la ruta.
                Por favor, revisa los cambios antes de aplicar.
              </p>
            </div>
            <ReschedulingProposalTable rescheduledAppointments={rescheduledAppointments} />
          </>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700">
              ✅ <strong>No se requieren cambios de horario</strong>
              <br />
              <span className="text-sm">La optimización mantiene todos los horarios originales</span>
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={onApply}
          disabled={isOptimizing}
          className="flex-1 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isOptimizing ? 'Aplicando...' : '✨ Aplicar Optimización'}
        </button>
        <button
          onClick={() => setShowMap(!showMap)}
          className="flex-1 bg-white hover:bg-gray-50 text-[#13a4ec] font-semibold py-3 px-6 rounded-lg border-2 border-[#13a4ec] transition-colors"
        >
          {showMap ? '📋 Ocultar Mapa' : '🗺️ Ver Mapa'}
        </button>
      </div>

      {/* Map Comparison */}
      {showMap && userLocation && (
        <div className="mt-6 bg-white rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">🗺️</span>
            <h4 className="font-semibold text-gray-900">Comparación Visual de Rutas</h4>
          </div>
          
          <RouteComparisonMap
            originalRoute={originalRoute as any}
            optimizedRoute={optimizedRoute as any}
            userLocation={userLocation}
            height="h-[500px]"
          />
        </div>
      )}
    </div>
  )
}
