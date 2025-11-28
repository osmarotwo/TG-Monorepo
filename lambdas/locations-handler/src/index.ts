import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { verifyToken } from './utils/jwt';
import {
  createLocation,
  getLocationsByBusiness,
  getLocationById,
  updateLocation,
  deleteLocation,
  Location
} from './utils/dynamodb';
import {
  validateData,
  createLocationSchema,
  updateLocationSchema,
  CreateLocationRequest,
  UpdateLocationRequest
} from './utils/validation';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.FRONTEND_URL || '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
  'Access-Control-Allow-Credentials': 'true',
  'Content-Type': 'application/json',
};

// Helper to create response
function createResponse(statusCode: number, body: any): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

// Helper to extract user from token
async function getUserFromToken(event: APIGatewayProxyEvent): Promise<{ userId: string; businessId?: string } | null> {
  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);
    
    return {
      userId: decoded.userId,
      businessId: decoded.businessId
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Create a new location
 */
async function handleCreateLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    if (!user.businessId) {
      return createResponse(403, { message: 'User is not associated with a business' });
    }

    const body = JSON.parse(event.body || '{}');
    const validationResult = validateData<CreateLocationRequest>(body, createLocationSchema);
    
    if (!validationResult.isValid) {
      return createResponse(400, { 
        message: 'Validation failed', 
        errors: validationResult.errors 
      });
    }

    const locationData = validationResult.data!;
    const location = await createLocation({
      ...locationData,
      businessId: user.businessId,
      createdBy: user.userId
    });

    return createResponse(201, { 
      message: 'Location created successfully', 
      location 
    });
  } catch (error: any) {
    console.error('Error creating location:', error);
    return createResponse(500, { 
      message: 'Failed to create location',
      error: error.message 
    });
  }
}

/**
 * Get all locations for a business
 */
async function handleGetLocations(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    if (!user.businessId) {
      return createResponse(403, { message: 'User is not associated with a business' });
    }

    const locations = await getLocationsByBusiness(user.businessId);

    return createResponse(200, { 
      locations,
      count: locations.length
    });
  } catch (error: any) {
    console.error('Error getting locations:', error);
    return createResponse(500, { 
      message: 'Failed to get locations',
      error: error.message 
    });
  }
}

/**
 * Get a single location by ID
 */
async function handleGetLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    const locationId = event.pathParameters?.id;
    if (!locationId) {
      return createResponse(400, { message: 'Location ID is required' });
    }

    const location = await getLocationById(locationId);

    if (!location) {
      return createResponse(404, { message: 'Location not found' });
    }

    // Verify user has access to this location
    if (location.businessId !== user.businessId) {
      return createResponse(403, { message: 'Access denied' });
    }

    return createResponse(200, { location });
  } catch (error: any) {
    console.error('Error getting location:', error);
    return createResponse(500, { 
      message: 'Failed to get location',
      error: error.message 
    });
  }
}

/**
 * Update a location
 */
async function handleUpdateLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    const locationId = event.pathParameters?.id;
    if (!locationId) {
      return createResponse(400, { message: 'Location ID is required' });
    }

    // Check if location exists and user has access
    const existingLocation = await getLocationById(locationId);
    if (!existingLocation) {
      return createResponse(404, { message: 'Location not found' });
    }

    if (existingLocation.businessId !== user.businessId) {
      return createResponse(403, { message: 'Access denied' });
    }

    const body = JSON.parse(event.body || '{}');
    const validationResult = validateData<UpdateLocationRequest>(body, updateLocationSchema);
    
    if (!validationResult.isValid) {
      return createResponse(400, { 
        message: 'Validation failed', 
        errors: validationResult.errors 
      });
    }

    const updates = validationResult.data!;
    const updatedLocation = await updateLocation(locationId, updates);

    return createResponse(200, { 
      message: 'Location updated successfully', 
      location: updatedLocation 
    });
  } catch (error: any) {
    console.error('Error updating location:', error);
    return createResponse(500, { 
      message: 'Failed to update location',
      error: error.message 
    });
  }
}

/**
 * Delete a location
 */
async function handleDeleteLocation(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  try {
    const user = await getUserFromToken(event);
    if (!user) {
      return createResponse(401, { message: 'Unauthorized' });
    }

    const locationId = event.pathParameters?.id;
    if (!locationId) {
      return createResponse(400, { message: 'Location ID is required' });
    }

    // Check if location exists and user has access
    const existingLocation = await getLocationById(locationId);
    if (!existingLocation) {
      return createResponse(404, { message: 'Location not found' });
    }

    if (existingLocation.businessId !== user.businessId) {
      return createResponse(403, { message: 'Access denied' });
    }

    await deleteLocation(locationId);

    return createResponse(200, { 
      message: 'Location deleted successfully' 
    });
  } catch (error: any) {
    console.error('Error deleting location:', error);
    return createResponse(500, { 
      message: 'Failed to delete location',
      error: error.message 
    });
  }
}

/**
 * Main Lambda handler
 */
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, {});
  }

  const path = event.path;
  const method = event.httpMethod;

  try {
    // Route requests
    if (path === '/locations' && method === 'POST') {
      return await handleCreateLocation(event);
    }
    
    if (path === '/locations' && method === 'GET') {
      return await handleGetLocations(event);
    }
    
    if (path.match(/^\/locations\/[^/]+$/) && method === 'GET') {
      return await handleGetLocation(event);
    }
    
    if (path.match(/^\/locations\/[^/]+$/) && method === 'PUT') {
      return await handleUpdateLocation(event);
    }
    
    if (path.match(/^\/locations\/[^/]+$/) && method === 'DELETE') {
      return await handleDeleteLocation(event);
    }

    return createResponse(404, { message: 'Not found' });
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return createResponse(500, { 
      message: 'Internal server error',
      error: error.message 
    });
  }
}
