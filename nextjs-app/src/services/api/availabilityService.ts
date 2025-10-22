/**
 * Servicio para consultar disponibilidad de horarios
 */

export interface AvailableSlot {
  time: string;
  specialistId: string;
  specialistName: string;
  durationMinutes: number;
}

export interface RescheduledAppointment {
  appointmentId: string;
  clientName: string;
  serviceType: string;
  locationId: string;
  locationName: string;
  originalStartTime: string;
  originalEndTime: string;
  proposedStartTime: string;
  proposedEndTime: string;
  timeDifferenceMinutes: number;
  durationMinutes: number; // Duración del servicio
  specialistId: string;
  specialistName: string;
  status: 'proposed' | 'approved' | 'rejected';
  reason?: string;
}

export interface AvailabilityConflict {
  appointmentId: string;
  locationId: string;
  requestedTime: string;
  reason: string;
  alternatives?: AvailableSlot[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

/**
 * Obtiene slots disponibles para una ubicación en una fecha
 */
export async function getAvailableSlots(
  locationId: string,
  date: string,
  serviceType?: string,
  duration?: number
): Promise<AvailableSlot[]> {
  const params = new URLSearchParams();
  if (serviceType) params.append('serviceType', serviceType);
  if (duration) params.append('duration', duration.toString());
  
  const url = `${API_BASE_URL}/api/availability/${locationId}/${date}${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error al obtener disponibilidad: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.availableSlots || [];
}

/**
 * Verifica disponibilidad para múltiples citas
 */
export async function checkMultipleAvailability(appointments: {
  appointmentId: string;
  locationId: string;
  serviceType: string;
  requestedTime: string;
  durationMinutes: number;
}[]): Promise<{
  available: RescheduledAppointment[];
  conflicts: AvailabilityConflict[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/availability/check-multiple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointments })
  });
  
  if (!response.ok) {
    throw new Error(`Error al verificar disponibilidad: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Reserva temporalmente un slot (15 min)
 */
export async function reserveSlot(
  specialistId: string,
  locationId: string,
  date: string,
  startTime: string,
  durationMinutes: number,
  appointmentId?: string
): Promise<{
  success: boolean;
  reservationId?: string;
  expiresAt?: string;
  message?: string;
}> {
  const response = await fetch(`${API_BASE_URL}/api/availability/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      specialistId,
      locationId,
      date,
      startTime,
      durationMinutes,
      appointmentId
    })
  });
  
  if (!response.ok) {
    throw new Error(`Error al reservar slot: ${response.statusText}`);
  }
  
  return response.json();
}
