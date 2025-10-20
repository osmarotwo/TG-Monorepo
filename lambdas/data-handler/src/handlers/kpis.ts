import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryItems } from '../utils/dynamodb';

const KPIS_TABLE = process.env.KPIS_TABLE || 'KPIs';

/**
 * GET /api/kpis/{locationId}?period=current-month
 * Retorna KPIs de una sede
 */
export async function getKpisByLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const locationId = event.pathParameters?.locationId;
    const period = event.queryStringParameters?.period || getCurrentPeriod();

    if (!locationId) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ error: 'locationId is required' }),
      };
    }

    // Query KPIs por locationId y period
    const items = await queryItems({
      tableName: KPIS_TABLE,
      keyConditionExpression: 'PK = :pk',
      expressionAttributeValues: {
        ':pk': `KPI#${locationId}#${period}`,
      },
    });

    // Convertir array de KPIs a objeto con estructura amigable
    const kpis: Record<string, any> = {};
    items.forEach((item: any) => {
      const metricType = item.metricType;
      kpis[metricType] = {
        value: item.value,
        target: item.target,
        calculatedAt: item.calculatedAt,
      };
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        locationId,
        period,
        kpis,
      }),
    };
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}

/**
 * Helper: Get current period in format YYYY-MM
 */
function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}
