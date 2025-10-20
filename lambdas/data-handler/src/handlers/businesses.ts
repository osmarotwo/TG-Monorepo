import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems, getItem } from '../utils/dynamodb';

const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE || 'Businesses';

/**
 * GET /api/businesses?ownerId={ownerId}
 * Retorna los negocios del usuario
 */
export async function getBusinesses(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const ownerId = event.queryStringParameters?.ownerId;

    if (!ownerId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'ownerId is required' }),
      };
    }

    // Query usando GSI1 (OWNER#{ownerId})
    const items = await queryItems({
      tableName: BUSINESSES_TABLE,
      indexName: 'GSI1',
      keyConditionExpression: 'GSI1PK = :ownerId',
      expressionAttributeValues: {
        ':ownerId': `OWNER#${ownerId}`,
      },
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        businesses: items,
        count: items.length,
      }),
    };
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * GET /api/businesses/{businessId}
 * Retorna detalles de un negocio específico
 */
export async function getBusinessById(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const businessId = event.pathParameters?.id;

    if (!businessId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'businessId is required' }),
      };
    }

    const item = await getItem(BUSINESSES_TABLE, {
      PK: `BUSINESS#${businessId}`,
      SK: 'METADATA',
    });

    if (!item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'Business not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ business: item }),
    };
  } catch (error) {
    console.error('Error fetching business:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
