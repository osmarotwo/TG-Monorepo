/**
 * Appointments API Service
 * Consume endpoints del data-handler Lambda
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export interface Appointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  locationName?: string;
  userId: string;
  customerId: string;
  customerName: string;
  serviceType: string;
  specialistName: string;
  specialistId: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number; // Duración estimada del servicio en minutos
  status: 'confirmed' | 'pending' | 'cancelled' | 'no-show' | 'completed';
  resourceId: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Campos adicionales de DynamoDB (date/time separados)
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  serviceName?: string; // Nombre del servicio
}

export interface AppointmentsResponse {
  appointments: Appointment[];
  count: number;
}

/**
 * Fetch upcoming appointments for a user
 */
export async function fetchUpcomingAppointments(
  userId: string,
  limit: number = 2,
  upcomingOnly: boolean = true
): Promise<Appointment[]> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/appointments?userId=${userId}&limit=${limit}&upcoming=${upcomingOnly}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch appointments: ${response.statusText}`);
    }

    const data: AppointmentsResponse = await response.json();
    return data.appointments;
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    throw error;
  }
}

/**
 * Fetch appointment by ID
 */
export async function fetchAppointmentById(appointmentId: string): Promise<Appointment> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${appointmentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch appointment: ${response.statusText}`);
    }

    const data = await response.json();
    return data.appointment;
  } catch (error) {
    console.error('Error fetching appointment:', error);
    throw error;
  }
}

/**
 * Update appointment times (for route optimization)
 */
export async function updateAppointmentTimes(
  appointmentId: string,
  userId: string,
  startTime: string,
  endTime: string
): Promise<Appointment> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/${appointmentId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          startTime,
          endTime,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to update appointment: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    return data.appointment;
  } catch (error) {
    console.error('Error updating appointment:', error);
    throw error;
  }
}

/**
 * Create new appointment
 */
export interface CreateAppointmentData {
  userId: string;
  businessId: string;
  locationId: string;
  customerName: string;
  serviceType: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  duration: number; // minutes
  notes?: string;
}

export async function createAppointment(data: CreateAppointmentData): Promise<Appointment> {
  console.log('🔵 createAppointment service called with:', data)
  
  try {
    const token = getAuthToken();
    console.log('🔑 Auth token:', token ? '✅ Present' : '❌ Missing')
    
    // Calcular startTime y endTime
    const startTime = `${data.date}T${data.time}:00.000Z`;
    const endTime = new Date(new Date(startTime).getTime() + data.duration * 60000).toISOString();

    const payload = {
      ...data,
      startTime,
      endTime,
      estimatedDuration: data.duration,
      status: 'confirmed',
    };

    console.log('📦 Payload to send:', payload)
    console.log('🌐 API URL:', `${API_BASE_URL}/api/appointments`)

    const response = await fetch(
      `${API_BASE_URL}/api/appointments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    console.log('📡 Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error response:', errorData)
      throw new Error(`Failed to create appointment: ${errorData.error || response.statusText}`);
    }

    const responseData = await response.json();
    console.log('✅ Success response:', responseData)
    return responseData.appointment;
  } catch (error) {
    console.error('💥 Error creating appointment:', error);
    throw error;
  }
}

/**
 * Validate appointment slot before creating
 */
export async function validateAppointmentSlot(
  locationId: string,
  date: string,
  time: string,
  duration: number
): Promise<{ available: boolean; reason?: string }> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/appointments/validate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locationId, date, time, duration })
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to validate appointment: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('💥 Error validating appointment:', error);
    throw error;
  }
}

/**
 * Helper: Get auth token from localStorage or sessionStorage
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  
  // Try localStorage first (remember me)
  let token = localStorage.getItem('authToken');
  
  // Fallback to sessionStorage
  if (!token) {
    token = sessionStorage.getItem('authToken');
  }
  
  return token || '';
}
