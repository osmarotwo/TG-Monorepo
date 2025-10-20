/**
 * IndustryFilter Component
 * Filtro por tipo de industria con chips seleccionables
 */

import React from 'react'

export type Industry = 'all' | 'beauty' | 'restaurant' | 'retail' | 'logistics' | 'banking'

interface IndustryOption {
  value: Industry
  label: string
  icon: string
}

interface IndustryFilterProps {
  selected: Industry
  onChange: (industry: Industry) => void
}

const INDUSTRY_OPTIONS: IndustryOption[] = [
  { value: 'all', label: 'Todos', icon: '🏢' },
  { value: 'beauty', label: 'Belleza', icon: '💇‍♀️' },
  { value: 'restaurant', label: 'Restaurantes', icon: '🍽️' },
  { value: 'retail', label: 'Retail', icon: '🛍️' },
  { value: 'logistics', label: 'Logística', icon: '📦' },
  { value: 'banking', label: 'Banca', icon: '🏦' },
]

export default function IndustryFilter({ selected, onChange }: IndustryFilterProps) {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-bold text-gray-900">Filtrar por industria:</h3>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {INDUSTRY_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
              transition-all duration-200
              ${
                selected === option.value
                  ? 'bg-[#13a4ec] text-white shadow-md scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:shadow-sm'
              }
            `}
          >
            <span className="text-lg">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
