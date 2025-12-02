/**
 * LocationService - Servicio para manejar operaciones de ubicaciones de negocios
 * Conecta el frontend con el backend serverless de AWS
 */

// Tipos de datos
export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Coordinates {
  lat: number
  lng: number
}

export interface BusinessHours {
  [key: string]: {
    open: string    // Format: "09:00"
    close: string   // Format: "18:00"
    closed?: boolean
  }
}

export interface Location {
  locationId: string
  businessId: string
  name: string
  address: Address
  coordinates?: Coordinates
  phone?: string
  email?: string
  hours?: BusinessHours
  isActive: boolean
  isPrimary?: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateLocationData {
  name: string
  address: Address
  coordinates?: Coordinates
  phone?: string
  email?: string
  hours?: BusinessHours
  isPrimary?: boolean
}

export interface UpdateLocationData {
  name?: string
  address?: Address
  coordinates?: Coordinates
  phone?: string
  email?: string
  hours?: BusinessHours
  isPrimary?: boolean
  isActive?: boolean
}

export interface LocationResponse {
  message: string
  location: Location
}

export interface LocationsResponse {
  locations: Location[]
  count: number
}

export interface ApiError {
  error: string
  message?: string
  statusCode?: number
}

class LocationService {
  private baseUrl: string
  private accessToken: string | null = null

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://your-api-gateway-url'
    
    // Cargar token del localStorage si existe
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
    }
  }

  /**
   * Establecer el token de autenticación
   */
  setToken(token: string): void {
    this.accessToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token)
    }
  }

  /**
   * Obtener el token de autenticación
   */
  getToken(): string | null {
    return this.accessToken
  }

  /**
   * Limpiar el token
   */
  clearToken(): void {
    this.accessToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
    }
  }

  /**
   * Hacer petición HTTP con headers comunes
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }

    // Merge additional headers if provided
    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => {
          headers[key] = value
        })
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => {
          headers[key] = value
        })
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            headers[key] = value
          }
        })
      }
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        throw {
          error: data.message || data.error || 'Request failed',
          statusCode: response.status,
          ...data
        } as ApiError
      }

      return data as T
    } catch (error: any) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  /**
   * Crear una nueva ubicación
   */
  async createLocation(locationData: CreateLocationData): Promise<LocationResponse> {
    return this.request<LocationResponse>('/api/locations', {
      method: 'POST',
      body: JSON.stringify(locationData),
    })
  }

  /**
   * Obtener todas las ubicaciones del negocio
   */
  async getLocations(businessId?: string): Promise<LocationsResponse> {
    const queryParams = businessId ? `?businessId=${businessId}` : '';
    return this.request<LocationsResponse>(`/api/locations${queryParams}`, {
      method: 'GET',
    })
  }

  /**
   * Obtener una ubicación específica por ID
   */
  async getLocation(locationId: string): Promise<LocationResponse> {
    return this.request<LocationResponse>(`/api/locations/${locationId}`, {
      method: 'GET',
    })
  }

  /**
   * Actualizar una ubicación
   */
  async updateLocation(
    locationId: string,
    updates: UpdateLocationData
  ): Promise<LocationResponse> {
    return this.request<LocationResponse>(`/api/locations/${locationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  /**
   * Eliminar una ubicación (soft delete)
   */
  async deleteLocation(locationId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/locations/${locationId}`, {
      method: 'DELETE',
    })
  }

  /**
   * Validar dirección (puede ser expandido para usar servicios de validación)
   */
  validateAddress(address: Address): boolean {
    return !!(
      address.street &&
      address.city &&
      address.state &&
      address.zipCode &&
      address.country
    )
  }

  /**
   * Validar horario de negocio
   */
  validateBusinessHours(hours: BusinessHours): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    
    for (const day in hours) {
      const { open, close, closed } = hours[day]
      
      if (closed) continue
      
      if (!timeRegex.test(open) || !timeRegex.test(close)) {
        return false
      }
      
      // Validar que close sea después de open
      const [openHour, openMin] = open.split(':').map(Number)
      const [closeHour, closeMin] = close.split(':').map(Number)
      
      const openMinutes = openHour * 60 + openMin
      const closeMinutes = closeHour * 60 + closeMin
      
      if (closeMinutes <= openMinutes) {
        return false
      }
    }
    
    return true
  }

  /**
   * Formatear dirección como string
   */
  formatAddress(address: Address): string {
    const parts: string[] = [];
    
    // Agregar calle
    if (address.street) {
      parts.push(address.street);
    }
    
    // Agregar ciudad
    if (address.city) {
      parts.push(address.city);
    }
    
    // Agregar estado y código postal juntos si existen
    const stateZip: string[] = [];
    if (address.state) stateZip.push(address.state);
    if (address.zipCode) stateZip.push(address.zipCode);
    if (stateZip.length > 0) {
      parts.push(stateZip.join(' '));
    }
    
    // Agregar país
    if (address.country) {
      parts.push(address.country);
    }
    
    return parts.join(', ');
  }

  /**
   * Generar horarios por defecto (9 AM - 6 PM, lunes a viernes)
   */
  getDefaultBusinessHours(): BusinessHours {
    const defaultHours = {
      open: '09:00',
      close: '18:00',
    }

    return {
      monday: { ...defaultHours },
      tuesday: { ...defaultHours },
      wednesday: { ...defaultHours },
      thursday: { ...defaultHours },
      friday: { ...defaultHours },
      saturday: { open: '09:00', close: '13:00' },
      sunday: { open: '00:00', close: '00:00', closed: true },
    }
  }
}

// Exportar instancia singleton
const locationService = new LocationService()
export default locationService
