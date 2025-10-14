// API configuration and service functions
const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://ectre1y1fg.execute-api.us-east-1.amazonaws.com/prod';

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  birthDate?: string;
  gender?: 'hombre' | 'mujer' | 'prefiero-no-decirlo';
  isVerified: boolean;
  createdAt: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          data,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || 'Error desconocido',
        };
      }
    } catch (error) {
      console.error('API Error:', error);
      return {
        success: false,
        error: 'Error de conexión. Por favor, verifica tu conexión a internet.',
      };
    }
  }

  // Auth endpoints
  async register(userData: {
    email: string;
    password: string;
    fullName: string;
    birthDate?: string;
    gender?: string;
  }): Promise<ApiResponse<{ userId: string; message: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{ token: string; user: UserProfile }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyEmail(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/request-password-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: {
    token: string;
    newPassword: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<{ token: string }>> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  async logout(token: string): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Protected endpoints
  async getProfile(token: string): Promise<ApiResponse<UserProfile>> {
    return this.request('/auth/profile', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async completeProfile(profileData: {
    fullName: string;
    email: string;
    birthDate: string;
    gender: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return this.request('/auth/complete-profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Export types
export type { ApiResponse };
export type { UserProfile };