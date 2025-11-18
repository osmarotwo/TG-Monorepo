/**
 * Handler simple para obtener disponibilidad con la nueva estructura
 * Compatible con los datos generados por seed-all-locations-availability.ts
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'Availability';

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization'
};

interface TimeSlot {
  timestamp: string;
  status: 'available' | 'booked';
  duration: number;
  bookedBy?: string;
  serviceType?: string;
}

/**
 * GET /api/availability/simple/:locationId/:date
 * 
 * Obtiene slots disponibles directamente de la nueva estructura
 */
export async function getSimpleAvailability(event: any) {
  console.log('📅 getSimpleAvailability called');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    const { locationId, date } = event.pathParameters || {};
    const { serviceType, duration } = event.queryStringParameters || {};
    
    console.log(`🔍 Buscando disponibilidad para: ${locationId} en ${date}`);
    
    if (!locationId || !date) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'locationId y date son requeridos',
          received: { locationId, date }
        })
      };
    }
    
    // Consultar todos los registros de disponibilidad para esta ubicación y fecha
    const result = await docClient.send(new QueryCommand({
      TableName: AVAILABILITY_TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `LOCATION#${locationId}`,
        ':sk': `AVAILABILITY#`
      }
    }));
    
    console.log(`📊 Encontrados ${result.Items?.length || 0} registros de disponibilidad`);
    
    if (!result.Items || result.Items.length === 0) {
      console.log('⚠️ No se encontró disponibilidad');
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          availableSlots: [],
          message: 'No hay disponibilidad para esta ubicación'
        })
      };
    }
    
    // Filtrar por fecha
    const dateRecords = result.Items.filter(item => item.date === date);
    console.log(`📅 Registros para fecha ${date}: ${dateRecords.length}`);
    
    if (dateRecords.length === 0) {
      console.log(`⚠️ No hay disponibilidad para la fecha ${date}`);
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          availableSlots: [],
          message: `No hay disponibilidad para la fecha ${date}`
        })
      };
    }
    
    // Procesar slots disponibles
    const availableSlots: any[] = [];
    
    for (const record of dateRecords) {
      console.log(`👤 Procesando especialista: ${record.specialistName}`);
      
      if (!record.slots || !Array.isArray(record.slots)) {
        console.log('⚠️ Record sin slots');
        continue;
      }
      
      const slots = record.slots as TimeSlot[];
      console.log(`   Slots totales: ${slots.length}`);
      
      const available = slots.filter(s => s.status === 'available');
      console.log(`   Slots disponibles: ${available.length}`);
      
      // Convertir cada slot disponible al formato esperado
      for (const slot of available) {
        const date = new Date(slot.timestamp);
        const timeStr = date.toLocaleTimeString('en-US', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        availableSlots.push({
          time: timeStr,
          timestamp: slot.timestamp,
          specialistId: record.specialistId,
          specialistName: record.specialistName,
          durationMinutes: slot.duration
        });
      }
    }
    
    // Ordenar por hora
    availableSlots.sort((a, b) => a.time.localeCompare(b.time));
    
    console.log(`✅ Total slots disponibles: ${availableSlots.length}`);
    console.log(`📋 Primeros 3 slots:`, availableSlots.slice(0, 3));
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        availableSlots,
        count: availableSlots.length,
        locationId,
        date
      })
    };
    
  } catch (error) {
    console.error('❌ Error:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
}

// Handler para OPTIONS (CORS preflight)
export async function handleOptions(event: any) {
  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: ''
  };
}
