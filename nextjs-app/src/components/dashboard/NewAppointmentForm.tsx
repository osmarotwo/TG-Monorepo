/**
 * New Appointment Form
 * Formulario para agendar nueva cita
 */

'use client'

import React, { useState } from 'react'

interface NewAppointmentFormProps {
  onSubmit: (data: AppointmentFormData) => void
  onCancel: () => void
}

export interface AppointmentFormData {
  locationId: string
  serviceType: string
  specialistId: string
  customerName: string
  customerPhone: string
  date: string
  time: string
  notes?: string
}

export default function NewAppointmentForm({ onSubmit, onCancel }: NewAppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>({
    locationId: '',
    serviceType: '',
    specialistId: '',
    customerName: '',
    customerPhone: '',
    date: '',
    time: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <label htmlFor="locationId" className="block text-sm font-medium text-gray-700 mb-2">
          Sede *
        </label>
        <select
          id="locationId"
          name="locationId"
          required
          value={formData.locationId}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
        >
          <option value="">Selecciona una sede</option>
          <option value="LOC001">Salón Aurora - Chapinero</option>
          <option value="LOC002">Salón Aurora - Chía</option>
          <option value="LOC003">Salón Aurora - Usaquén</option>
        </select>
      </div>

      {/* Service Type */}
      <div>
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
          Servicio *
        </label>
        <select
          id="serviceType"
          name="serviceType"
          required
          value={formData.serviceType}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
        >
          <option value="">Selecciona un servicio</option>
          <option value="Haircut">Corte de Cabello</option>
          <option value="Color">Tinte</option>
          <option value="Manicure">Manicure</option>
          <option value="Pedicure">Pedicure</option>
          <option value="Facial">Facial</option>
        </select>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
            Nombre del Cliente *
          </label>
          <input
            type="text"
            id="customerName"
            name="customerName"
            required
            value={formData.customerName}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
            placeholder="María González"
          />
        </div>

        <div>
          <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Teléfono *
          </label>
          <input
            type="tel"
            id="customerPhone"
            name="customerPhone"
            required
            value={formData.customerPhone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
            placeholder="+57 300 123 4567"
          />
        </div>
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            Fecha *
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
            Hora *
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
          Notas (opcional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={formData.notes}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-[#13a4ec] bg-[#f6f7f8]"
          placeholder="Cualquier información adicional..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-[#13a4ec] hover:bg-[#0f8fcd] text-white font-bold py-3 rounded-lg transition-colors"
        >
          Agendar Cita
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
