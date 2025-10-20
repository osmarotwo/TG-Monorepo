/**
 * Locations API Service
 * Consume endpoints del data-handler Lambda
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export interface Resource {
  id: string;
  name: string;
  type: 'cabin' | 'chair' | 'table' | 'room';
}

export interface Specialist {
  id: string;
  name: string;
  specialties: string[];
}

export interface Location {
  locationId: string;
  businessId: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  phone?: string;
  imageUrl?: string;
  industry?: 'beauty' | 'restaurant' | 'retail' | 'logistics' | 'banking';
  resources: Resource[];
  specialists: Specialist[];
  operatingHours?: Record<string, string>;
  status: 'active' | 'inactive';
  currentOccupancy?: number;
  distance?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationsResponse {
  locations: Location[];
  count: number;
}

/**
 * Fetch locations by business ID
 */
export async function fetchLocationsByBusiness(businessId: string): Promise<Location[]> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/locations?businessId=${businessId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch locations: ${response.statusText}`);
    }

    const data: LocationsResponse = await response.json();
    
    // Enrich locations with calculated distance (mock for now)
    const enrichedLocations = data.locations.map((loc, index) => ({
      ...loc,
      distance: calculateDistance(index), // Mock distance
    }));
    
    return enrichedLocations;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
}

/**
 * Fetch location by ID
 */
export async function fetchLocationById(locationId: string): Promise<Location> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/locations/${locationId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch location: ${response.statusText}`);
    }

    const data = await response.json();
    return data.location;
  } catch (error) {
    console.error('Error fetching location:', error);
    throw error;
  }
}

/**
 * Helper: Calculate mock distance based on index
 */
function calculateDistance(index: number): string {
  const distances = ['1.2 km', '2.8 km', '3.5 km', '5.1 km', '6.7 km'];
  return distances[index % distances.length];
}

/**
 * Helper: Get auth token from localStorage or sessionStorage
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  
  let token = localStorage.getItem('authToken');
  if (!token) {
    token = sessionStorage.getItem('authToken');
  }
  
  return token || '';
}
