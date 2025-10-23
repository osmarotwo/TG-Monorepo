/**
 * Algoritmo de optimización de rutas CON reprogramación de citas
 * 
 * Este algoritmo:
 * 1. Calcula la ruta geográficamente óptima (TSP)
 * 2. Para cada cita, consulta disponibilidad en el horario óptimo
 * 3. Propone nuevos horarios si es necesario
 * 4. Retorna la optimización con los cambios de horario
 */

import { checkMultipleAvailability, RescheduledAppointment } from '../api/availabilityService';

export interface Appointment {
  id: string;
  locationId: string;
  locationName: string;
  clientName: string;
  serviceType: string;
  startTime: string;
  endTime: string;
  estimatedDuration: number; // Duración del servicio en minutos
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export interface OptimizationResult {
  originalRoute: Appointment[];
  optimizedRoute: Appointment[];
  originalMetrics: RouteMetrics;
  optimizedMetrics: RouteMetrics;
  rescheduledAppointments: RescheduledAppointment[];
  improvements: {
    distanceReduction: number;
    distanceReductionPercentage: number;
    timeReduction: number;
    timeReductionPercentage: number;
  };
}

export interface RouteMetrics {
  totalDistance: number;
  totalTime: number;
  appointmentCount: number;
}

const AVERAGE_SPEED_KMH = 30;
const SERVICE_DURATION_MINUTES = 60;

/**
 * Helper para parsear date (YYYY-MM-DD) y time (HH:MM) a Date object
 * @deprecated - Not currently used, consider removing
 */
/* function parseAppointmentDateTime(date: string, time: string): Date | null {
  if (!date || !time) {
    console.error('❌ parseAppointmentDateTime: Missing date or time', { date, time });
    return null;
  }
  
  try {
    // date = "2025-10-22", time = "14:00"
    const dateTimeString = `${date}T${time}:00`;
    const parsedDate = new Date(dateTimeString);
    
    if (isNaN(parsedDate.getTime())) {
      console.error('❌ parseAppointmentDateTime: Invalid date', { date, time, dateTimeString });
      return null;
    }
    
    return parsedDate;
  } catch (error) {
    console.error('❌ parseAppointmentDateTime: Error parsing', { date, time, error });
    return null;
  }
} */

/**
 * Calcula distancia entre dos puntos (fórmula de Haversine)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcula métricas de una ruta
 */
function calculateRouteMetrics(
  route: Appointment[],
  userLocation: { lat: number; lng: number }
): RouteMetrics {
  let totalDistance = 0;
  let currentLat = userLocation.lat;
  let currentLng = userLocation.lng;
  
  for (const appointment of route) {
    const distance = calculateDistance(
      currentLat,
      currentLng,
      appointment.location.lat,
      appointment.location.lng
    );
    totalDistance += distance;
    currentLat = appointment.location.lat;
    currentLng = appointment.location.lng;
  }
  
  // Distancia de regreso al punto de inicio
  if (route.length > 0) {
    totalDistance += calculateDistance(
      currentLat,
      currentLng,
      userLocation.lat,
      userLocation.lng
    );
  }
  
  const totalTime = (totalDistance / AVERAGE_SPEED_KMH) * 60; // en minutos
  
  return {
    totalDistance,
    totalTime,
    appointmentCount: route.length
  };
}

/**
 * Resuelve TSP usando algoritmo greedy (nearest neighbor)
 */
function solveTSP(
  appointments: Appointment[],
  startLocation: { lat: number; lng: number }
): Appointment[] {
  if (appointments.length === 0) return [];
  
  const visited = new Set<string>();
  const route: Appointment[] = [];
  let currentLat = startLocation.lat;
  let currentLng = startLocation.lng;
  
  while (route.length < appointments.length) {
    let nearestAppointment: Appointment | null = null;
    let nearestDistance = Infinity;
    
    for (const appointment of appointments) {
      if (visited.has(appointment.id)) continue;
      
      const distance = calculateDistance(
        currentLat,
        currentLng,
        appointment.location.lat,
        appointment.location.lng
      );
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestAppointment = appointment;
      }
    }
    
    if (nearestAppointment) {
      route.push(nearestAppointment);
      visited.add(nearestAppointment.id);
      currentLat = nearestAppointment.location.lat;
      currentLng = nearestAppointment.location.lng;
    }
  }
  
  return route;
}

/**
 * Calcula horarios propuestos para una ruta optimizada
 * IMPORTANTE: Usa la duración real de cada servicio (estimatedDuration)
 */
function calculateProposedTimes(
  route: Appointment[],
  userLocation: { lat: number; lng: number },
  startTime: Date
): { appointmentId: string; proposedTime: Date }[] {
  const proposedTimes: { appointmentId: string; proposedTime: Date }[] = [];
  let currentTime = new Date(startTime);
  let currentLat = userLocation.lat;
  let currentLng = userLocation.lng;
  
  for (const appointment of route) {
    // Calcular tiempo de viaje
    const distance = calculateDistance(
      currentLat,
      currentLng,
      appointment.location.lat,
      appointment.location.lng
    );
    const travelTimeMinutes = (distance / AVERAGE_SPEED_KMH) * 60;
    
    // Sumar tiempo de viaje
    currentTime = new Date(currentTime.getTime() + travelTimeMinutes * 60 * 1000);
    
    // Guardar horario propuesto
    proposedTimes.push({
      appointmentId: appointment.id,
      proposedTime: new Date(currentTime)
    });
    
    // Sumar duración REAL del servicio (no hardcoded)
    const serviceDuration = appointment.estimatedDuration || SERVICE_DURATION_MINUTES; // fallback por seguridad
    currentTime = new Date(currentTime.getTime() + serviceDuration * 60 * 1000);
    currentLat = appointment.location.lat;
    currentLng = appointment.location.lng;
  }
  
  return proposedTimes;
}

/**
 * Optimiza ruta CON reprogramación de citas
 */
export async function buildOptimizedRouteWithRescheduling(
  appointments: Appointment[],
  userLocation: { lat: number; lng: number } = { lat: 5.0214, lng: -73.9919 } // Zipaquirá
): Promise<OptimizationResult> {
  console.log('🚀 Iniciando optimización con reprogramación...');
  console.log(`   Citas: ${appointments.length}`);
  console.log(`   Ubicación inicial: Zipaquirá (${userLocation.lat}, ${userLocation.lng})`);
  
  // 1. Calcular métricas de la ruta original
  const originalMetrics = calculateRouteMetrics(appointments, userLocation);
  console.log('📊 Ruta original:', {
    distancia: `${originalMetrics.totalDistance.toFixed(2)} km`,
    tiempo: `${originalMetrics.totalTime.toFixed(0)} min`
  });
  
  // 2. Resolver TSP para encontrar orden geográfico óptimo
  const optimizedRoute = solveTSP(appointments, userLocation);
  console.log('🗺️ Ruta geográficamente óptima calculada');
  
  // 3. Calcular horarios propuestos basados en la ruta óptima
  // Los appointments ya vienen con startTime construido desde el hook
  const firstAppointment = appointments[0];
  
  if (!firstAppointment.startTime) {
    console.error('❌ First appointment missing startTime:', firstAppointment);
    throw new Error(`First appointment missing startTime: ${firstAppointment.id}`);
  }
  
  const firstAppointmentTime = new Date(firstAppointment.startTime);
  
  if (isNaN(firstAppointmentTime.getTime())) {
    throw new Error(`Invalid startTime for first appointment: ${firstAppointment.startTime}`);
  }
  
  console.log('⏰ Primera cita inicia a las:', firstAppointmentTime.toISOString());
  
  const proposedTimes = calculateProposedTimes(optimizedRoute, userLocation, firstAppointmentTime);
  
  console.log('⏰ Horarios propuestos calculados:', proposedTimes.length);
  
  // 4. Verificar disponibilidad para los nuevos horarios
  const availabilityRequests = proposedTimes.map((pt, index) => {
    const appointment = optimizedRoute[index];
    return {
      appointmentId: appointment.id,
      locationId: appointment.locationId,
      serviceType: appointment.serviceType,
      requestedTime: pt.proposedTime.toISOString(),
      durationMinutes: SERVICE_DURATION_MINUTES
    };
  });
  
  console.log('🔍 Verificando disponibilidad con API...');
  const { available, conflicts } = await checkMultipleAvailability(availabilityRequests);
  
  console.log(`✅ Disponibles: ${available.length}`);
  console.log(`⚠️ Conflictos: ${conflicts.length}`);
  
  // 5. Crear versión final de la ruta con horarios confirmados/propuestos
  const finalOptimizedRoute = optimizedRoute.map((appointment, index) => {
    const proposedTime = proposedTimes[index];
    const availableSlot = available.find(a => a.appointmentId === appointment.id);
    
    if (availableSlot) {
      // Usar horario confirmado
      return {
        ...appointment,
        startTime: availableSlot.proposedStartTime,
        endTime: availableSlot.proposedEndTime
      };
    } else {
      // Usar horario propuesto (aunque tenga conflicto) con duración real
      const serviceDuration = appointment.estimatedDuration || SERVICE_DURATION_MINUTES;
      return {
        ...appointment,
        startTime: proposedTime.proposedTime.toISOString(),
        endTime: new Date(proposedTime.proposedTime.getTime() + serviceDuration * 60 * 1000).toISOString()
      };
    }
  });
  
  // 6. Calcular métricas de la ruta optimizada
  const optimizedMetrics = calculateRouteMetrics(finalOptimizedRoute, userLocation);
  console.log('📊 Ruta optimizada:', {
    distancia: `${optimizedMetrics.totalDistance.toFixed(2)} km`,
    tiempo: `${optimizedMetrics.totalTime.toFixed(0)} min`
  });
  
  // 7. Calcular mejoras
  const distanceReduction = originalMetrics.totalDistance - optimizedMetrics.totalDistance;
  const distanceReductionPercentage = (distanceReduction / originalMetrics.totalDistance) * 100;
  const timeReduction = originalMetrics.totalTime - optimizedMetrics.totalTime;
  const timeReductionPercentage = (timeReduction / originalMetrics.totalTime) * 100;
  
  console.log('🎯 Mejoras:', {
    distancia: `${distanceReduction.toFixed(2)} km (${distanceReductionPercentage.toFixed(1)}%)`,
    tiempo: `${timeReduction.toFixed(0)} min (${timeReductionPercentage.toFixed(1)}%)`
  });
  
  // 8. Enriquecer información de reprogramación con duración del servicio
  // Para conflicts, usar el horario propuesto del algoritmo (aunque tenga conflicto)
  const conflictsAsRescheduled = conflicts
    .map(conflict => {
      const originalAppointment = appointments.find(app => app.id === conflict.appointmentId);
      const proposedTime = proposedTimes.find(pt => pt.appointmentId === conflict.appointmentId);
      
      if (!originalAppointment || !proposedTime) {
        return null;
      }
      
      const serviceDuration = originalAppointment.estimatedDuration || SERVICE_DURATION_MINUTES;
      const proposedStart = proposedTime.proposedTime;
      const proposedEnd = new Date(proposedStart.getTime() + serviceDuration * 60 * 1000);
      const originalStart = new Date(originalAppointment.startTime);
      const timeDiff = Math.round((proposedStart.getTime() - originalStart.getTime()) / (60 * 1000));
      
      // Type-safe way to access optional properties
      const appointmentWithExtras = originalAppointment as Appointment & {
        specialistId?: string;
        specialistName?: string;
        businessName?: string;
        business?: { name?: string };
      };
      
      const rescheduled: RescheduledAppointment = {
        appointmentId: conflict.appointmentId,
        clientName: originalAppointment.clientName || '',
        serviceType: originalAppointment.serviceType || '',
        locationId: conflict.locationId,
        locationName: originalAppointment.locationName || '',
        originalStartTime: originalAppointment.startTime,
        originalEndTime: originalAppointment.endTime,
        proposedStartTime: proposedStart.toISOString(),
        proposedEndTime: proposedEnd.toISOString(),
        timeDifferenceMinutes: timeDiff,
        durationMinutes: serviceDuration,
        specialistId: appointmentWithExtras.specialistId || '',
        specialistName: appointmentWithExtras.specialistName || '',
        status: 'proposed' as const,
        reason: conflict.reason,
        businessName: appointmentWithExtras.businessName || appointmentWithExtras.business?.name || 'Salón de Belleza Premium'
      };
      
      return rescheduled;
    })
    .filter((r): r is RescheduledAppointment => r !== null);
  
  // Combinar disponibles + conflicts que requieren reprogramación
  const rescheduledAppointments = [
    ...available.map(a => {
      const originalAppointment = appointments.find(app => app.id === a.appointmentId);
      const appointmentWithExtras = originalAppointment as Appointment & {
        businessName?: string;
        business?: { name?: string };
      };
      return {
        ...a,
        clientName: originalAppointment?.clientName || '',
        locationName: originalAppointment?.locationName || '',
        durationMinutes: originalAppointment?.estimatedDuration || SERVICE_DURATION_MINUTES,
        businessName: appointmentWithExtras?.businessName || appointmentWithExtras?.business?.name || 'Salón de Belleza Premium'
      };
    }),
    ...conflictsAsRescheduled
  ].filter(a => {
    // Solo incluir si el horario propuesto es DIFERENTE al original
    const originalStart = new Date(a.originalStartTime).getTime();
    const proposedStart = new Date(a.proposedStartTime).getTime();
    const diff = Math.abs(originalStart - proposedStart);
    const shouldInclude = diff > 60000; // Diferencia > 1 minuto
    
    if (shouldInclude) {
      console.log(`📝 Cita con cambio de horario: ${a.appointmentId}`, {
        original: a.originalStartTime,
        proposed: a.proposedStartTime,
        diffMinutes: Math.round(diff / 60000)
      });
    }
    
    return shouldInclude;
  });
  
  console.log(`📋 Total citas que requieren reprogramación: ${rescheduledAppointments.length}`);
  
  return {
    originalRoute: appointments,
    optimizedRoute: finalOptimizedRoute,
    originalMetrics,
    optimizedMetrics,
    rescheduledAppointments,
    improvements: {
      distanceReduction,
      distanceReductionPercentage,
      timeReduction,
      timeReductionPercentage
    }
  };
}
