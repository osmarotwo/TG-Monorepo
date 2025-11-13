import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { putItem, queryItems } from '../utils/dynamodb';

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments';

// CORS headers
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

/**
 * POST /api/appointments/personal
 * Crea una cita personal (no relacionada con un negocio)
 */
export async function createPersonalAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const data = JSON.parse(event.body || '{}');
    
    const {
      userId,
      title,
      description,
      address,
      latitude,
      longitude,
      date,
      startTime,
      endTime,
      notes
    } = data;

    // Validaciones
    if (!userId || !title || !date || !startTime || !endTime) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['userId', 'title', 'date', 'startTime', 'endTime']
        }),
      };
    }

    // Validar que se proporcione dirección O coordenadas
    if (!address && (!latitude || !longitude)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Must provide either address or coordinates (latitude + longitude)'
        }),
      };
    }

    // Validar que las coordenadas sean números válidos si se proporcionan
    if (latitude !== null && latitude !== undefined) {
      const lat = Number(latitude);
      if (isNaN(lat)) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Invalid latitude value'
          }),
        };
      }
    }

    if (longitude !== null && longitude !== undefined) {
      const lng = Number(longitude);
      if (isNaN(lng)) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Invalid longitude value'
          }),
        };
      }
    }

    // Validar que endTime sea después de startTime
    if (endTime <= startTime) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'End time must be after start time'
        }),
      };
    }

    // Validar que no haya solapamiento con otras citas del usuario
    const existingAppointments = await queryItems({
      tableName: APPOINTMENTS_TABLE,
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'APPOINTMENT#',
      }
    });

    console.log('📋 All user appointments:', JSON.stringify(existingAppointments, null, 2));

    // Filtrar citas del mismo día
    const appointmentsOnDate = existingAppointments.filter((apt: any) => apt.date === date);

    console.log(`📅 Appointments on ${date}:`, JSON.stringify(appointmentsOnDate, null, 2));

    // Verificar solapamiento
    for (const apt of appointmentsOnDate) {
      const aptStart = apt.time || apt.startTime?.substring(11, 16);
      const aptEnd = calculateEndTimeStr(aptStart, apt.duration || 60);
      
      console.log(`🔍 Checking overlap: New (${startTime}-${endTime}) vs Existing (${aptStart}-${aptEnd})`);
      
      // Hay solapamiento si:
      // 1. La nueva cita empieza durante una cita existente
      // 2. La nueva cita termina durante una cita existente
      // 3. La nueva cita envuelve completamente una cita existente
      const hasOverlap = (
        (startTime >= aptStart && startTime < aptEnd) ||
        (endTime > aptStart && endTime <= aptEnd) ||
        (startTime <= aptStart && endTime >= aptEnd)
      );

      if (hasOverlap) {
        return {
          statusCode: 409,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Time slot conflict',
            message: `You already have an appointment at ${aptStart}`,
            conflictingAppointment: {
              id: apt.appointmentId,
              time: aptStart,
              title: apt.title || apt.serviceType
            }
          }),
        };
      }
    }

    // Calcular duración en minutos
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

    // Generar appointmentId único
    const appointmentId = uuidv4();
    const now = new Date().toISOString();

    // Validar y convertir coordenadas a números seguros
    const safeLat = (latitude !== null && latitude !== undefined) ? Number(latitude) : null;
    const safeLng = (longitude !== null && longitude !== undefined) ? Number(longitude) : null;
    
    // Si las coordenadas son NaN después de la conversión, usar null
    const finalLat = (safeLat !== null && !isNaN(safeLat)) ? safeLat : null;
    const finalLng = (safeLng !== null && !isNaN(safeLng)) ? safeLng : null;

    // Crear item para DynamoDB
    const appointment = {
      PK: `USER#${userId}`,
      SK: `APPOINTMENT#${appointmentId}`,
      appointmentId,
      userId,
      type: 'personal', // Nuevo campo
      isFlexible: false, // Las citas personales NO se pueden reagendar
      title,
      description: description || '',
      address: address || (finalLat && finalLng ? `${finalLat}, ${finalLng}` : 'No address'),
      latitude: finalLat,
      longitude: finalLng,
      date,
      time: startTime,
      startTime: `${date}T${startTime}:00`,
      endTime: `${date}T${endTime}:00`,
      duration: durationMinutes,
      status: 'confirmed',
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
      // GSI1 para consultas por usuario (igual que citas de negocio)
      GSI1PK: `USER#${userId}`,
      GSI1SK: `DATE#${date}#TIME#${startTime}`
    };

    // Guardar en DynamoDB
    await putItem(APPOINTMENTS_TABLE, appointment);

    console.log('✅ Personal appointment created:', { appointmentId, userId, title, date, startTime });

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Personal appointment created successfully',
        appointment,
      }),
    };
  } catch (error) {
    console.error('❌ Error creating personal appointment:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to create personal appointment',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
}

/**
 * Helper para calcular hora de fin dado un tiempo de inicio y duración
 */
function calculateEndTimeStr(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}
