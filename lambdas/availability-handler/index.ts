import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand 
} from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const AVAILABILITY_TABLE = process.env.AVAILABILITY_TABLE || 'tg-om-availability';

interface AvailabilitySchedule {
  availabilityId: string;
  businessId: string;
  locationId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  capacity: number;
  slotDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Availability Handler - Event:', JSON.stringify(event, null, 2));

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const path = event.path;
    const method = event.httpMethod;
    const pathParams = event.pathParameters || {};

    // POST /availability - Create new availability schedule
    if (method === 'POST' && path === '/availability') {
      return await createAvailability(event);
    }

    // GET /availability/{businessId} - Get all schedules for a business
    if (method === 'GET' && pathParams.businessId) {
      return await getBusinessAvailability(pathParams.businessId);
    }

    // GET /availability/location/{locationId} - Get schedules for a location
    if (method === 'GET' && path.includes('/location/') && pathParams.locationId) {
      return await getLocationAvailability(pathParams.locationId);
    }

    // PUT /availability/{availabilityId} - Update existing schedule
    if (method === 'PUT' && pathParams.availabilityId) {
      return await updateAvailability(pathParams.availabilityId, event);
    }

    // DELETE /availability/{availabilityId} - Delete schedule
    if (method === 'DELETE' && pathParams.availabilityId) {
      return await deleteAvailability(pathParams.availabilityId);
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Route not found' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

async function createAvailability(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const body = JSON.parse(event.body);
  const { businessId, locationId, schedules } = body;

  if (!businessId || !locationId || !schedules || !Array.isArray(schedules)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'businessId, locationId, and schedules array are required' }),
    };
  }

  // TODO: Verify businessId from JWT token matches the one in request
  // const userId = event.requestContext.authorizer?.claims?.sub;

  const createdSchedules: AvailabilitySchedule[] = [];

  for (const schedule of schedules) {
    const { dayOfWeek, startTime, endTime, capacity, slotDuration } = schedule;

    if (!dayOfWeek || !startTime || !endTime || capacity === undefined || !slotDuration) {
      continue; // Skip invalid schedules
    }

    const availabilityId = uuidv4();
    const now = new Date().toISOString();

    const availabilityItem: AvailabilitySchedule = {
      availabilityId,
      businessId,
      locationId,
      dayOfWeek,
      startTime,
      endTime,
      capacity,
      slotDuration,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await ddbDocClient.send(
      new PutCommand({
        TableName: AVAILABILITY_TABLE,
        Item: availabilityItem,
      })
    );

    createdSchedules.push(availabilityItem);
  }

  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify({
      message: 'Availability schedules created successfully',
      schedules: createdSchedules,
    }),
  };
}

async function getBusinessAvailability(businessId: string): Promise<APIGatewayProxyResult> {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: AVAILABILITY_TABLE,
      IndexName: 'BusinessIdIndex',
      KeyConditionExpression: 'businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': businessId,
      },
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      schedules: result.Items || [],
    }),
  };
}

async function getLocationAvailability(locationId: string): Promise<APIGatewayProxyResult> {
  const result = await ddbDocClient.send(
    new QueryCommand({
      TableName: AVAILABILITY_TABLE,
      IndexName: 'LocationIdIndex',
      KeyConditionExpression: 'locationId = :locationId',
      ExpressionAttributeValues: {
        ':locationId': locationId,
      },
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      schedules: result.Items || [],
    }),
  };
}

async function updateAvailability(availabilityId: string, event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.body) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const body = JSON.parse(event.body);
  const { startTime, endTime, capacity, slotDuration, isActive } = body;

  const updateExpressions: string[] = [];
  const expressionAttributeValues: Record<string, any> = {};
  const expressionAttributeNames: Record<string, string> = {};

  if (startTime !== undefined) {
    updateExpressions.push('#startTime = :startTime');
    expressionAttributeValues[':startTime'] = startTime;
    expressionAttributeNames['#startTime'] = 'startTime';
  }

  if (endTime !== undefined) {
    updateExpressions.push('#endTime = :endTime');
    expressionAttributeValues[':endTime'] = endTime;
    expressionAttributeNames['#endTime'] = 'endTime';
  }

  if (capacity !== undefined) {
    updateExpressions.push('#capacity = :capacity');
    expressionAttributeValues[':capacity'] = capacity;
    expressionAttributeNames['#capacity'] = 'capacity';
  }

  if (slotDuration !== undefined) {
    updateExpressions.push('#slotDuration = :slotDuration');
    expressionAttributeValues[':slotDuration'] = slotDuration;
    expressionAttributeNames['#slotDuration'] = 'slotDuration';
  }

  if (isActive !== undefined) {
    updateExpressions.push('#isActive = :isActive');
    expressionAttributeValues[':isActive'] = isActive;
    expressionAttributeNames['#isActive'] = 'isActive';
  }

  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();
  expressionAttributeNames['#updatedAt'] = 'updatedAt';

  if (updateExpressions.length === 0) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'No fields to update' }),
    };
  }

  await ddbDocClient.send(
    new UpdateCommand({
      TableName: AVAILABILITY_TABLE,
      Key: { availabilityId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: 'Availability schedule updated successfully',
      availabilityId,
    }),
  };
}

async function deleteAvailability(availabilityId: string): Promise<APIGatewayProxyResult> {
  await ddbDocClient.send(
    new DeleteCommand({
      TableName: AVAILABILITY_TABLE,
      Key: { availabilityId },
    })
  );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: 'Availability schedule deleted successfully',
      availabilityId,
    }),
  };
}
