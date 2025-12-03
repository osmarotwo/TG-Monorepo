import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, getItem, putItem } from '../utils/dynamodb';

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'Appointments';

/**
 * GET /api/appointments?userId={userId}&limit=2&upcoming=true
 * Retorna las próximas citas del usuario
 */
export async function getAppointments(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.queryStringParameters?.userId;
    const limit = parseInt(event.queryStringParameters?.limit || '10');
    const upcoming = event.queryStringParameters?.upcoming === 'true';

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }

    // Usar zona horaria de Colombia (UTC-5) para determinar "hoy"
    const now = new Date();
    const colombiaOffset = -5 * 60; // UTC-5 en minutos
    const colombiaTime = new Date(now.getTime() + (colombiaOffset - now.getTimezoneOffset()) * 60000);
    const todayStr = colombiaTime.toISOString().split('T')[0]; // "2025-11-13"
    const currentTimeStr = colombiaTime.toTimeString().split(' ')[0].substring(0, 5); // "20:30"

    // Query directo en la tabla principal usando PK = USER#{userId}
    const items = await queryItems({
      tableName: APPOINTMENTS_TABLE,
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':sk': 'APPOINTMENT#',
      },
      limit: upcoming ? limit * 2 : undefined, // Traer más para luego filtrar
      scanIndexForward: true, // Ordenar por SK ascendente
    });

    // Filtrar solo próximas citas si upcoming=true
    let appointments = items;
    if (upcoming) {
      appointments = items.filter((item: any) => {
        // Comparar fecha y hora
        if (item.date > todayStr) return true; // Fecha futura
        if (item.date === todayStr && item.time >= currentTimeStr) return true; // Hoy pero hora futura
        return false;
      });
    }

    // Ordenar por fecha y hora
    appointments.sort((a: any, b: any) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        appointments: appointments.slice(0, limit),
        count: appointments.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * GET /api/appointments/business/{businessId}
 * Retorna todas las citas de un negocio
 */
export async function getAppointmentsByBusiness(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const businessId = event.pathParameters?.businessId;

    if (!businessId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'businessId is required' }),
      };
    }

    // Normalizar businessId: manejar diferentes formatos
    // BIZ001 -> BUSINESS#BIZ001
    // BIZ-SALON-BELLEZA -> BUSINESS#BIZ-SALON-BELLEZA
    let normalizedBusinessId: string;
    
    if (businessId.startsWith('BUSINESS#')) {
      normalizedBusinessId = businessId;
    } else if (businessId.startsWith('BUS#')) {
      // Convertir BUS# a BUSINESS#
      normalizedBusinessId = businessId.replace('BUS#', 'BUSINESS#');
    } else {
      // Agregar prefijo BUSINESS#
      normalizedBusinessId = `BUSINESS#${businessId}`;
    }

    console.log('📊 Buscando citas para business:', businessId, '→', normalizedBusinessId);

    // Query usando GSI3 (businessId index)
    const items = await queryItems({
      tableName: APPOINTMENTS_TABLE,
      indexName: 'GSI3',
      keyConditionExpression: 'GSI3PK = :pk',
      expressionAttributeValues: {
        ':pk': normalizedBusinessId,
      },
      scanIndexForward: false, // Más recientes primero
    });

    console.log('✅ Encontradas', items.length, 'citas para', normalizedBusinessId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        appointments: items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching business appointments:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * GET /api/appointments/{appointmentId}
 * Retorna detalles de una cita específica
 */
export async function getAppointmentById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const appointmentId = event.pathParameters?.id;

    if (!appointmentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'appointmentId is required' }),
      };
    }

    const item = await getItem(APPOINTMENTS_TABLE, {
      PK: `APPOINTMENT#${appointmentId}`,
      SK: 'METADATA',
    });

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Appointment not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ appointment: item }),
    };
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * PUT /api/appointments/{appointmentId}
 * Actualiza una cita existente (para optimización de rutas)
 */
export async function updateAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const appointmentId = event.pathParameters?.id; // API Gateway usa {id} no {appointmentId}
    
    if (!appointmentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'appointmentId is required' }),
      };
    }

    // Parsear body
    const body = JSON.parse(event.body || '{}');
    const { startTime, endTime, date, time, userId } = body;

    if (!startTime || !endTime) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'startTime and endTime are required' }),
      };
    }

    if (!userId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'userId is required' }),
      };
    }

    // Obtener la cita actual para preservar otros campos
    const existingItem = await getItem(APPOINTMENTS_TABLE, {
      PK: `USER#${userId}`,
      SK: `APPOINTMENT#${appointmentId}`,
    });

    if (!existingItem) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Appointment not found' }),
      };
    }

    // Calcular date y time desde startTime si no se proveen
    const startDate = new Date(startTime);
    const calculatedDate = date || startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const calculatedTime = time || startDate.toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // Actualizar item con nuevos valores
    const updatedItem = {
      ...existingItem,
      startTime,
      endTime,
      date: calculatedDate,
      time: calculatedTime,
      updatedAt: new Date().toISOString(),
    };

    // Guardar en DynamoDB
    await putItem(APPOINTMENTS_TABLE, updatedItem);

    console.log('✅ Appointment updated:', { appointmentId, startTime, endTime });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true,
        appointment: updatedItem 
      }),
    };
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * DELETE /api/appointments/:appointmentId
 * Elimina una cita
 */
export async function deleteAppointment(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const appointmentId = event.pathParameters?.id;

    if (!appointmentId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'appointmentId is required' }),
      };
    }

    console.log('🗑️ Deleting appointment:', appointmentId);

    // Buscar la cita usando Scan (ya que no tenemos userId en el path)
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    const docClient = DynamoDBDocumentClient.from(client);
    
    // Scan buscando el appointmentId
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: APPOINTMENTS_TABLE,
        FilterExpression: 'appointmentId = :aid',
        ExpressionAttributeValues: {
          ':aid': appointmentId
        }
      })
    );
    
    let appointment = null;
    if (scanResult.Items && scanResult.Items.length > 0) {
      appointment = scanResult.Items[0];
      console.log('✅ Found appointment:', {
        PK: appointment.PK,
        SK: appointment.SK,
        type: appointment.type
      });
    }

    if (!appointment) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Appointment not found' }),
      };
    }

    // Eliminar el item usando las claves PK y SK que encontramos
    const { DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    
    console.log('🗑️ Deleting appointment with keys:', {
      PK: appointment.PK,
      SK: appointment.SK,
      type: appointment.type
    });
    
    await docClient.send(
      new DeleteCommand({
        TableName: APPOINTMENTS_TABLE,
        Key: {
          PK: appointment.PK,
          SK: appointment.SK,
        },
      })
    );

    console.log('✅ Appointment deleted successfully');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        success: true,
        message: 'Appointment deleted successfully'
      }),
    };
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
}
