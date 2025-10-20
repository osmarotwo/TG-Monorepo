import React, { useState } from 'react';
import { Location } from '@/services/api/locations';

interface MapSectionProps {
  locations: Location[];
  height?: string;
}

export default function MapSection({ locations, height = 'h-80' }: MapSectionProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Calculate center point (average of all locations)
  const centerLat = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length
    : 4.711;
  
  const centerLng = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length
    : -74.073;
  
  // Calculate cities count
  const getCitiesCount = () => {
    const cities = new Set(locations.map(loc => loc.city));
    return cities.size;
  };
  
  // Generate Google Maps Static API URL (ready for production)
  // TODO: Add your Google Maps API Key to .env.local as NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const generateMapUrl = () => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey) {
      // Fallback to placeholder if no API key
      return `https://placehold.co/1200x600/e8f4f8/13a4ec?text=Mapa+de+Ubicaciones+(${locations.length})`;
    }
    
    // Build markers string for Google Maps Static API
    const markers = locations
      .map(loc => `markers=color:0x13a4ec%7Clabel:${loc.name.charAt(0)}%7C${loc.latitude},${loc.longitude}`)
      .join('&');
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=12&size=1200x600&${markers}&key=${apiKey}`;
  };
  
  const mapUrl = generateMapUrl();
  
  return (
    <div className={`relative ${height} w-full rounded-xl overflow-hidden shadow-md`}>
      {/* Map image placeholder */}
      <div
        className="w-full h-full bg-cover bg-center"
        style={{ backgroundImage: `url(${mapUrl})` }}
      >
        {/* Overlay with location count */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {locations.length} {locations.length === 1 ? 'Sede' : 'Sedes'} en {getCitiesCount()} {getCitiesCount() === 1 ? 'Ciudad' : 'Ciudades'}
              </p>
              <p className="text-xs text-gray-600">
                Centro: {centerLat.toFixed(4)}, {centerLng.toFixed(4)}
              </p>
            </div>
            
            <button 
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 bg-[#13a4ec] text-white text-sm font-medium rounded-lg hover:bg-[#0f8fcd] transition-colors"
            >
              🗺️ Ver Mapa Completo
            </button>
          </div>
        </div>
        
        {/* Location markers (visual indicators) */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="grid grid-cols-2 gap-4">
            {locations.slice(0, 4).map((loc, index) => (
              <div
                key={loc.locationId}
                className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md"
              >
                <div className="h-3 w-3 rounded-full bg-[#13a4ec] animate-pulse" />
                <span className="text-xs font-medium text-gray-900 truncate max-w-[120px]">
                  {loc.name.replace('Salón Aurora - Sede ', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Future: Integrate real map
      <div id="map" className="w-full h-full" />
      */}
      
      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-2xl overflow-hidden animate-slideUp">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setIsFullscreen(false)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg shadow-lg transition-colors"
              >
                ✕ Cerrar
              </button>
            </div>
            <div
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${mapUrl})` }}
            >
              {/* Location list overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg max-h-48 overflow-y-auto">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Todas las Sedes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {locations.map(loc => (
                    <div key={loc.locationId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <div className="h-3 w-3 rounded-full bg-[#13a4ec]" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{loc.name}</p>
                        <p className="text-xs text-gray-600 truncate">{loc.city}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
