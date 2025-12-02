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

    // Query por PK (BUSINESS#{businessId}) con SK comenzando con LOCATION#
    const items = await queryItems({
      tableName: LOCATIONS_TABLE,
      keyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      expressionAttributeValues: {
        ':pk': `BUSINESS#${businessId}`,
        ':sk': 'LOCATION#',
      },
    });

    // Transform DynamoDB structure to match frontend Location interface
    const transformedLocations = items.map((item: any) => ({
      ...item,
      address: {
        street: item.address || '',
        city: item.city || '',
        state: '', // Not stored in DynamoDB
        zipCode: '', // Not stored in DynamoDB
        country: 'Colombia', // Default
      },
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        locations: transformedLocations,
        count: transformedLocations.length,
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

    // Hacer scan buscando por locationId ya que no hay un índice directo
    // La estructura es: PK: BUSINESS#{businessId}, SK: LOCATION#{locationId}
    console.log(`🔍 Buscando location con locationId: ${locationId}`);
    
    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand } = await import('@aws-sdk/lib-dynamodb');
    
    const client = new DynamoDBClient({});
    const docClient = DynamoDBDocumentClient.from(client);
    
    const scanResult = await docClient.send(new ScanCommand({
      TableName: LOCATIONS_TABLE,
      FilterExpression: 'locationId = :lid',
      ExpressionAttributeValues: {
        ':lid': locationId,
      },
    }));
    
    const items = scanResult.Items || [];

    console.log(`📦 DynamoDB devolvió ${items?.length || 0} items para locationId: ${locationId}`);

    if (!items || items.length === 0) {
      console.log(`❌ Location ${locationId} no encontrada en DynamoDB`);
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    // Transform DynamoDB structure to match frontend Location interface
    const location = items[0];
    const transformedLocation = {
      ...location,
      address: {
        street: location.address || '',
        city: location.city || '',
        state: '', // Not stored in DynamoDB
        zipCode: '', // Not stored in DynamoDB
        country: 'Colombia', // Default
      },
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ location: transformedLocation }),
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
