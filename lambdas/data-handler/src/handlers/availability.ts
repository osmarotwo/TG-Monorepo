/**
 * Handlers para la API de disponibilidad
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  AvailableSlot,
  SpecialistSchedule,
  ServiceDuration,
  CheckMultipleAvailabilityRequest,
  CheckMultipleAvailabilityResponse,
  RescheduledAppointment,
  AvailabilityConflict,
  ReserveSlotRequest,
  ReserveSlotResponse
} from '../types/availability';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

// CORS headers para incluir en todas las respuestas
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
};

/**
 * GET /api/availability/:locationId/:date?serviceType=haircut&duration=60
 * 
 * Obtiene slots disponibles para una ubicación en una fecha específica
 */
export async function getAvailableSlots(event: any) {
  try {
    const { locationId, date } = event.pathParameters;
    const { serviceType, duration } = event.queryStringParameters || {};
    
    if (!locationId || !date) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'locationId y date son requeridos' })
      };
    }
    
    // 1. Obtener duración del servicio si se especifica tipo
    let durationMinutes = duration ? parseInt(duration) : 60;
    if (serviceType && !duration) {
      const serviceResult = await docClient.send(new GetCommand({
        TableName: AVAILABILITY_TABLE,
        Key: {
          PK: `SERVICE#${serviceType}`,
          SK: 'METADATA'
        }
      }));
      
      if (serviceResult.Item) {
        durationMinutes = (serviceResult.Item as ServiceDuration).durationMinutes;
      }
    }
    
    // 2. Buscar agendas de especialistas para esta ubicación y fecha
    const queryResult = await docClient.send(new QueryCommand({
      TableName: AVAILABILITY_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `DATE#${date}#LOCATION#${locationId}`,
        ':sk': 'SPECIALIST#'
      }
    }));
    
    if (!queryResult.Items || queryResult.Items.length === 0) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ availableSlots: [] })
      };
    }
    
    // 3. Encontrar slots consecutivos disponibles
    const availableSlots: AvailableSlot[] = [];
    const slotsNeeded = Math.ceil(durationMinutes / 15);
    
    for (const item of queryResult.Items) {
      const schedule = item as SpecialistSchedule;
      const times = Object.keys(schedule.availability).sort();
      
      for (let i = 0; i <= times.length - slotsNeeded; i++) {
        const startTime = times[i];
        let allAvailable = true;
        
        // Verificar que todos los slots consecutivos estén disponibles
        for (let j = 0; j < slotsNeeded; j++) {
          if (schedule.availability[times[i + j]] !== 'available') {
            allAvailable = false;
            break;
          }
        }
        
        if (allAvailable) {
          availableSlots.push({
            time: startTime,
            specialistId: schedule.specialistId,
            specialistName: schedule.specialistName,
            durationMinutes
          });
        }
      }
    }
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        locationId,
        date,
        serviceType,
        durationMinutes,
        availableSlots
      })
    };
    
  } catch (error) {
    console.error('Error en getAvailableSlots:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Error al obtener disponibilidad' })
    };
  }
}

/**
 * POST /api/availability/check-multiple
 * 
 * Verifica disponibilidad para múltiples citas y propone alternativas si no hay slots
 */
export async function checkMultipleAvailability(event: any) {
  try {
    const request: CheckMultipleAvailabilityRequest = JSON.parse(event.body);
    const available: RescheduledAppointment[] = [];
    const conflicts: AvailabilityConflict[] = [];
    
    for (const appointment of request.appointments) {
      const { appointmentId, locationId, serviceType, requestedTime, durationMinutes } = appointment;
      
      // Extraer fecha y hora del timestamp ISO
      const date = requestedTime.split('T')[0];
      const time = requestedTime.split('T')[1].substring(0, 5); // "HH:MM"
      
      // Buscar agendas de especialistas
      const queryResult = await docClient.send(new QueryCommand({
        TableName: AVAILABILITY_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND begins_with(GSI1SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `DATE#${date}#LOCATION#${locationId}`,
          ':sk': 'SPECIALIST#'
        }
      }));
      
      if (!queryResult.Items || queryResult.Items.length === 0) {
        conflicts.push({
          appointmentId,
          locationId,
          requestedTime,
          reason: 'No hay especialistas disponibles para esta fecha',
          alternatives: []
        });
        continue;
      }
      
      // Verificar disponibilidad en el horario solicitado
      const slotsNeeded = Math.ceil(durationMinutes / 15);
      let foundAvailability = false;
      
      for (const item of queryResult.Items) {
        const schedule = item as SpecialistSchedule;
        const times = Object.keys(schedule.availability).sort();
        const startIndex = times.indexOf(time);
        
        if (startIndex === -1) continue;
        
        let allAvailable = true;
        for (let i = 0; i < slotsNeeded; i++) {
          if (!times[startIndex + i] || schedule.availability[times[startIndex + i]] !== 'available') {
            allAvailable = false;
            break;
          }
        }
        
        if (allAvailable) {
          // ¡Disponible!
          const endTime = addMinutesToTime(time, durationMinutes);
          available.push({
            appointmentId,
            clientName: '',
            serviceType,
            locationId,
            locationName: '',
            originalStartTime: requestedTime,
            originalEndTime: addMinutesToTime(requestedTime.split('T')[1].substring(0, 5), durationMinutes),
            proposedStartTime: requestedTime,
            proposedEndTime: endTime,
            timeDifferenceMinutes: 0,
            durationMinutes, // Incluir duración del servicio
            specialistId: schedule.specialistId,
            specialistName: schedule.specialistName,
            status: 'proposed',
            reason: 'Horario confirmado'
          });
          foundAvailability = true;
          break;
        }
      }
      
      if (!foundAvailability) {
        // Buscar alternativas cercanas (+/- 2 horas)
        const alternatives = findNearbySlots(queryResult.Items as SpecialistSchedule[], time, durationMinutes, 2);
        
        conflicts.push({
          appointmentId,
          locationId,
          requestedTime,
          reason: 'Horario no disponible',
          alternatives
        });
      }
    }
    
    const response: CheckMultipleAvailabilityResponse = {
      available,
      conflicts
    };
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error en checkMultipleAvailability:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Error al verificar disponibilidad' })
    };
  }
}

/**
 * POST /api/availability/reserve
 * 
 * Reserva temporalmente un slot (15 min TTL)
 */
export async function reserveSlot(event: any) {
  try {
    const request: ReserveSlotRequest = JSON.parse(event.body);
    const { specialistId, locationId, date, startTime, durationMinutes } = request;
    
    const slotsNeeded = Math.ceil(durationMinutes / 15);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min
    
    // Actualizar slots a 'reserved'
    const times = generateTimeSlots(startTime, slotsNeeded);
    const updateExpression = times.map((t, i) => `availability.#time${i} = :reserved`).join(', ');
    const expressionAttributeNames = times.reduce((acc, t, i) => ({
      ...acc,
      [`#time${i}`]: t
    }), {});
    const expressionAttributeValues = {
      ':reserved': 'reserved',
      ':updatedAt': now
    };
    
    await docClient.send(new UpdateCommand({
      TableName: AVAILABILITY_TABLE,
      Key: {
        PK: `SPECIALIST#${specialistId}`,
        SK: `DATE#${date}#LOCATION#${locationId}`
      },
      UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues
    }));
    
    const response: ReserveSlotResponse = {
      success: true,
      reservationId: `${specialistId}-${date}-${startTime}`,
      expiresAt,
      message: `Reservado ${durationMinutes} minutos desde ${startTime}`
    };
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    console.error('Error en reserveSlot:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        success: false,
        error: 'Error al reservar slot' 
      })
    };
  }
}

// ============ Funciones auxiliares ============

/**
 * Suma minutos a una hora en formato HH:MM
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * Genera array de slots de 15 min a partir de un tiempo inicial
 */
function generateTimeSlots(startTime: string, count: number): string[] {
  const slots: string[] = [];
  let current = startTime;
  for (let i = 0; i < count; i++) {
    slots.push(current);
    current = addMinutesToTime(current, 15);
  }
  return slots;
}

/**
 * Encuentra slots disponibles cerca de un horario solicitado
 */
function findNearbySlots(
  schedules: SpecialistSchedule[],
  requestedTime: string,
  durationMinutes: number,
  rangeHours: number
): AvailableSlot[] {
  const alternatives: AvailableSlot[] = [];
  const slotsNeeded = Math.ceil(durationMinutes / 15);
  
  // Calcular rango de búsqueda
  const minTime = addMinutesToTime(requestedTime, -rangeHours * 60);
  const maxTime = addMinutesToTime(requestedTime, rangeHours * 60);
  
  for (const schedule of schedules) {
    const times = Object.keys(schedule.availability).sort();
    
    for (let i = 0; i <= times.length - slotsNeeded; i++) {
      const startTime = times[i];
      
      // Verificar si está en el rango
      if (startTime < minTime || startTime > maxTime) continue;
      
      // Verificar disponibilidad consecutiva
      let allAvailable = true;
      for (let j = 0; j < slotsNeeded; j++) {
        if (schedule.availability[times[i + j]] !== 'available') {
          allAvailable = false;
          break;
        }
      }
      
      if (allAvailable) {
        alternatives.push({
          time: startTime,
          specialistId: schedule.specialistId,
          specialistName: schedule.specialistName,
          durationMinutes
        });
      }
    }
  }
  
  // Ordenar por cercanía al horario solicitado
  return alternatives.sort((a, b) => {
    const diffA = Math.abs(timeToMinutes(a.time) - timeToMinutes(requestedTime));
    const diffB = Math.abs(timeToMinutes(b.time) - timeToMinutes(requestedTime));
    return diffA - diffB;
  }).slice(0, 5); // Máximo 5 alternativas
}

/**
 * Convierte HH:MM a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
}
