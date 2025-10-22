/**
 * Hook para optimización de rutas CON reprogramación de citas
 */

'use client';

import { useState, useCallback } from 'react';
import { Appointment } from '@/services/api/appointments';
import { Location } from '@/services/api/locations';
import { buildOptimizedRouteWithRescheduling, OptimizationResult } from '@/services/optimization/routeOptimizerWithRescheduling';
import { RescheduledAppointment } from '@/services/api/availabilityService';

interface AppointmentWithLocation extends Appointment {
  location?: Location;
}

interface UseRouteOptimizationWithReschedulingReturn {
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  error: Error | null;
  rescheduledAppointments: RescheduledAppointment[];
  hasConflicts: boolean;
  hasSignificantImprovement: boolean;
  optimize: () => Promise<void>;
  applyOptimization: () => Promise<Appointment[]>;
  reset: () => void;
}

export function useRouteOptimizationWithRescheduling(
  appointments: AppointmentWithLocation[],
  userLocation: { lat: number; lng: number } = { lat: 5.0214, lng: -73.9919 },
  minImprovementThreshold: number = 0.05 // 5% de mejora mínima (antes 10%)
): UseRouteOptimizationWithReschedulingReturn {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Ejecuta la optimización con reprogramación
   */
  const optimize = useCallback(async () => {
    if (appointments.length < 2) {
      console.log('⚠️ Se necesitan al menos 2 citas para optimizar');
      return;
    }

    // Verificar que todas las citas tengan ubicación con coordenadas
    const appointmentsWithLocation = appointments.filter(apt => 
      apt.location && 
      typeof apt.location.latitude === 'number' && 
      typeof apt.location.longitude === 'number'
    );

    if (appointmentsWithLocation.length < 2) {
      console.error('⚠️ No hay suficientes citas con coordenadas válidas');
      setError(new Error('Se necesitan coordenadas de ubicación para optimizar'));
      return;
    }

    try {
      setIsOptimizing(true);
      setError(null);

      console.log('🚀 Iniciando optimización con reprogramación...', {
        totalAppointments: appointments.length,
        withLocation: appointmentsWithLocation.length
      });

      // DEBUG: Ver estructura del primer appointment
      if (appointmentsWithLocation.length > 0) {
        console.log('🔍 DEBUG - Primer appointment completo:', appointmentsWithLocation[0]);
        console.log('🔍 DEBUG - Campos disponibles:', Object.keys(appointmentsWithLocation[0]));
      }

      // Convertir appointments al formato esperado (incluyendo estimatedDuration)
      const appointmentsForOptimization = appointmentsWithLocation.map(apt => {
        // Helper para construir startTime/endTime desde date + time si no existen
        const buildDateTime = (date: string, time: string): string => {
          return `${date}T${time}:00`;
        };
        
        // Si el appointment viene con date/time separados, construir startTime/endTime
        let startTime = apt.startTime;
        let endTime = apt.endTime;
        
        console.log('🔍 DEBUG - Processing appointment:', {
          id: apt.appointmentId,
          hasStartTime: !!apt.startTime,
          hasEndTime: !!apt.endTime,
          date: apt.date,
          time: apt.time,
          serviceName: apt.serviceName,
          estimatedDuration: apt.estimatedDuration
        });
        
        if (!startTime && apt.date && apt.time) {
          startTime = buildDateTime(apt.date, apt.time);
          console.log('🔧 Construyendo startTime desde date/time:', { date: apt.date, time: apt.time, startTime });
        }
        
        if (!endTime && apt.date && apt.time && apt.estimatedDuration) {
          // Calcular endTime sumando la duración
          const start = new Date(startTime);
          const end = new Date(start.getTime() + apt.estimatedDuration * 60 * 1000);
          endTime = end.toISOString();
          console.log('🔧 Calculando endTime desde startTime + duration:', { startTime, duration: apt.estimatedDuration, endTime });
        }
        
        if (!startTime || !endTime) {
          console.error('❌ No se pudo construir startTime/endTime para appointment:', {
            id: apt.appointmentId,
            startTime,
            endTime,
            date: apt.date,
            time: apt.time
          });
        }
        
        return {
          id: apt.appointmentId,
          locationId: apt.locationId,
          locationName: apt.locationName || apt.location?.name || '',
          clientName: apt.customerName,
          serviceType: apt.serviceType,
          startTime: startTime,
          endTime: endTime,
          estimatedDuration: apt.estimatedDuration, // Pasar duración real
          location: {
            lat: apt.location!.latitude,
            lng: apt.location!.longitude,
            address: apt.location!.address
          }
        };
      });

      const result = await buildOptimizedRouteWithRescheduling(
        appointmentsForOptimization,
        userLocation
      );

      console.log('✅ Optimización completada:', {
        distanceReduction: `${result.improvements.distanceReduction.toFixed(2)} km`,
        distanceReductionPercentage: `${result.improvements.distanceReductionPercentage.toFixed(1)}%`,
        rescheduled: result.rescheduledAppointments.length
      });

      setOptimizationResult(result);
    } catch (err) {
      console.error('❌ Error optimizando ruta:', err);
      setError(err as Error);
    } finally {
      setIsOptimizing(false);
    }
  }, [appointments, userLocation]);

  /**
   * Aplica la optimización y retorna las citas reordenadas
   */
  const applyOptimization = useCallback(async (): Promise<Appointment[]> => {
    if (!optimizationResult) {
      return appointments;
    }

    console.log('🚀 Aplicando optimización a la base de datos...');
    
    try {
      // Importar dinámicamente para evitar errores de SSR
      const { updateAppointmentTimes } = await import('@/services/api/appointments');

      // Actualizar cada cita optimizada en la base de datos
      const updatePromises = optimizationResult.optimizedRoute.map(async (opt) => {
        const originalAppointment = appointments.find(a => a.appointmentId === opt.id);
        if (!originalAppointment) return null;

        try {
          // Actualizar en DynamoDB
          const updated = await updateAppointmentTimes(
            opt.id,
            originalAppointment.userId,
            opt.startTime,
            opt.endTime
          );

          console.log('✅ Cita actualizada:', {
            id: opt.id,
            oldStart: originalAppointment.startTime,
            newStart: opt.startTime,
          });

          return {
            ...originalAppointment,
            startTime: updated.startTime,
            endTime: updated.endTime,
            date: updated.date,
            time: updated.time,
            updatedAt: updated.updatedAt,
          };
        } catch (error) {
          console.error('❌ Error actualizando cita:', opt.id, error);
          throw error;
        }
      });

      // Esperar todas las actualizaciones
      const results = await Promise.all(updatePromises);
      const optimizedAppointments = results.filter(Boolean) as Appointment[];

      console.log('✅ Optimización aplicada:', optimizedAppointments.length, 'citas actualizadas en DB');
      return optimizedAppointments;
    } catch (error) {
      console.error('❌ Error aplicando optimización:', error);
      throw error;
    }
  }, [optimizationResult, appointments]);

  /**
   * Reinicia el estado
   */
  const reset = useCallback(() => {
    setOptimizationResult(null);
    setError(null);
  }, []);

  // Calcular si hay mejora significativa
  const hasSignificantImprovement = 
    optimizationResult !== null && 
    (optimizationResult.improvements.distanceReductionPercentage / 100) >= minImprovementThreshold;

  return {
    optimizationResult,
    isOptimizing,
    error,
    rescheduledAppointments: optimizationResult?.rescheduledAppointments || [],
    hasConflicts: (optimizationResult?.rescheduledAppointments.length || 0) > 0,
    hasSignificantImprovement,
    optimize,
    applyOptimization,
    reset
  };
}
