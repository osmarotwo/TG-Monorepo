import { getAuthHeaders } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.clyok.in';

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  enabled: boolean;
  slots: TimeSlot[];
  capacity: number;
}

export interface WeekSchedule {
  [key: string]: DaySchedule;
}

export interface AvailabilityConfig {
  availabilityId?: string;
  businessId: string;
  locationId: string;
  schedule: WeekSchedule;
  slotInterval: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface BusinessAppointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  locationName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  serviceName: string;
  servicePrice: number;
  serviceCurrency: string;
  serviceDuration: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  appointmentDate: string;
  appointmentTime: string;
  createdAt: string;
  notes?: string;
}

/**
 * Create a new availability schedule for a location
 */
export async function createAvailability(config: Omit<AvailabilityConfig, 'availabilityId' | 'createdAt' | 'updatedAt'>): Promise<AvailabilityConfig> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/availability`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create availability');
  }

  const data = await response.json();
  return data.availability;
}

/**
 * Update an existing availability schedule
 */
export async function updateAvailability(
  availabilityId: string,
  updates: Partial<Pick<AvailabilityConfig, 'schedule' | 'slotInterval'>>
): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/availability/${availabilityId}`, {
    method: 'PUT',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update availability');
  }
}

/**
 * Get all availability schedules for a business
 */
export async function getBusinessAvailability(businessId: string): Promise<AvailabilityConfig[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/availability/business/${businessId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch availability');
  }

  const data = await response.json();
  return data.availabilities;
}

/**
 * Delete an availability schedule
 */
export async function deleteAvailability(availabilityId: string): Promise<void> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/availability/${availabilityId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete availability');
  }
}

/**
 * Get all appointments for a business
 */
export async function getBusinessAppointments(businessId: string): Promise<BusinessAppointment[]> {
  const headers = await getAuthHeaders();
  
  const response = await fetch(`${API_BASE_URL}/api/appointments/business/${businessId}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch appointments');
  }

  const data = await response.json();
  return data.appointments;
}

/**
 * Calculate statistics from appointments
 */
export function calculateBusinessStatistics(appointments: BusinessAppointment[]) {
  const totalAppointments = appointments.length;
  const confirmedAppointments = appointments.filter(a => a.status === 'confirmed').length;
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const completedAppointments = appointments.filter(a => a.status === 'completed').length;
  const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

  // Calculate revenue (20% of confirmed appointment prices)
  const totalRevenue = appointments
    .filter(a => a.status === 'confirmed')
    .reduce((sum, a) => sum + (a.servicePrice * 0.20), 0);

  // Group by location
  const locationStats = appointments.reduce((acc, apt) => {
    if (!acc[apt.locationId]) {
      acc[apt.locationId] = {
        locationId: apt.locationId,
        locationName: apt.locationName,
        totalAppointments: 0,
        confirmedAppointments: 0,
        revenue: 0,
      };
    }

    acc[apt.locationId].totalAppointments++;
    if (apt.status === 'confirmed') {
      acc[apt.locationId].confirmedAppointments++;
      acc[apt.locationId].revenue += apt.servicePrice * 0.20;
    }

    return acc;
  }, {} as Record<string, any>);

  return {
    totalAppointments,
    confirmedAppointments,
    pendingAppointments,
    completedAppointments,
    cancelledAppointments,
    totalRevenue,
    locationStats: Object.values(locationStats),
    confirmationRate: totalAppointments > 0 
      ? (confirmedAppointments / totalAppointments) * 100 
      : 0,
  };
}
