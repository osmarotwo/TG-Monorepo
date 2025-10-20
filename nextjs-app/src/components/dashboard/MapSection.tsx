/**
 * MapSection Component
 * Interactive Google Maps with markers and navigation controls
 */

'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Location } from '@/services/api/locations';

interface MapSectionProps {
  locations: Location[];
  height?: string;
}

export default function MapSection({ locations, height = 'h-80' }: MapSectionProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const fullscreenMapRef = useRef<HTMLDivElement>(null);

  // Calculate center point
  const centerLat = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length
    : 4.711;
  
  const centerLng = locations.length > 0
    ? locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length
    : -74.073;
  
  const getCitiesCount = () => {
    const cities = new Set(locations.map(loc => loc.city));
    return cities.size;
  };

  // Load Google Maps Script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return;
    }

    // @ts-ignore - Check if Google Maps API is fully available
    if (window.google?.maps?.Map) {
      console.log('✅ Google Maps already loaded');
      setIsLoaded(true);
      return;
    }

    // Check if script is already in the DOM
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com/maps/api/js"]'
    );
    
    if (existingScript) {
      console.log('⏳ Google Maps script found, waiting for API to be ready...');
      // Script exists, poll for API availability
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.google?.maps?.Map) {
          console.log('✅ Google Maps API ready');
          clearInterval(checkInterval);
          setIsLoaded(true);
        }
      }, 100);
      
      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
      return;
    }

    console.log('📥 Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&loading=async`;
    script.async = true;
    script.defer = true;
    script.id = 'google-maps-script';
    script.onload = () => {
      console.log('📦 Script loaded, waiting for API...');
      // Poll for API availability after script loads
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.google?.maps?.Map) {
          console.log('✅ Google Maps API ready');
          clearInterval(checkInterval);
          setIsLoaded(true);
        }
      }, 100);
      
      // Cleanup after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000);
    };
    script.onerror = () => {
      console.error('❌ Error loading Google Maps script');
    };
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || locations.length === 0) return;

    // @ts-ignore - Verify Google Maps API is fully loaded
    if (!window.google?.maps?.Map) {
      console.log('⚠️ Google Maps API not ready yet, waiting...');
      return;
    }
    
    // @ts-ignore - Google Maps API
    const google = window.google;
    
    try {
      const map = new google.maps.Map(mapRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 12,
        mapTypeControl: true,
        zoomControl: true,
        streetViewControl: true,
        fullscreenControl: false,
        mapId: 'LOCATIONS_MAP', // Requerido para AdvancedMarkerElement
      });

      const bounds = new google.maps.LatLngBounds();
    
    locations.forEach((location) => {
      // Crear elemento HTML personalizado para el marcador
      const pin = document.createElement('div')
      pin.className = 'location-marker'
      pin.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background-color: #DC2626;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: white;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${location.name.substring(0, 1)}
        </div>
      `

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: location.latitude, lng: location.longitude },
        content: pin,
        title: location.name,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 12px; max-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <h3 style="margin: 0 0 8px 0; color: #DC2626; font-size: 16px; font-weight: bold;">
              ${location.name}
            </h3>
            <p style="margin: 4px 0; color: #1F2937; font-size: 14px;">
              📍 ${location.address}
            </p>
            <p style="margin: 4px 0; color: #1F2937; font-size: 14px;">
              🏙️ ${location.city}
            </p>
            ${location.phone ? `
              <p style="margin: 4px 0; color: #1F2937; font-size: 14px;">
                📞 ${location.phone}
              </p>
            ` : ''}
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}" 
              target="_blank"
              rel="noopener noreferrer"
              style="display: inline-block; margin-top: 8px; padding: 6px 12px; background: #DC2626; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: bold;"
            >
              🗺️ Cómo llegar
            </a>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open({
          anchor: marker,
          map,
        })
      });

      bounds.extend({ lat: location.latitude, lng: location.longitude });
    });

    if (locations.length > 1) {
      map.fitBounds(bounds);
    }
    } catch (error) {
      console.error('❌ Error initializing Google Maps:', error);
    }
  }, [isLoaded, locations, centerLat, centerLng]);

  // Initialize fullscreen map
  useEffect(() => {
    if (!isFullscreen || !isLoaded || !fullscreenMapRef.current || locations.length === 0) return;

    // @ts-ignore - Verify Google Maps API is fully loaded
    if (!window.google?.maps?.Map) {
      console.log('⚠️ Google Maps API not ready for fullscreen yet, waiting...');
      return;
    }
    
    // @ts-ignore - Google Maps API
    const google = window.google;
    
    try {
      const map = new google.maps.Map(fullscreenMapRef.current, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 12,
      mapTypeControl: true,
      zoomControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      mapId: 'LOCATIONS_MAP_FULLSCREEN', // Requerido para AdvancedMarkerElement
    });

    const bounds = new google.maps.LatLngBounds();
    
    locations.forEach((location) => {
      // Crear elemento HTML personalizado para el marcador fullscreen
      const pin = document.createElement('div')
      pin.className = 'location-marker-fullscreen'
      pin.innerHTML = `
        <div style="
          width: 48px;
          height: 48px;
          background-color: #DC2626;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 10px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: bold;
          color: white;
          cursor: pointer;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.15)'" onmouseout="this.style.transform='scale(1)'">
          ${location.name.substring(0, 1)}
        </div>
      `

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: location.latitude, lng: location.longitude },
        content: pin,
        title: location.name,
      })

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding: 16px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
            <h3 style="margin: 0 0 12px 0; color: #DC2626; font-size: 18px; font-weight: bold;">
              ${location.name}
            </h3>
            <p style="margin: 6px 0; color: #1F2937; font-size: 15px;">
              📍 ${location.address}
            </p>
            <p style="margin: 6px 0; color: #1F2937; font-size: 15px;">
              🏙️ ${location.city}
            </p>
            ${location.phone ? `
              <p style="margin: 6px 0; color: #1F2937; font-size: 15px;">
                📞 ${location.phone}
              </p>
            ` : ''}
            <a 
              href="https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}" 
              target="_blank"
              rel="noopener noreferrer"
              style="display: inline-block; margin-top: 12px; padding: 10px 16px; background: #13a4ec; color: white; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: bold;"
            >
              🗺️ Cómo llegar
            </a>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open({
          anchor: marker,
          map,
        })
      })

      bounds.extend({ lat: location.latitude, lng: location.longitude });
    });

    if (locations.length > 1) {
      map.fitBounds(bounds);
    }
    } catch (error) {
      console.error('❌ Error initializing fullscreen Google Maps:', error);
    }
  }, [isFullscreen, isLoaded, locations, centerLat, centerLng]);

  // Fallback static image
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const useInteractiveMap = isLoaded && apiKey && apiKey !== 'YOUR_API_KEY_HERE';

  const generateStaticMapUrl = () => {
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      return `https://placehold.co/1200x600/e8f4f8/13a4ec?text=Configurar+API+Key+de+Google+Maps`;
    }
    
    const markers = locations
      .map(loc => `markers=color:0x13a4ec%7Clabel:${loc.name.charAt(0)}%7C${loc.latitude},${loc.longitude}`)
      .join('&');
    
    return `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=12&size=1200x600&${markers}&key=${apiKey}`;
  };
  
  return (
    <div className={`relative ${height} w-full rounded-xl overflow-hidden shadow-md bg-gray-100`}>
      {/* Interactive Map or Static Image */}
      {useInteractiveMap ? (
        <div ref={mapRef} className="w-full h-full" />
      ) : (
        <div
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${generateStaticMapUrl()})` }}
        />
      )}
      
      {/* Overlay with info */}
      <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {locations.length} {locations.length === 1 ? 'Sede' : 'Sedes'} en {getCitiesCount()} {getCitiesCount() === 1 ? 'Ciudad' : 'Ciudades'}
            </p>
            {useInteractiveMap && (
              <p className="text-xs text-gray-600">
                💡 Click en los marcadores para ver detalles
              </p>
            )}
          </div>
          
          <button 
            onClick={() => setIsFullscreen(true)}
            className="px-3 py-1.5 bg-[#13a4ec] text-white text-sm font-medium rounded-lg hover:bg-[#0f8fcd] transition-colors"
          >
            🗺️ Ampliar
          </button>
        </div>
      </div>
      
      {/* Fullscreen Map Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-2xl overflow-hidden animate-slideUp">
            {/* Close button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setIsFullscreen(false)}
                className="bg-white hover:bg-gray-100 text-gray-800 font-bold px-4 py-2 rounded-lg shadow-lg transition-colors"
              >
                ✕ Cerrar
              </button>
            </div>
            
            {/* Fullscreen map */}
            {useInteractiveMap ? (
              <div ref={fullscreenMapRef} className="w-full h-full" />
            ) : (
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${generateStaticMapUrl()})` }}
              />
            )}
            
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
      )}
    </div>
  );
}
