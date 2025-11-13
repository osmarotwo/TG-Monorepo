/**
 * API service for Services
 * NOTA TEMPORAL: Por ahora usa datos hardcodeados hasta que se implemente
 * la tabla Services en DynamoDB y el módulo B2B
 */

import { getServicesByBusiness as getLocalServices, type Service } from '@/data/services'

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export type { Service }

/**
 * Get authentication token from localStorage or sessionStorage
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

/**
 * Fetch services by business ID
 * TODO: Reemplazar con llamada real a la API cuando exista la tabla Services
 */
export async function fetchServicesByBusiness(businessId: string): Promise<Service[]> {
  try {
    // Por ahora, retorna datos locales
    // Simula un pequeño delay como si fuera una llamada API
    await new Promise(resolve => setTimeout(resolve, 300))
    return getLocalServices(businessId)
    
    /* TODO: Descomentar cuando la API esté lista
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/services?businessId=${businessId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }

    const data = await response.json();
    return data.services.filter((s: Service) => s.isActive);
    */
  } catch (error) {
    console.error('Error fetching services:', error);
    // En caso de error, retorna datos locales como fallback
    return getLocalServices(businessId)
  }
}

/**
 * Fetch service by ID
 * TODO: Reemplazar con llamada real a la API cuando exista la tabla Services
 */
export async function fetchServiceById(serviceId: string): Promise<Service | null> {
  try {
    await new Promise(resolve => setTimeout(resolve, 200))
    const { getServiceById } = await import('@/data/services')
    return getServiceById(serviceId) || null
    
    /* TODO: Descomentar cuando la API esté lista
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/services/${serviceId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch service: ${response.statusText}`);
    }

    const data = await response.json();
    return data.service;
    */
  } catch (error) {
    console.error('Error fetching service:', error);
    return null
  }
}
