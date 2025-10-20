/**
 * Loading Skeleton Components
 * Skeletons para cards mientras cargan datos
 */

import React from 'react'

export function AppointmentCardSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-4 bg-white/50 backdrop-blur-sm rounded-xl p-4 animate-pulse">
      {/* Image skeleton */}
      <div className="w-full md:w-1/3 h-48 md:h-auto bg-gray-300 rounded-lg"></div>
      
      {/* Content skeleton */}
      <div className="flex-1 space-y-3">
        {/* Badge */}
        <div className="w-32 h-6 bg-gray-300 rounded-full"></div>
        
        {/* Service name */}
        <div className="w-3/4 h-7 bg-gray-300 rounded"></div>
        
        {/* Specialist */}
        <div className="w-1/2 h-5 bg-gray-300 rounded"></div>
        
        {/* Customer */}
        <div className="w-2/3 h-5 bg-gray-300 rounded"></div>
        
        {/* Time */}
        <div className="w-1/3 h-5 bg-gray-300 rounded"></div>
        
        {/* Button */}
        <div className="w-full h-10 bg-gray-300 rounded-lg mt-4"></div>
      </div>
    </div>
  )
}

export function LocationCardSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 animate-pulse">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 bg-gray-300 rounded-lg flex-shrink-0"></div>
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="w-3/4 h-5 bg-gray-300 rounded"></div>
          <div className="w-full h-4 bg-gray-300 rounded"></div>
          <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 animate-pulse">
      <div className="space-y-3">
        {/* Label */}
        <div className="w-1/2 h-4 bg-gray-300 rounded"></div>
        
        {/* Value */}
        <div className="w-3/4 h-10 bg-gray-300 rounded"></div>
        
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="w-full h-2 bg-gray-300 rounded-full"></div>
          <div className="w-1/3 h-3 bg-gray-300 rounded"></div>
        </div>
      </div>
    </div>
  )
}

export function MapSkeleton() {
  return (
    <div className="relative h-80 bg-gray-300 rounded-xl animate-pulse overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-gray-400 text-lg">Cargando mapa...</div>
      </div>
    </div>
  )
}
