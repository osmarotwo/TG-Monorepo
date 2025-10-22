/**
 * Tipos para el sistema de disponibilidad y agendamiento
 */

/**
 * Horarios de operación de una ubicación
 */
export interface BusinessHours {
  PK: string; // LOCATION#<locationId>
  SK: string; // HOURS#<dayOfWeek>
  locationId: string;
  dayOfWeek: string; // 'monday', 'tuesday', etc.
  openTime: string; // "08:00"
  closeTime: string; // "20:00"
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Duración y detalles de un tipo de servicio
 */
export interface ServiceDuration {
  PK: string; // SERVICE#<serviceType>
  SK: string; // METADATA
  serviceType: string; // 'haircut', 'keratin', etc.
  displayName: string; // "Corte de Cabello"
  durationMinutes: number; // 60, 90, 120
  description?: string;
  basePrice?: number; // Precio base (opcional)
  createdAt: string;
  updatedAt: string;
}

/**
 * Agenda de un especialista para un día específico
 */
export interface SpecialistSchedule {
  PK: string; // SPECIALIST#<specialistId>
  SK: string; // DATE#<YYYY-MM-DD>#LOCATION#<locationId>
  specialistId: string;
  specialistName: string;
  locationId: string;
  date: string; // "2025-10-22"
  availability: AvailabilitySlots; // Objeto con slots de 15 minutos
  createdAt: string;
  updatedAt: string;
}

/**
 * Objeto con slots de disponibilidad (cada 15 minutos)
 * Ejemplo: { "08:00": "available", "08:15": "booked", ... }
 */
export interface AvailabilitySlots {
  [time: string]: 'available' | 'booked' | 'reserved';
}

/**
 * Slot disponible (retornado por la API)
 */
export interface AvailableSlot {
  time: string; // "08:00"
  specialistId: string;
  specialistName: string;
  durationMinutes: number;
}

/**
 * Propuesta de reprogramación de una cita
 */
export interface RescheduledAppointment {
  appointmentId: string;
  clientName: string;
  serviceType: string;
  locationId: string;
  locationName: string;
  
  // Horario original
  originalStartTime: string;
  originalEndTime: string;
  
  // Horario propuesto
  proposedStartTime: string;
  proposedEndTime: string;
  
  // Diferencia
  timeDifferenceMinutes: number; // +60 = 1 hora después, -60 = 1 hora antes
  
  // Duración del servicio
  durationMinutes: number; // Duración estimada en minutos
  
  // Especialista
  specialistId: string;
  specialistName: string;
  
  // Estado
  status: 'proposed' | 'approved' | 'rejected';
  reason?: string; // "Para optimizar la ruta"
}

/**
 * Conflicto de disponibilidad
 */
export interface AvailabilityConflict {
  appointmentId: string;
  locationId: string;
  requestedTime: string;
  reason: string; // "No hay disponibilidad", "Fuera de horario", etc.
  alternatives?: AvailableSlot[]; // Slots alternativos sugeridos
}

/**
 * Request para verificar múltiples disponibilidades
 */
export interface CheckMultipleAvailabilityRequest {
  appointments: {
    appointmentId: string;
    locationId: string;
    serviceType: string;
    requestedTime: string; // ISO 8601
    durationMinutes: number;
  }[];
}

/**
 * Response de verificación múltiple
 */
export interface CheckMultipleAvailabilityResponse {
  available: RescheduledAppointment[];
  conflicts: AvailabilityConflict[];
}

/**
 * Request para reservar un slot
 */
export interface ReserveSlotRequest {
  specialistId: string;
  locationId: string;
  date: string; // "2025-10-22"
  startTime: string; // "08:00"
  durationMinutes: number;
  appointmentId?: string; // Opcional, para asociar con una cita
}

/**
 * Response de reserva
 */
export interface ReserveSlotResponse {
  success: boolean;
  reservationId?: string;
  expiresAt?: string; // Timestamp de expiración (15 min)
  message?: string;
}
