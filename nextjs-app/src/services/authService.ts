/**
 * AuthService - Servicio para manejar todas las operaciones de autenticación
 * Conecta el frontend con el backend serverless de AWS
 */

// Tipos de datos basados en el backend
export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginData {
  email: string
  password: string
}

export interface GoogleAuthData {
  idToken: string
}

export interface CompleteProfileData {
  phone: string
  birthDate: string
  profileCompleted?: boolean
}

export interface User {
  userId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  birthDate?: string
  profileCompleted: boolean
  emailVerified: boolean
  provider: 'google' | 'email'
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface AuthResponse {
  message: string
  user: User
  tokens: AuthTokens
}

export interface ApiError {
  error: string
  statusCode?: number
}

class AuthService {
  private baseUrl: string
  private accessToken: string | null = null

  constructor() {
    // TODO: Obtener la URL del API Gateway desde variables de entorno
    this.baseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://your-api-gateway-url/auth'
    
    // Cargar token del localStorage si existe
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken')
    }
  }

  /**
   * Realiza una petición HTTP con manejo de errores
   */
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Agregar Authorization header si hay token
    if (this.accessToken) {
      defaultHeaders['Authorization'] = `Bearer ${this.accessToken}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      console.log(`🌐 API Call: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        console.error('❌ API Error:', data)
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      console.log('✅ API Success:', data)
      return data
    } catch (error) {
      console.error('🚨 Network Error:', error)
      throw error
    }
  }

  /**
   * Guarda tokens en localStorage
   */
  private saveTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', tokens.accessToken)
      localStorage.setItem('refreshToken', tokens.refreshToken)
      localStorage.setItem('tokenExpiresAt', 
        (Date.now() + tokens.expiresIn * 1000).toString()
      )
      this.accessToken = tokens.accessToken
    }
  }

  /**
   * Limpia tokens del localStorage
   */
  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('tokenExpiresAt')
      this.accessToken = null
    }
  }

  /**
   * Registro nativo con email y password
   */
  async registerNative(data: RegisterData): Promise<{ message: string; userId: string }> {
    const response = await this.makeRequest<{ message: string; userId: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  }

  /**
   * Login nativo con email y password
   */
  async loginNative(data: LoginData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    this.saveTokens(response.tokens)
    return response
  }

  /**
   * Autenticación con Google
   */
  async authenticateWithGoogle(data: GoogleAuthData): Promise<AuthResponse> {
    const response = await this.makeRequest<AuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    
    this.saveTokens(response.tokens)
    return response
  }

  /**
   * Verificar email con token
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
    return response
  }

  /**
   * Completar perfil del usuario
   */
  async completeProfile(data: CompleteProfileData): Promise<{ message: string; user: User }> {
    const response = await this.makeRequest<{ message: string; user: User }>('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response
  }

  /**
   * Obtener información del usuario actual
   */
  async getCurrentUser(): Promise<{ user: User }> {
    const response = await this.makeRequest<{ user: User }>('/auth/me', {
      method: 'GET',
    })
    return response
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<{ message: string }> {
    try {
      const response = await this.makeRequest<{ message: string }>('/auth/logout', {
        method: 'POST',
      })
      this.clearTokens()
      return response
    } catch (error) {
      // Incluso si falla la petición, limpiamos tokens localmente
      this.clearTokens()
      throw error
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: Partial<CompleteProfileData & { firstName: string; lastName: string }>): Promise<{ message: string; user: User }> {
    const response = await this.makeRequest<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return response
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    return response
  }

  /**
   * Resetear contraseña con token
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const response = await this.makeRequest<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    })
    return response
  }

  /**
   * Refrescar token de acceso
   */
  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = typeof window !== 'undefined' 
      ? localStorage.getItem('refreshToken') 
      : null

    if (!refreshToken) {
      throw new Error('No refresh token available')
    }

    const response = await this.makeRequest<{ tokens: AuthTokens }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    })
    
    this.saveTokens(response.tokens)
    return response.tokens
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('accessToken')
    const expiresAt = localStorage.getItem('tokenExpiresAt')
    
    if (!token || !expiresAt) return false
    
    return Date.now() < parseInt(expiresAt)
  }

  /**
   * Obtener token de acceso actual
   */
  getAccessToken(): string | null {
    return this.accessToken
  }
}

// Singleton instance
export const authService = new AuthService()
export default authService