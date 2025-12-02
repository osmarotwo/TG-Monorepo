import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(client);

const APPOINTMENTS_TABLE = process.env.APPOINTMENTS_TABLE || 'tg-om-appointments';
const USERS_TABLE = process.env.USERS_TABLE || 'tg-om-users';
const LOCATIONS_TABLE = process.env.LOCATIONS_TABLE || 'tg-om-locations';

interface Appointment {
  appointmentId: string;
  businessId: string;
  locationId: string;
  userId: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  serviceCurrency: string;
  serviceDuration: number;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Business Appointments Handler Event:', JSON.stringify(event, null, 2));

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Extract businessId from path parameters
    const businessId = event.pathParameters?.businessId;
    
    if (!businessId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Missing business ID' })
      };
    }

    // Verify the requesting user has access to this business data
    const requestingUserId = event.requestContext?.authorizer?.claims?.sub;
    
    if (!requestingUserId) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Unauthorized: No user ID found' })
      };
    }

    // For now, we'll assume the businessId from path is the same as userId for business owners
    // In a production system, you'd verify this through a business-user relationship table
    if (requestingUserId !== businessId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Forbidden: You do not have access to this business data' })
      };
    }

    // Query appointments for this business
    const result = await ddbDocClient.send(new QueryCommand({
      TableName: APPOINTMENTS_TABLE,
      IndexName: 'BusinessIdIndex',
      KeyConditionExpression: 'businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': businessId
      }
    }));

    const appointments = result.Items as Appointment[] || [];

    // Enrich appointments with user and location details
    const enrichedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        try {
          // Fetch user details
          const userResult = await ddbDocClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId: appointment.userId }
          }));

          // Fetch location details
          const locationResult = await ddbDocClient.send(new GetCommand({
            TableName: LOCATIONS_TABLE,
            Key: { locationId: appointment.locationId }
          }));

          return {
            ...appointment,
            userName: userResult.Item ? `${userResult.Item.firstName || ''} ${userResult.Item.lastName || ''}`.trim() : 'Unknown User',
            userEmail: userResult.Item?.email || '',
            userPhone: userResult.Item?.phoneNumber || '',
            locationName: locationResult.Item?.locationName || 'Unknown Location',
            locationAddress: locationResult.Item?.address || ''
          };
        } catch (error) {
          console.error('Error enriching appointment:', error);
          return {
            ...appointment,
            userName: 'Unknown User',
            userEmail: '',
            userPhone: '',
            locationName: 'Unknown Location',
            locationAddress: ''
          };
        }
      })
    );

    // Sort by appointment date and time (newest first)
    enrichedAppointments.sort((a, b) => {
      const dateA = new Date(`${a.appointmentDate}T${a.appointmentTime}`);
      const dateB = new Date(`${b.appointmentDate}T${b.appointmentTime}`);
      return dateB.getTime() - dateA.getTime();
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        appointments: enrichedAppointments,
        total: enrichedAppointments.length,
        businessId
      })
    };
  } catch (error) {
    console.error('Error fetching business appointments:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
