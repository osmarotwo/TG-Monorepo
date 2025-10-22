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

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
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
            Cambios de Horario Propuestos
          </h4>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Los siguientes horarios fueron ajustados para optimizar la ruta
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Comercio</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Sede</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Servicio</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Duración</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Original</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">
                <div className="flex items-center justify-center gap-1">
                  <span>→</span>
                </div>
              </th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Horario Propuesto</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Diferencia</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Especialista</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rescheduledAppointments.map((appointment) => (
              <tr key={appointment.appointmentId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-900 font-medium">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">🏪</span>
                    <span>{(appointment as any).businessName || 'Salón de Belleza Premium'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">📍</span>
                    <span>{appointment.locationName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {appointment.serviceType}
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
                  <span className="text-blue-500 text-lg">→</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
                    <span className="text-xs">✓</span>
                    <span className="font-mono">{formatTime(appointment.proposedStartTime)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={`font-semibold ${getTimeDifferenceColor(appointment.timeDifferenceMinutes)}`}>
                    {formatTimeDifference(appointment.timeDifferenceMinutes)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div className="flex items-center gap-1">
                    <span className="text-xs">👤</span>
                    <span>{appointment.specialistName}</span>
                  </div>
                </td>
              </tr>
            ))}
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
