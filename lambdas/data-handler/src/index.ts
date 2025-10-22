import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getAppointments, getAppointmentById, updateAppointment } from './handlers/appointments';
import { getLocations, getLocationById } from './handlers/locations';
import { getBusinesses, getBusinessById } from './handlers/businesses';
import { getKpisByLocation } from './handlers/kpis';
import { getAvailableSlots, checkMultipleAvailability, reserveSlot } from './handlers/availability';

/**
 * Main Lambda handler - Routes requests to appropriate handlers
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event received:', JSON.stringify(event, null, 2));

  const method = event.httpMethod;
  const path = event.path;

  try {
    // Route to appropriate handler based on path and method
    if (method === 'GET') {
      // Appointments routes
      if (path === '/api/appointments') {
        return await getAppointments(event);
      }
      if (path.match(/^\/api\/appointments\/[^/]+$/)) {
        return await getAppointmentById(event);
      }

      // Locations routes
      if (path === '/api/locations') {
        return await getLocations(event);
      }
      if (path.match(/^\/api\/locations\/[^/]+$/)) {
        return await getLocationById(event);
      }

      // Businesses routes
      if (path === '/api/businesses') {
        return await getBusinesses(event);
      }
      if (path.match(/^\/api\/businesses\/[^/]+$/)) {
        return await getBusinessById(event);
      }

      // KPIs routes
      if (path.match(/^\/api\/kpis\/[^/]+$/)) {
        return await getKpisByLocation(event);
      }

      // Availability routes
      if (path.match(/^\/api\/availability\/[^/]+\/[^/]+$/)) {
        // GET /api/availability/:locationId/:date
        return await getAvailableSlots(event);
      }
    }

    // POST routes
    if (method === 'POST') {
      if (path === '/api/availability/check-multiple') {
        return await checkMultipleAvailability(event);
      }
      if (path === '/api/availability/reserve') {
        return await reserveSlot(event);
      }
    }

    // PUT routes
    if (method === 'PUT') {
      if (path.match(/^\/api\/appointments\/[^/]+$/)) {
        // PUT /api/appointments/:appointmentId
        return await updateAppointment(event);
      }
    }

    // Route not found
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Route not found',
        path,
        method,
      }),
    };
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
