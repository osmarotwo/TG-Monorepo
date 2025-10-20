import React from 'react';
import { Location } from '@/services/api/locations';

interface LocationCardProps {
  location: Location;
  onClick?: (locationId: string) => void;
}

export default function LocationCard({ location, onClick }: LocationCardProps) {
  // Image fallback
  const imageUrl = location.imageUrl || `https://placehold.co/64x64/13a4ec/white?text=${location.name.charAt(0)}`;
  
  // Status indicator
  const statusColor = location.status === 'active' ? 'bg-green-500' : 'bg-gray-400';
  
  return (
    <div
      onClick={() => onClick?.(location.locationId)}
      className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white/50 backdrop-blur-sm p-4 hover:shadow-md hover:scale-[1.02] transition-all duration-300 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        <div
          className="h-16 w-16 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
        {/* Status indicator */}
        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${statusColor} border-2 border-white`} />
      </div>
      
      {/* Info */}
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <h4 className="text-base font-bold text-gray-900 truncate">
          {location.name}
        </h4>
        
        <p className="text-sm text-gray-600 truncate">
          📍 {location.address}, {location.city}
        </p>
        
        {location.distance && (
          <p className="text-xs text-gray-500">
            {location.distance}
          </p>
        )}
        
        {location.currentOccupancy !== undefined && (
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#13a4ec] rounded-full transition-all"
                style={{ width: `${location.currentOccupancy}%` }}
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">
              {location.currentOccupancy}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
