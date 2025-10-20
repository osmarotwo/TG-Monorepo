/**
 * Businesses API Service
 * Consume endpoints del data-handler Lambda
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export interface Business {
  businessId: string;
  name: string;
  industry: 'beauty' | 'restaurant' | 'retail' | 'logistics' | 'banking';
  ownerId: string;
  logoUrl?: string;
  description?: string;
  totalLocations: number;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessesResponse {
  businesses: Business[];
  count: number;
}

/**
 * Fetch businesses by owner ID
 */
export async function fetchBusinessesByOwner(ownerId: string): Promise<Business[]> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/businesses?ownerId=${ownerId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch businesses: ${response.statusText}`);
    }

    const data: BusinessesResponse = await response.json();
    return data.businesses;
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
}

/**
 * Fetch business by ID
 */
export async function fetchBusinessById(businessId: string): Promise<Business> {
  try {
    const token = getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/api/businesses/${businessId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch business: ${response.statusText}`);
    }

    const data = await response.json();
    return data.business;
  } catch (error) {
    console.error('Error fetching business:', error);
    throw error;
  }
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
