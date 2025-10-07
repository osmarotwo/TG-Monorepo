'use client'

import { useState } from 'react'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'

export default function HomePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('¡Formulario funcionando! Datos: ' + JSON.stringify(formData, null, 2))
  }

  return (
    <div className="font-sans bg-gray-100 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl bg-white/90 backdrop-blur-sm shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-blue-500 p-3 rounded-full mb-4">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Your Account</h1>
          <p className="mt-2 text-sm text-gray-600">Join us to manage your appointments seamlessly.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Nombre completo */}
          <div>
            <label className="sr-only" htmlFor="name">Full Name</label>
            <input
              className="w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 p-3"
              id="name"
              name="name"
              placeholder="Full Name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="sr-only" htmlFor="email">Email</label>
            <input
              className="w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 p-3"
              id="email"
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="sr-only" htmlFor="password">Password</label>
            <input
              className="w-full rounded-lg bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 p-3"
              id="password"
              name="password"
              placeholder="Password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Password requirements */}
          <div className="px-1">
            <p className="text-xs text-gray-500">
              Password must be at least 8 characters long and include one number, one uppercase letter, and one special character.
            </p>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign up
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>
        </div>

        {/* Google Sign-in */}
        <div className="mt-6">
          <GoogleAuthButton />
        </div>

        {/* Sign in link */}
        <p className="mt-8 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <a href="#" className="font-medium text-blue-500 hover:text-blue-400">
            Sign in
          </a>
        </p>
      </div>
    </div>
  )
}