import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { putItem, queryItems } from '../utils/dynamodb';

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments';

// CORS headers
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token'
};

/**
 * POST /api/appointments
 * Crea una nueva cita
 */
export async function createAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const data = JSON.parse(event.body);
    const {
      userId,
      businessId,
      locationId,
      customerName,
      serviceType,
      date,
      time,
      duration,
      notes,
      startTime,
      endTime,
      estimatedDuration,
      status = 'confirmed'
    } = data;

    // Validaciones
    if (!userId || !businessId || !locationId || !customerName || !serviceType || !date || !time) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['userId', 'businessId', 'locationId', 'customerName', 'serviceType', 'date', 'time']
        }),
      };
    }

    // Generar appointmentId único
    const appointmentId = uuidv4();
    const now = new Date().toISOString();

    // Crear item para DynamoDB
    const appointment = {
      PK: `USER#${userId}`,
      SK: `APPOINTMENT#${appointmentId}`,
      appointmentId,
      userId,
      type: 'business', // Cita de negocio
      isFlexible: true, // Las citas de negocio SÍ se pueden reagendar
      businessId,
      locationId,
      customerName,
      serviceType,
      date,
      time,
      duration: duration || estimatedDuration,
      startTime: startTime || `${date}T${time}:00`,
      endTime: endTime || calculateEndTime(date, time, duration || estimatedDuration),
      status,
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
      // GSI fields para consultas por business y location
      GSI1PK: `BUSINESS#${businessId}`,
      GSI1SK: `DATE#${date}#TIME#${time}`,
      GSI2PK: `LOCATION#${locationId}`,
      GSI2SK: `DATE#${date}#TIME#${time}`
    };

    // Guardar en DynamoDB
    await putItem(APPOINTMENTS_TABLE, appointment);

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        message: 'Appointment created successfully',
        appointment 
      }),
    };
  } catch (error) {
    console.error('Error creating appointment:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Calcula el endTime basado en date, time y duration
 */
function calculateEndTime(date: string, time: string, duration: number): string {
  // No usar Z al final para interpretar en hora local, no UTC
  const startTime = new Date(`${date}T${time}:00`);
  const endTime = new Date(startTime.getTime() + duration * 60000);
  return endTime.toISOString();
}

/**
 * POST /api/appointments/validate
 * Valida si un horario está disponible antes de crear la cita
 */
export async function validateAppointmentSlot(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const CORS_HEADERS = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const data = JSON.parse(event.body || '{}');
    const { locationId, date, time, duration } = data;

    if (!locationId || !date || !time || !duration) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          available: false,
          reason: 'Faltan parámetros requeridos: locationId, date, time, duration' 
        })
      };
    }

    // Calcular slots de 15 min que ocupa esta cita
    const slotsNeeded = Math.ceil(duration / 15);
    const [hours, minutes] = time.split(':').map(Number);
    let currentMinutes = hours * 60 + minutes;
    const requiredSlots: string[] = [];

    for (let i = 0; i < slotsNeeded; i++) {
      const slotHours = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
      const slotMins = (currentMinutes % 60).toString().padStart(2, '0');
      requiredSlots.push(`${slotHours}:${slotMins}`);
      currentMinutes += 15;
    }

    // 1. Verificar si existen citas en ese horario
    const appointmentsResult = await queryItems({
      tableName: APPOINTMENTS_TABLE,
      indexName: 'GSI2',
      keyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
      expressionAttributeValues: {
        ':pk': `LOCATION#${locationId}`,
        ':sk': `DATE#${date}#`
      }
    });

    // Crear mapa de horarios ocupados
    const bookedTimes = new Set<string>();
    if (appointmentsResult && appointmentsResult.length > 0) {
      for (const apt of appointmentsResult) {
        const startTime = apt.time as string;
        const aptDuration = (apt.duration as number) || 60;
        const aptSlotsNeeded = Math.ceil(aptDuration / 15);
        
        const [aptHours, aptMinutes] = startTime.split(':').map(Number);
        let aptCurrentMinutes = aptHours * 60 + aptMinutes;
        
        for (let i = 0; i < aptSlotsNeeded; i++) {
          const slotHours = Math.floor(aptCurrentMinutes / 60).toString().padStart(2, '0');
          const slotMins = (aptCurrentMinutes % 60).toString().padStart(2, '0');
          bookedTimes.add(`${slotHours}:${slotMins}`);
          aptCurrentMinutes += 15;
        }
      }
    }

    // Verificar si alguno de los slots requeridos está ocupado
    for (const slot of requiredSlots) {
      if (bookedTimes.has(slot)) {
        return {
          statusCode: 200,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            available: false,
            reason: 'Este horario ya está ocupado por otra cita'
          })
        };
      }
    }

    // 2. Verificar disponibilidad en la tabla Availability (opcional pero recomendado)
    // Por ahora, si no hay conflictos con citas, está disponible
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        available: true 
      })
    };

  } catch (error) {
    console.error('❌ Error en validateAppointmentSlot:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        available: false,
        reason: 'Error al validar disponibilidad',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}
