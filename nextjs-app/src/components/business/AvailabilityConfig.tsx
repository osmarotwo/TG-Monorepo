'use client'

import { useState, useEffect } from 'react'
import { Clock, Plus, Trash2, Save, AlertCircle } from 'lucide-react'

interface TimeSlot {
  start: string
  end: string
}

interface DaySchedule {
  enabled: boolean
  slots: TimeSlot[]
  capacity: number
}

interface WeekSchedule {
  [key: string]: DaySchedule
}

const DAYS = [
  { key: 'monday', label: 'Lunes', labelEn: 'Monday' },
  { key: 'tuesday', label: 'Martes', labelEn: 'Tuesday' },
  { key: 'wednesday', label: 'Miércoles', labelEn: 'Wednesday' },
  { key: 'thursday', label: 'Jueves', labelEn: 'Thursday' },
  { key: 'friday', label: 'Viernes', labelEn: 'Friday' },
  { key: 'saturday', label: 'Sábado', labelEn: 'Saturday' },
  { key: 'sunday', label: 'Domingo', labelEn: 'Sunday' }
]

const defaultSlot: TimeSlot = { start: '09:00', end: '18:00' }
const defaultSchedule: WeekSchedule = DAYS.reduce((acc, day) => ({
  ...acc,
  [day.key]: {
    enabled: day.key !== 'sunday',
    slots: [{ ...defaultSlot }],
    capacity: 1
  }
}), {})

interface AvailabilityConfigProps {
  businessId?: string
  locationId?: string
  onSave?: (schedule: WeekSchedule) => Promise<void>
}

export default function AvailabilityConfig({ 
  businessId, 
  locationId, 
  onSave 
}: AvailabilityConfigProps) {
  const [schedule, setSchedule] = useState<WeekSchedule>(defaultSchedule)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [slotInterval, setSlotInterval] = useState(30) // minutos entre citas

  const toggleDay = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        enabled: !prev[dayKey].enabled
      }
    }))
  }

  const addSlot = (dayKey: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: [...prev[dayKey].slots, { ...defaultSlot }]
      }
    }))
  }

  const removeSlot = (dayKey: string, index: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.filter((_, i) => i !== index)
      }
    }))
  }

  const updateSlot = (dayKey: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        slots: prev[dayKey].slots.map((slot, i) => 
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const updateCapacity = (dayKey: string, value: number) => {
    setSchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        capacity: Math.max(1, value)
      }
    }))
  }

  const copyToAll = (dayKey: string) => {
    const daySchedule = schedule[dayKey]
    setSchedule(prev => 
      DAYS.reduce((acc, day) => ({
        ...acc,
        [day.key]: {
          enabled: day.key !== 'sunday',
          slots: daySchedule.slots.map(slot => ({ ...slot })),
          capacity: daySchedule.capacity
        }
      }), {})
    )
  }

  const handleSave = async () => {
    setLoading(true)
    setSaved(false)
    
    try {
      if (onSave) {
        await onSave(schedule)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Error al guardar la disponibilidad')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header con configuración global */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Configuración de Horarios</h2>
            <p className="text-sm text-gray-600 mt-1">
              Define tus horarios de atención y capacidad por día
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-[#13a4ec] text-white rounded-lg hover:bg-[#0f8fcd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar Cambios
              </>
            )}
          </button>
        </div>

        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
            <AlertCircle className="w-4 h-4" />
            Disponibilidad guardada exitosamente
          </div>
        )}

        {/* Configuración global */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intervalo entre citas (minutos)
            </label>
            <select
              value={slotInterval}
              onChange={(e) => setSlotInterval(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
            >
              <option value={15}>15 minutos</option>
              <option value={30}>30 minutos</option>
              <option value={45}>45 minutos</option>
              <option value={60}>60 minutos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configuración por día */}
      <div className="space-y-3">
        {DAYS.map((day) => {
          const daySchedule = schedule[day.key]
          
          return (
            <div
              key={day.key}
              className={`bg-white rounded-xl p-6 shadow-sm border transition-all ${
                daySchedule.enabled 
                  ? 'border-gray-200' 
                  : 'border-gray-100 opacity-60'
              }`}
            >
              {/* Header del día */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={daySchedule.enabled}
                    onChange={() => toggleDay(day.key)}
                    className="w-5 h-5 text-[#13a4ec] border-gray-300 rounded focus:ring-[#13a4ec]"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{day.label}</h3>
                    <p className="text-xs text-gray-500">{day.labelEn}</p>
                  </div>
                </div>

                {daySchedule.enabled && (
                  <button
                    onClick={() => copyToAll(day.key)}
                    className="text-xs text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
                  >
                    Copiar a todos los días
                  </button>
                )}
              </div>

              {daySchedule.enabled && (
                <div className="space-y-4">
                  {/* Horarios */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Horarios de atención
                    </label>
                    <div className="space-y-2">
                      {daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="time"
                              value={slot.start}
                              onChange={(e) => updateSlot(day.key, index, 'start', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                              type="time"
                              value={slot.end}
                              onChange={(e) => updateSlot(day.key, index, 'end', e.target.value)}
                              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                            />
                          </div>
                          {daySchedule.slots.length > 1 && (
                            <button
                              onClick={() => removeSlot(day.key, index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => addSlot(day.key)}
                        className="flex items-center gap-2 text-sm text-[#13a4ec] hover:text-[#0f8fcd] font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Agregar horario
                      </button>
                    </div>
                  </div>

                  {/* Capacidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Capacidad simultánea
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={daySchedule.capacity}
                        onChange={(e) => updateCapacity(day.key, Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#13a4ec] focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">
                        cliente{daySchedule.capacity > 1 ? 's' : ''} al mismo tiempo
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Los horarios se aplicarán a todas las citas futuras</li>
              <li>Puedes agregar múltiples bloques de horarios por día (ej: mañana y tarde)</li>
              <li>La capacidad indica cuántos clientes pueden tener cita al mismo tiempo</li>
              <li>Los cambios se reflejarán inmediatamente en la disponibilidad para clientes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
