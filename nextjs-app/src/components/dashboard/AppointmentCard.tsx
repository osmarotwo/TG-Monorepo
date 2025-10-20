import React from 'react';
import { Appointment } from '@/services/api/appointments';

interface AppointmentCardProps {
  appointment: Appointment;
  onViewDetails?: (appointmentId: string) => void;
}

export default function AppointmentCard({ appointment, onViewDetails }: AppointmentCardProps) {
  // Format date and time
  const startDate = new Date(appointment.startTime);
  const endDate = new Date(appointment.endTime);
  
  const formatDate = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  
  const dateText = formatDate(startDate);
  const timeText = `${formatTime(startDate)} - ${formatTime(endDate)}`;
  
  // Status badge
  const getStatusBadge = () => {
    switch (appointment.status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Confirmada
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Pendiente
          </span>
        );
      default:
        return null;
    }
  };
  
  // Image fallback
  const imageUrl = appointment.imageUrl || `https://placehold.co/400x300/13a4ec/white?text=${encodeURIComponent(appointment.serviceType)}`;
  
  return (
    <div className="flex flex-col md:flex-row items-stretch gap-4 rounded-xl bg-white/50 backdrop-blur-sm p-4 shadow-sm border border-gray-200 hover:shadow-md hover:scale-[1.02] transition-all duration-300">
      {/* Image */}
      <div 
        className="w-full md:w-1/3 h-40 md:h-auto rounded-lg bg-cover bg-center"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      
      {/* Content */}
      <div className="flex flex-col gap-2 flex-1 justify-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#13a4ec]">Próxima cita</span>
          {getStatusBadge()}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900">
          {appointment.serviceType} con {appointment.specialistName}
        </h3>
        
        <p className="text-sm text-gray-600">
          Cliente: {appointment.customerName}
        </p>
        
        <p className="text-sm text-gray-600">
          {dateText}, {timeText}
        </p>
        
        {appointment.locationName && (
          <p className="text-xs text-gray-500">
            📍 {appointment.locationName}
          </p>
        )}
        
        <button
          onClick={() => onViewDetails?.(appointment.appointmentId)}
          className="mt-2 text-sm font-bold text-[#13a4ec] hover:text-[#0f8fcd] transition-colors text-left"
        >
          Ver Detalles →
        </button>
      </div>
    </div>
  );
}
