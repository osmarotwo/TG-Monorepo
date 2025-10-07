'use client'

import { useEffect } from 'react'

export default function GoogleCallback() {
  useEffect(() => {
    console.log('🔄 Google callback cargado')
    console.log('📍 URL completa:', window.location.href)
    console.log('📍 Search params:', window.location.search)
    
    // Extraer el código de autorización
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get('code')
    const error = urlParams.get('error')
    const state = urlParams.get('state')
    
    console.log('📋 Parámetros del callback:', { code: !!code, error, state })
    
    if (error) {
      console.error('❌ Error en OAuth callback:', error)
      alert(`Error de autenticación: ${error}`)
      return
    }
    
    if (code && state === 'google_auth') {
      console.log('✅ Código de autorización recibido')
      
      // Por ahora, simplemente redirigir de vuelta con éxito
      // En un futuro aquí intercambiarías el código por tokens
      alert(`¡Éxito! Código de autorización recibido: ${code.substring(0, 20)}...

En una implementación completa, este código se intercambiaría por tokens en el backend.

Por ahora, te redirigiremos de vuelta a la página principal.`)
      
      // Redirigir de vuelta a la página principal
      window.location.href = '/'
    } else {
      console.error('❌ No se recibió código o estado incorrecto')
      alert('No se pudo completar la autenticación')
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Procesando autenticación con Google...
        </h2>
        <p className="text-gray-600">
          Por favor espera mientras completamos tu autenticación.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Si esta página no se cierra automáticamente, verifica la consola del navegador.
        </p>
      </div>
    </div>
  )
}