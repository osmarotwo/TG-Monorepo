'use client'

import { useEffect } from 'react'

export default function AuthCallback() {
  useEffect(() => {
    console.log('🔄 Página de callback cargada')
    console.log('📍 URL completa:', window.location.href)
    console.log('📍 Hash:', window.location.hash)
    
    // Extraer el token del hash de la URL
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    
    const idToken = params.get('id_token')
    const accessToken = params.get('access_token')
    const error = params.get('error')
    
    console.log('📋 Parámetros del callback:', { 
      idToken: idToken ? idToken.substring(0, 50) + '...' : null, 
      accessToken: accessToken ? accessToken.substring(0, 30) + '...' : null, 
      error 
    })
    
    if (error) {
      console.error('❌ Error en OAuth callback:', error)
      alert(`Error de autenticación: ${error}`)
      window.close()
      return
    }
    
    if (idToken) {
      console.log('✅ Token ID recibido, enviando al parent')
      
      // Enviar el token al parent window
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_TOKEN',
          token: idToken
        }, window.location.origin)
        
        // Cerrar el popup después de un breve delay
        setTimeout(() => {
          window.close()
        }, 1000)
      } else {
        // Si no hay opener, redirigir a la página principal
        console.log('🔄 No hay opener, redirigiendo a home')
        window.location.href = '/'
      }
    } else {
      console.error('❌ No se recibió token ID')
      alert('No se pudo completar la autenticación')
      window.close()
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Procesando autenticación...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras completamos tu inicio de sesión con Google.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Esta ventana se cerrará automáticamente.
        </p>
      </div>
    </div>
  )
}