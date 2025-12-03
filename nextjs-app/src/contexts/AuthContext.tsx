'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import authService, { 
  User, 
  RegisterData, 
  LoginData, 
  GoogleAuthData, 
  CompleteProfileData 
} from '../services/authService'

// Estados de autenticación
export type AuthStatus = 
  | 'loading'           // Verificando autenticación inicial
  | 'unauthenticated'   // No autenticado
  | 'authenticated'     // Autenticado completamente
  | 'email-pending'     // Registrado pero email sin verificar
  | 'profile-pending'   // Email verificado pero perfil incompleto

export interface AuthState {
  status: AuthStatus
  user: User | null
  isLoading: boolean
  error: string | null
}

export interface AuthContextType extends AuthState {
  // Acciones de autenticación
  registerNative: (data: RegisterData) => Promise<void>
  loginNative: (data: LoginData) => Promise<void>
  authenticateWithGoogle: (data: GoogleAuthData) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  completeProfile: (data: CompleteProfileData) => Promise<void>
  logout: () => Promise<void>
  
  // Utilidades
  clearError: () => void
  refreshUserData: () => Promise<void>
  
  // Estados derivados
  isAuthenticated: boolean
  emailVerified: boolean
  profileCompleted: boolean
  requiresEmailVerification: boolean
  requiresProfileCompletion: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hook personalizado para usar el contexto
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Proveedor del contexto
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
    user: null,
    isLoading: true,
    error: null,
  })

  // Función auxiliar para actualizar el estado
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prevState => ({ ...prevState, ...updates }))
  }, [])

  // Función para manejar errores
  const handleError = useCallback((error: unknown) => {
    console.error('🚨 Auth Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    updateState({ 
      error: errorMessage, 
      isLoading: false 
    })
  }, [updateState])

  // Determinar el estado de autenticación basado en el usuario
  const determineAuthStatus = useCallback((user: User | null): AuthStatus => {
    if (!user) return 'unauthenticated'
    
    if (!user.emailVerified) return 'email-pending'
    if (!user.profileCompleted) return 'profile-pending'
    
    return 'authenticated'
  }, [])

  // Actualizar usuario y estado
  const updateUserAndStatus = useCallback((user: User | null) => {
    const status = determineAuthStatus(user)
    updateState({ 
      user, 
      status, 
      isLoading: false, 
      error: null 
    })
  }, [determineAuthStatus, updateState])

  // Inicialización: verificar si hay sesión activa
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          console.log('🔍 Verificando sesión existente...')
          const { user } = await authService.getCurrentUser()
          updateUserAndStatus(user)
        } else {
          console.log('❌ No hay sesión activa')
          updateState({ 
            status: 'unauthenticated', 
            user: null, 
            isLoading: false 
          })
        }
      } catch (error) {
        console.error('🚨 Error verificando sesión:', error)
        // Si hay error, limpiar sesión local
        await authService.logout()
        updateState({ 
          status: 'unauthenticated', 
          user: null, 
          isLoading: false 
        })
      }
    }

    initializeAuth()
  }, [updateUserAndStatus, updateState])

  // Registro nativo
  const registerNative = useCallback(async (data: RegisterData) => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('📝 Registrando usuario nativo...')
      await authService.registerNative(data)
      
      // Después del registro, el usuario queda en estado email-pending
      updateState({ 
        status: 'email-pending',
        isLoading: false,
        error: null 
      })
      
    } catch (error) {
      handleError(error)
    }
  }, [updateState, handleError])

  // Login nativo
  const loginNative = useCallback(async (data: LoginData) => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('🔐 Iniciando sesión nativa...')
      const response = await authService.loginNative(data)
      
      // Preservar businessId si existe en el usuario actual y no viene en la respuesta
      const currentBusinessId = state.user?.businessId
      const userWithBusinessId = {
        ...response.user,
        businessId: response.user.businessId || currentBusinessId
      }
      
      console.log('💼 Login - BusinessId preservado:', userWithBusinessId.businessId)
      updateUserAndStatus(userWithBusinessId)
      
    } catch (error) {
      handleError(error)
    }
  }, [updateState, handleError, updateUserAndStatus, state.user])

  // Autenticación con Google
  const authenticateWithGoogle = useCallback(async (data: GoogleAuthData) => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('🔴 Autenticando con Google...')
      const response = await authService.authenticateWithGoogle(data)
      
      updateUserAndStatus(response.user)
      
    } catch (error) {
      handleError(error)
    }
  }, [updateState, handleError, updateUserAndStatus])

  // Verificar email
  const verifyEmail = useCallback(async (token: string) => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('📧 Verificando email...')
      await authService.verifyEmail(token)
      
      // Refrescar datos del usuario después de la verificación
      if (authService.isAuthenticated()) {
        const { user } = await authService.getCurrentUser()
        updateUserAndStatus(user)
      } else {
        // Si no está autenticado, simplemente marcar como completado
        updateState({ isLoading: false, error: null })
      }
      
    } catch (error) {
      handleError(error)
    }
  }, [updateState, handleError, updateUserAndStatus])

  // Completar perfil
  const completeProfile = useCallback(async (data: CompleteProfileData) => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('👤 Completando perfil...')
      const response = await authService.completeProfile(data)
      
      updateUserAndStatus(response.user)
      
    } catch (error) {
      handleError(error)
    }
  }, [updateState, handleError, updateUserAndStatus])

  // Cerrar sesión
  const logout = useCallback(async () => {
    try {
      updateState({ isLoading: true, error: null })
      
      console.log('🚪 Cerrando sesión...')
      await authService.logout()
      
      updateState({ 
        status: 'unauthenticated',
        user: null,
        isLoading: false,
        error: null 
      })
      
    } catch (error) {
      // Incluso si falla la petición, limpiamos el estado local
      console.error('Error al cerrar sesión:', error)
      updateState({ 
        status: 'unauthenticated',
        user: null,
        isLoading: false,
        error: null 
      })
    }
  }, [updateState])

  // Limpiar error
  const clearError = useCallback(() => {
    updateState({ error: null, isLoading: false })
  }, [updateState])

  // Refrescar datos del usuario
  const refreshUserData = useCallback(async () => {
    try {
      if (authService.isAuthenticated()) {
        const { user } = await authService.getCurrentUser()
        updateUserAndStatus(user)
      }
    } catch (error) {
      console.error('Error refreshing user data:', error)
      handleError(error)
    }
  }, [updateUserAndStatus, handleError])

  // Estados derivados
  const contextValue: AuthContextType = {
    ...state,
    
    // Acciones
    registerNative,
    loginNative,
    authenticateWithGoogle,
    verifyEmail,
    completeProfile,
    logout,
    clearError,
    refreshUserData,
    
    // Estados derivados
    isAuthenticated: state.status === 'authenticated',
    emailVerified: state.user?.emailVerified ?? false,
    profileCompleted: state.user?.profileCompleted ?? false,
    requiresEmailVerification: state.status === 'email-pending',
    requiresProfileCompletion: state.status === 'profile-pending',
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider