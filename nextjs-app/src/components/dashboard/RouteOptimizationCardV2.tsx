/**
 * RouteOptimizationCardV2
 * Card de optimización mejorada CON reprogramación de citas
 */

'use client';

import React, { useState } from 'react';
import { OptimizationResult } from '@/services/optimization/routeOptimizerWithRescheduling';
import { RescheduledAppointment } from '@/services/api/availabilityService';
import ReschedulingProposalTable from './ReschedulingProposalTable';

interface RouteOptimizationCardV2Props {
  optimizationResult: OptimizationResult;
  rescheduledAppointments: RescheduledAppointment[];
  userLocation?: { lat: number; lng: number };
  onApply?: () => Promise<void>;
  onDismiss?: () => void;
}

export default function RouteOptimizationCardV2({
  optimizationResult,
  rescheduledAppointments,
  userLocation,
  onApply,
  onDismiss
}: RouteOptimizationCardV2Props) {
  const [showMap, setShowMap] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const { improvements, originalMetrics, optimizedMetrics } = optimizationResult;

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${(km * 1000).toFixed(0)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes.toFixed(0)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins.toFixed(0)}min`;
  };

  const handleApply = async () => {
    if (!onApply) return;
    
    setIsApplying(true);
    try {
      await onApply();
    } catch (error) {
      console.error('Error aplicando optimización:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-[#13a4ec] rounded-xl p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">⚡</div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Optimización Sugerida
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Ruta más eficiente con ajustes de horario disponibles
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Mejoras Destacadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Distancia */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-xs text-gray-500 mb-1">Ahorro en Distancia</div>
          <div className="text-2xl font-bold text-green-600">
            {formatDistance(improvements.distanceReduction)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {improvements.distanceReductionPercentage.toFixed(1)}% menos
          </div>
        </div>

        {/* Tiempo */}
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <div className="text-xs text-gray-500 mb-1">Ahorro en Tiempo</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatTime(improvements.timeReduction)}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {improvements.timeReductionPercentage.toFixed(1)}% menos
          </div>
        </div>

        {/* Citas Reprogramadas */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <div className="text-xs text-gray-500 mb-1">Citas Ajustadas</div>
          <div className="text-2xl font-bold text-purple-600">
            {rescheduledAppointments.length}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            de {optimizationResult.originalRoute.length} totales
          </div>
        </div>
      </div>

      {/* Comparación de Rutas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Ruta Original */}
        <div className="bg-white rounded-lg p-4 border border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">❌</span>
            <h4 className="font-bold text-gray-900">Ruta Actual</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distancia total:</span>
              <span className="font-semibold text-gray-900">
                {formatDistance(originalMetrics.totalDistance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo de viaje:</span>
              <span className="font-semibold text-gray-900">
                {formatTime(originalMetrics.totalTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Citas:</span>
              <span className="font-semibold text-gray-900">
                {originalMetrics.appointmentCount}
              </span>
            </div>
          </div>
        </div>

        {/* Ruta Optimizada */}
        <div className="bg-white rounded-lg p-4 border-2 border-green-500">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">✅</span>
            <h4 className="font-bold text-gray-900">Ruta Optimizada</h4>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Distancia total:</span>
              <span className="font-semibold text-green-600">
                {formatDistance(optimizedMetrics.totalDistance)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tiempo de viaje:</span>
              <span className="font-semibold text-green-600">
                {formatTime(optimizedMetrics.totalTime)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Citas:</span>
              <span className="font-semibold text-green-600">
                {optimizedMetrics.appointmentCount} ✓
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Reprogramación */}
      {rescheduledAppointments.length > 0 && (
        <ReschedulingProposalTable rescheduledAppointments={rescheduledAppointments} />
      )}

      {/* Mapa de Comparación */}
      {/* TODO: Adaptar RouteComparisonMap para el nuevo formato de datos */}
      {showMap && userLocation && (
        <div className="mt-6 bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">🗺️</div>
            <div>Mapa de comparación (próximamente)</div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
        <button
          onClick={handleApply}
          disabled={isApplying}
          className="flex-1 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Aplicando...</span>
            </>
          ) : (
            <>
              <span>✓</span>
              <span>Aplicar Optimización</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => setShowMap(!showMap)}
          className="bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <span>🗺️</span>
          <span>{showMap ? 'Ocultar' : 'Ver'} Mapa</span>
        </button>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="bg-white hover:bg-gray-50 text-gray-500 px-6 py-3 rounded-lg font-semibold border border-gray-300 transition-colors"
          >
            Descartar
          </button>
        )}
      </div>

      {/* Nota informativa */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
        <div className="flex items-start gap-2">
          <span className="text-lg">💡</span>
          <div>
            <strong>Nota:</strong> Al aplicar la optimización, se actualizarán los horarios de las citas marcadas.
            Los clientes recibirán una notificación automática con los nuevos horarios.
          </div>
        </div>
      </div>
    </div>
  );
}
