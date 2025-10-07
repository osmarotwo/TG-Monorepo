'use client'

import { useState } from 'react'
import { GoogleIcon } from '@/components/GoogleIcon'

export default function HomePage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Formulario enviado:', formData)
    alert('¡Formulario funcionando! Datos: ' + JSON.stringify(formData, null, 2))
  }

  const handleGoogleSignIn = () => {
    console.log('Google Sign-In clicked')
    alert('¡Botón de Google funcionando! (Aquí se integraría con Google OAuth)')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Avatar */}
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-white text-3xl font-bold">👤</span>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
          Crea tu cuenta
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Únete para gestionar tus citas sin problemas.
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Contraseña"
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <div className="text-sm text-gray-600">
            La contraseña debe tener al menos 8 caracteres e incluir un número, una letra mayúscula y un carácter especial.
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Registrarse
          </button>
        </form>

        {/* Divisor */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">O regístrate con</span>
          </div>
        </div>

        {/* Botón Google */}
        <button
          onClick={handleGoogleSignIn}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <GoogleIcon />
          <span className="font-medium text-gray-700">Continuar con Google</span>
        </button>

        {/* Link de login */}
        <div className="text-center mt-6 text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <button 
            onClick={() => alert('Ir a login')}
            className="text-blue-500 hover:text-blue-600 font-medium"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
