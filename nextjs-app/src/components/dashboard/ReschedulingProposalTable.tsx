/**
 * ReschedulingProposalTable
 * Muestra tabla con los cambios de horario propuestos para optimizar la ruta
 */

'use client';

import React from 'react';
import { RescheduledAppointment } from '@/services/api/availabilityService';

interface ReschedulingProposalTableProps {
  rescheduledAppointments: RescheduledAppointment[];
}

export default function ReschedulingProposalTable({ rescheduledAppointments }: ReschedulingProposalTableProps) {
  if (rescheduledAppointments.length === 0) {
    return null;
  }
  
  // Debug: Verificar que el campo type está llegando
  console.log('🔍 Tipos de citas en tabla:', rescheduledAppointments.map(apt => ({
    id: apt.id,
    type: apt.type,
    serviceType: apt.serviceType,
    locationName: apt.locationName
  })));
  
  // Separar citas modificadas y no modificadas
  const modifiedAppointments = rescheduledAppointments.filter(apt => apt.hasTimeChange !== false);
  const unchangedAppointments = rescheduledAppointments.filter(apt => apt.hasTimeChange === false);

  const formatTime = (isoString: string): string => {
    // Parsear la fecha ISO y sumar 5 horas para Colombia
    const date = new Date(isoString);
    const colombiaDate = new Date(date.getTime() + (5 * 60 * 60 * 1000));
    
    const formatter = new Intl.DateTimeFormat('es-CO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return formatter.format(colombiaDate);
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    
    const formatter = new Intl.DateTimeFormat('es-CO', { 
      day: '2-digit', 
      month: 'short',
      year: 'numeric'
    });
    
    return formatter.format(date);
  };

  // Determinar si es cita personal basado en el campo type
  const isPersonalAppointment = (appointment: RescheduledAppointment): boolean => {
    return appointment.type === 'personal';
  };

  const formatTimeDifference = (minutes: number): string => {
    const hours = Math.floor(Math.abs(minutes) / 60);
    const mins = Math.abs(minutes) % 60;
    
    const sign = minutes > 0 ? '+' : '-';
    if (hours > 0) {
      return `${sign}${hours}h ${mins}min`;
    }
    return `${sign}${mins}min`;
  };

  const getTimeDifferenceColor = (minutes: number): string => {
    if (Math.abs(minutes) <= 30) return 'text-green-600';
    if (Math.abs(minutes) <= 120) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Helper para formatear duración
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="mt-6 bg-white rounded-lg border border-blue-200 overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
        <div className="flex items-center gap-2">
          <span className="text-xl">📅</span>
          <h4 className="font-bold text-gray-900">
            Ruta Optimizada - Citas Incluidas
          </h4>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {modifiedAppointments.length > 0 && (
            <span className="font-semibold text-yellow-700">
              {modifiedAppointments.length} cita{modifiedAppointments.length !== 1 ? 's' : ''} con cambio de horario
            </span>
          )}
          {modifiedAppointments.length > 0 && unchangedAppointments.length > 0 && <span> • </span>}
          {unchangedAppointments.length > 0 && (
            <span>
              {unchangedAppointments.length} cita{unchangedAppointments.length !== 1 ? 's' : ''} sin modificar
            </span>
          )}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Tipo</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Título/Comercio</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Ubicación</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Detalle</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Duración</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Original</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                <div className="flex items-center justify-center gap-1">
                  <span>→</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Propuesto</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Diferencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rescheduledAppointments.map((appointment) => {
              const isPersonal = isPersonalAppointment(appointment);
              const isUnchanged = appointment.hasTimeChange === false;
              const isNonFlexible = appointment.isFlexible === false || isPersonal;
              
              return (
                <tr 
                  key={appointment.appointmentId} 
                  className={`hover:bg-gray-50 transition-colors ${isUnchanged ? 'bg-gray-50' : ''}`}
                >
                  {/* Fecha */}
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">📅</span>
                      <span className="text-sm">{formatDate(appointment.originalStartTime)}</span>
                    </div>
                  </td>
                  
                  {/* Tipo */}
                  <td className="px-4 py-3 text-center">
                    {isPersonal ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                        <span>📝</span>
                        <span>Personal</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                        <span>🏢</span>
                        <span>Negocio</span>
                      </div>
                    )}
                  </td>
                  
                  {/* Título/Comercio */}
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{isPersonal ? '📋' : '🏪'}</span>
                      <span>{isPersonal ? appointment.serviceType : (appointment.businessName || 'Salón de Belleza Premium')}</span>
                    </div>
                  </td>
                  
                  {/* Ubicación */}
                  <td className="px-4 py-3 text-gray-700">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">📍</span>
                      <span className="text-sm">{appointment.locationName}</span>
                    </div>
                  </td>
                  
                  {/* Detalle */}
                  <td className="px-4 py-3 text-gray-700 text-sm">
                    {isPersonal ? (
                      <span className="text-gray-600 italic">Cita personal</span>
                    ) : (
                      <span>{appointment.serviceType}</span>
                    )}
                  </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    <span className="text-xs">⏱️</span>
                    <span className="font-semibold">{formatDuration(appointment.durationMinutes)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded">
                    <span className="text-xs">⏰</span>
                    <span className="font-mono">{formatTime(appointment.originalStartTime)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {isUnchanged ? (
                    <span className="text-gray-400 text-lg">—</span>
                  ) : (
                    <span className="text-blue-500 text-lg">→</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {isUnchanged ? (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded">
                      <span className="text-xs">{isNonFlexible ? '🔒' : '='}</span>
                      <span className="font-mono">{formatTime(appointment.originalStartTime)}</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
                      <span className="text-xs">✓</span>
                      <span className="font-mono">{formatTime(appointment.proposedStartTime)}</span>
                    </div>
                  )}
                </td>
                  {/* Diferencia de tiempo */}
                  <td className="px-4 py-3 text-center">
                    {isUnchanged ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                        <span>{isNonFlexible ? '🔒 No modificable' : 'Sin cambios'}</span>
                      </div>
                    ) : (
                      <span className={`font-semibold ${getTimeDifferenceColor(appointment.timeDifferenceMinutes)}`}>
                        {formatTimeDifference(appointment.timeDifferenceMinutes)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
              <span>✓</span>
              <span>Disponibilidad confirmada</span>
            </span>
            <span>|</span>
            <span>{rescheduledAppointments.length} cita(s) reprogramada(s)</span>
          </div>
          <div className="text-sm text-gray-500">
            Los especialistas están disponibles en los nuevos horarios
          </div>
        </div>
      </div>
    </div>
  );
}
