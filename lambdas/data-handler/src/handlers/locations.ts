import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, getItem } from '../utils/dynamodb';

const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'Locations';

/**
 * GET /api/locations?businessId={businessId}
 * Retorna todas las sedes de un negocio
 */
export async function getLocations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const businessId = event.queryStringParameters?.businessId;

    if (!businessId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'businessId is required' }),
      };
    }

    // Query usando GSI1 (BUSINESS#{businessId})
    const items = await queryItems({
      tableName: LOCATIONS_TABLE,
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :businessId',
      expressionAttributeValues: {
        ':businessId': `BUSINESS#${businessId}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        locations: items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching locations:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * GET /api/locations/{locationId}
 * Retorna detalles de una sede específica
 */
export async function getLocationById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const locationId = event.pathParameters?.id;

    if (!locationId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'locationId is required' }),
      };
    }

    // Buscar usando GSI1 ya que las locaciones tienen:
    // PK: BUSINESS#{businessId}, SK: LOCATION#{locationId}, GSI1PK: LOCATION#{locationId}
    const items = await queryItems({
      tableName: LOCATIONS_TABLE,
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :gsi1pk',
      expressionAttributeValues: {
        ':gsi1pk': `LOCATION#${locationId}`,
      },
    });

    if (!items || items.length === 0) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ location: items[0] }),
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
