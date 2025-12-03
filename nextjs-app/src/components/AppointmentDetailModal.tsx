'use client'

import React from 'react'
import { Appointment } from '@/services/api/appointments'
import { Location } from '@/services/api/locations'
import { Business } from '@/services/api/businesses'

interface AppointmentWithDetails extends Appointment {
  location?: Location
  business?: Business
}

interface AppointmentDetailModalProps {
  appointment: AppointmentWithDetails
  isOpen: boolean
  onClose: () => void
}

// Helper to safely render address
const formatAddress = (address: any): string => {
  if (!address) return 'Dirección no disponible'
  if (typeof address === 'string') return address
  if (typeof address === 'object' && address !== null) {
    const parts = [
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country
    ].filter(Boolean)
    return parts.join(', ') || 'Dirección no disponible'
  }
  return 'Dirección no disponible'
}

export default function AppointmentDetailModal({ appointment, isOpen, onClose }: AppointmentDetailModalProps) {
  if (!isOpen) return null

  const isPersonal = appointment.type === 'personal'
  const date = new Date(appointment.startTime)
  const endDate = new Date(appointment.endTime)
  
  const dateFormatter = new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Bogota'
  })
  const dateStr = dateFormatter.format(date)
  
  const timeFormatter = new Intl.DateTimeFormat('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Bogota'
  })
  const timeStr = timeFormatter.format(date)
  const endTimeStr = timeFormatter.format(endDate)

  const industryEmojis: Record<string, string> = {
    beauty: '💅',
    restaurant: '🍽️',
    retail: '🛍️',
    logistics: '📦',
    banking: '🏦',
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 transition-opacity" aria-hidden="true" />
        
        {/* Modal */}
        <div 
          className="relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-auto overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header con gradiente */}
          <div className={`relative p-6 sm:p-8 ${isPersonal ? 'bg-gradient-to-br from-purple-500 to-purple-600' : 'bg-gradient-to-br from-[#13a4ec] to-[#0f8fcd]'} text-white`}>
            {/* Botón de cierre */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Logo o Ícono */}
            <div className="flex justify-center mb-4">
              {isPersonal ? (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                  📝
                </div>
              ) : appointment.business?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={appointment.business.logoUrl}
                  alt={appointment.business.name}
                  className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
                  {appointment.business?.industry ? industryEmojis[appointment.business.industry] : '🏢'}
                </div>
              )}
            </div>

            {/* Título */}
            <h2 className="text-2xl font-bold text-center mb-2">
              {isPersonal ? appointment.title : appointment.serviceType}
            </h2>
            
            {/* Subtítulo */}
            {!isPersonal && appointment.business?.name && (
              <p className="text-center text-white/90 font-medium">
                {appointment.business.name}
              </p>
            )}

            {/* Badge */}
            <div className="flex justify-center mt-3">
              <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                {isPersonal ? '📝 Cita Personal' : '💼 Cita de Negocio'}
              </span>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-6 sm:p-8 space-y-4">
            {/* Fecha y Hora */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                  📅
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Fecha y Hora
                  </div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {dateStr}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {timeStr} - {endTimeStr}
                  </div>
                </div>
              </div>
            </div>

            {/* Ubicación */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                  📍
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Ubicación
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {isPersonal ? formatAddress(appointment.address) : (appointment.location?.name || appointment.locationName || 'Sin ubicación')}
                  </div>
                  {!isPersonal && appointment.location?.address && (
                    <div className="text-sm text-gray-600 mt-1">
                      {formatAddress(appointment.location.address)}
                    </div>
                  )}
                  {!isPersonal && appointment.location?.city && (
                    <div className="text-sm text-gray-600">
                      {appointment.location.city}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Duración */}
            {(appointment.duration || appointment.estimatedDuration) && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                    ⏱️
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Duración
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {appointment.duration || appointment.estimatedDuration} minutos
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción (solo personal) */}
            {isPersonal && appointment.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                    📄
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Descripción
                    </div>
                    <div className="text-sm text-gray-700">
                      {appointment.description}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Especialista (solo negocio) */}
            {!isPersonal && appointment.specialistName && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Especialista
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {appointment.specialistName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cliente (solo negocio) */}
            {!isPersonal && appointment.customerName && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                    👥
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Cliente
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {appointment.customerName}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notas */}
            {appointment.notes && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                    📝
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                      Notas
                    </div>
                    <div className="text-sm text-gray-700">
                      {appointment.notes}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Estado */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#13a4ec]/10 rounded-lg flex items-center justify-center text-xl">
                  {appointment.status === 'confirmed' ? '✅' : 
                   appointment.status === 'pending' ? '⏳' : 
                   appointment.status === 'cancelled' ? '❌' : '✓'}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
                    Estado
                  </div>
                  <div className="text-sm font-semibold text-gray-900 capitalize">
                    {appointment.status === 'confirmed' ? 'Confirmada' :
                     appointment.status === 'pending' ? 'Pendiente' :
                     appointment.status === 'cancelled' ? 'Cancelada' :
                     appointment.status === 'completed' ? 'Completada' :
                     appointment.status === 'no-show' ? 'No asistió' :
                     appointment.status}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer con botón de cierre */}
          <div className="px-6 pb-6 sm:px-8 sm:pb-8">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
