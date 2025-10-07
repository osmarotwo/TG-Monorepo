'use client'

import { useState, useEffect } from 'react'

// Interfaces
interface GoogleUser {
  email: string
  name: string
  picture: string
  sub: string
}

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleInitConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select: boolean
  cancel_on_tap_outside: boolean
}

interface GoogleNotification {
  isNotDisplayed?: () => boolean
  isSkippedMoment?: () => boolean
  getMomentType?: () => string
  getNotDisplayedReason?: () => string
  getSkippedReason?: () => string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleInitConfig) => void
          prompt: (callback?: (notification: GoogleNotification) => void) => void
          renderButton: (element: HTMLElement, config: GoogleInitConfig) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

export const useGoogleAuth = () => {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCredentialResponse = (response: GoogleCredentialResponse) => {
    console.log('Respuesta recibida de Google!', response)
    
    try {
      // Decodificar el JWT token de Google con soporte UTF-8
      const credential = response.credential
      const base64Url = credential.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))

      const userData = JSON.parse(jsonPayload)
      console.log('Usuario autenticado:', userData)

      const googleUser: GoogleUser = {
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        sub: userData.sub
      }

      setUser(googleUser)
      setError(null)
      
      localStorage.setItem('googleUser', JSON.stringify(googleUser))
      
    } catch (error) {
      console.error('Error al procesar la respuesta de Google:', error)
      setError('Error al procesar la respuesta de Google')
    }
  }

  useEffect(() => {
    // Verificar si hay usuario guardado
    const savedUser = localStorage.getItem('googleUser')
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error al cargar usuario guardado:', error)
        localStorage.removeItem('googleUser')
      }
    }

    const initializeGoogleAuth = () => {
      console.log('Inicializando Google Auth...')
      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        })
        setIsLoaded(true)
        console.log('Google Auth inicializado correctamente')
      }
    }

    // Verificar si Google SDK ya está cargado
    if (window.google) {
      initializeGoogleAuth()
    } else {
      // Esperar a que se cargue el SDK
      const checkGoogle = setInterval(() => {
        if (window.google) {
          initializeGoogleAuth()
          clearInterval(checkGoogle)
        }
      }, 100)

      // Cleanup después de 10 segundos
      setTimeout(() => {
        clearInterval(checkGoogle)
        if (!window.google) {
          setError('Google SDK no se pudo cargar')
        }
      }, 10000)
    }
  }, [])

  const signInWithGoogle = () => {
    console.log('Iniciando Google Auth - Redirección directa')
    console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
    console.log('Origin:', window.location.origin)
    
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      alert('Google Client ID no configurado. Verifica las variables de entorno.')
      return
    }

    try {
      // Método simple y confiable: redirección directa
      console.log('Usando redirección directa a Google')
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('openid email profile')}&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/auth/google')}&` +
        `state=google_auth&` +
        `access_type=offline&` +
        `prompt=select_account`
      
      console.log('Redirigiendo a Google OAuth:', authUrl)
      
      // Confirmar con el usuario antes de redirigir
      const proceed = confirm(`Te vamos a redirigir a Google para completar tu registro.

¿Continuar con Google Auth?

Nota: Después de autenticarte, volverás a esta página automáticamente.`)
      
      if (proceed) {
        console.log('Usuario confirmó redirección')
        window.location.href = authUrl
      } else {
        console.log('Usuario canceló la autenticación')
      }
    } catch (error) {
      console.error('Error con la redirección:', error)
      alert('Error al inicializar Google Auth. Verifica la configuración.')
    }
  }

  const signOut = () => {
    console.log('Cerrando sesión de usuario...')
    setUser(null)
    setError(null)
    localStorage.removeItem('googleUser')
    
    // Desactivar auto-selección de Google
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
    
    console.log('Sesión cerrada exitosamente')
  }

  return {
    user,
    isLoaded,
    error,
    signInWithGoogle,
    signOut,
  }
}