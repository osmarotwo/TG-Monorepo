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
  status: 'confirmed' | 'pending' | 'cancelled' | 'no-show' | 'completed';
  resourceId: string;
  notes?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
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
  limit: number = 2
): Promise<Appointment[]> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/appointments?userId=${userId}&limit=${limit}&upcoming=true`,
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
