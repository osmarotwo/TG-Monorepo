import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, getItem } from '../utils/dynamodb';

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

    const now = new Date().toISOString();

    // Query usando GSI1 (USER#{userId} + APPOINTMENT#{startTime})
    const items = await queryItems({
      tableName: APPOINTMENTS_TABLE,
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :userId',
      expressionAttributeValues: {
        ':userId': `USER#${userId}`,
      },
      limit: upcoming ? limit : undefined,
      scanIndexForward: true, // Ordenar por fecha ascendente
    });

    // Filtrar solo próximas citas si upcoming=true
    let appointments = items;
    if (upcoming) {
      appointments = items.filter((item: any) => item.startTime >= now);
    }

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
