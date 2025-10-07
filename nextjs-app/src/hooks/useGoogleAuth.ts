'use client'

import { useEffect, useState } from 'react'

interface GoogleUser {
  id: string
  name: string
  email: string
  picture: string
  given_name: string
  family_name: string
}

interface GoogleNotification {
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => string
  isSkippedMoment: () => boolean
  getSkippedReason: () => string
  isDismissedMoment: () => boolean
  getDismissedReason: () => string
}

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: GoogleCredentialResponse) => void
            auto_select?: boolean
            cancel_on_tap_outside?: boolean
          }) => void
          prompt: (callback?: (notification: GoogleNotification) => void) => void
          disableAutoSelect: () => void
          renderButton: (container: HTMLElement, options: GoogleButtonOptions) => void
        }
      }
    }
  }
}

interface GoogleButtonOptions {
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: string
  locale?: string
}

interface GoogleCredentialResponse {
  credential: string
}

export function useGoogleAuth() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<GoogleUser | null>(null)

  useEffect(() => {
    const handleCredentialResponse = (response: GoogleCredentialResponse) => {
      console.log('🎉 ¡Respuesta recibida de Google!', response)
      
      try {
        // Decodificar el JWT token de Google con soporte UTF-8
        const credential = response.credential
        const base64Url = credential.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        }).join(''))
        
        const payload = JSON.parse(jsonPayload)
        
        console.log('📋 Datos del usuario (con codificación corregida):', payload)
        
        const googleUser: GoogleUser = {
          id: payload.sub,
          name: payload.name || '',
          email: payload.email || '',
          picture: payload.picture || '',
          given_name: payload.given_name || '',
          family_name: payload.family_name || '',
        }

        setUser(googleUser)
        
        // Aquí conectarías con tu backend para registrar/autenticar el usuario
        console.log('Usuario autenticado con Google (codificación UTF-8):', googleUser)
        
        // Simular registro en el backend
        registerUserWithGoogle(googleUser)
      } catch (error) {
        console.error('❌ Error procesando respuesta de Google:', error)
      }
    }

    const initializeGoogleAuth = () => {
      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        console.log('🔍 Inicializando Google Auth...')
        console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
        console.log('Origin:', window.location.origin)
        console.log('URL completa:', window.location.href)
        
        try {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse,
            auto_select: false, // No seleccionar automáticamente
            cancel_on_tap_outside: false, // No cancelar al hacer clic fuera
          })
          setIsLoaded(true)
          console.log('✅ Google Auth inicializado correctamente')
        } catch (error) {
          console.error('❌ Error inicializando Google Auth:', error)
        }
      } else {
        console.log('⚠️ Google SDK o Client ID no disponible')
      }
    }

    // Listener para mensajes del popup
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('🎉 Autenticación exitosa desde popup!')
        handleCredentialResponse({ credential: event.data.credential })
      }
    }

    window.addEventListener('message', handleMessage)

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

      return () => {
        clearInterval(checkGoogle)
        window.removeEventListener('message', handleMessage)
      }
    }

    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [])

  const openGoogleAuthPopup = () => {
    console.log('🔄 Abriendo popup de Google Auth...')
    
    // Crear un popup manual
    const popup = window.open('', 'google-signin', 'width=500,height=600,scrollbars=yes,resizable=yes')
    
    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Google Sign-In</title>
            <script src="https://accounts.google.com/gsi/client" async defer></script>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .container { max-width: 300px; margin: 0 auto; }
              h2 { color: #1f2937; margin-bottom: 20px; }
              .close-btn { margin-top: 20px; padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>Sign in with Google</h2>
              <div id="google-btn"></div>
              <button class="close-btn" onclick="window.close()">Cerrar</button>
            </div>
            <script>
              window.onload = function() {
                google.accounts.id.initialize({
                  client_id: '${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}',
                  callback: function(response) {
                    // Enviar datos al parent window
                    window.opener.postMessage({
                      type: 'GOOGLE_AUTH_SUCCESS',
                      credential: response.credential
                    }, '${window.location.origin}');
                    window.close();
                  }
                });
                
                google.accounts.id.renderButton(
                  document.getElementById("google-btn"),
                  { theme: "outline", size: "large", text: "signin_with" }
                );
              }
            </script>
          </body>
        </html>
      `)
      popup.document.close()
    } else {
      console.error('❌ No se pudo abrir el popup. Verifica que los popups estén habilitados.')
      alert('No se pudo abrir el popup. Por favor, habilita los popups en tu navegador.')
    }
  }

  const signInWithGoogle = () => {
    console.log('🚀 Intentando sign in con Google...')
    console.log('SDK cargado:', !!window.google)
    console.log('isLoaded:', isLoaded)
    console.log('Client ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)
    console.log('Origin:', window.location.origin)
    
    if (window.google && isLoaded) {
      try {
        // Primero deshabilitar auto-select para forzar el popup
        window.google.accounts.id.disableAutoSelect()
        
        // Usar prompt con callback para manejar la respuesta
        window.google.accounts.id.prompt((notification: GoogleNotification) => {
          console.log('📱 Notificación de prompt:', notification)
          
          if (notification.isNotDisplayed()) {
            console.log('⚠️ Popup no mostrado:', notification.getNotDisplayedReason())
            openGoogleAuthPopup()
          } else if (notification.isSkippedMoment()) {
            console.log('⏭️ Momento saltado:', notification.getSkippedReason())
            // ¡IMPORTANTE! También abrir popup cuando se salta el momento
            openGoogleAuthPopup()
          }
        })
        
      } catch (error) {
        console.error('❌ Error al hacer prompt:', error)
        alert(`Error al iniciar Google Sign-In: ${error}`)
      }
    } else {
      alert('Google SDK aún no está cargado. Intenta de nuevo en un momento.')
    }
  }

  const signOut = () => {
    setUser(null)
    if (window.google) {
      window.google.accounts.id.disableAutoSelect()
    }
  }

  return {
    user,
    isLoaded,
    signInWithGoogle,
    signOut,
  }
}

// Función para simular el registro en el backend
async function registerUserWithGoogle(googleUser: GoogleUser) {
  // Por ahora solo simular el éxito (sin intentar llamar al backend)
  console.log('Simulando registro exitoso para:', googleUser)
  
  // Mensaje de bienvenida con codificación correcta
  const welcomeMessage = `¡Registro simulado exitoso! 🎉

Bienvenido ${googleUser.given_name}!

Datos recibidos:
• Nombre: ${googleUser.name}
• Email: ${googleUser.email}
• ID de Google: ${googleUser.id}

En producción, estos datos se enviarían a tu backend para crear la cuenta.`
  
  alert(welcomeMessage)

  // TODO: Cuando tengas el backend listo, descomenta esto:
  /*
  try {
    const response = await fetch('/api/auth/google-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        googleId: googleUser.id,
        name: googleUser.name,
        email: googleUser.email,
        picture: googleUser.picture,
        firstName: googleUser.given_name,
        lastName: googleUser.family_name,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      alert(`¡Registro exitoso! Bienvenido ${googleUser.given_name}! 🎉`)
      console.log('Usuario registrado exitosamente:', result)
    } else {
      throw new Error('Error en el registro')
    }
  } catch (error) {
    console.error('Error registrando usuario:', error)
  }
  */
}