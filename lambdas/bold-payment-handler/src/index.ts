/**
 * Bold Payment Handler
 * Maneja la generación de hash de integridad y webhooks de pago
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import * as crypto from 'crypto';

const BOLD_SECRET_KEY = process.env.BOLD_SECRET_KEY || '';
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://tg-om.vercel.app',
  'https://www.clyok.in'
];

interface GenerateHashRequest {
  orderId: string;
  amount: number;
  currency: string;
}

interface GenerateHashResponse {
  hash: string;
  orderId: string;
  amount: number;
  currency: string;
}

/**
 * Genera hash SHA256 para Bold
 * Formato: {orderId}{amount}{currency}{secretKey}
 */
function generateBoldHash(orderId: string, amount: number, currency: string): string {
  const concatenated = `${orderId}${amount}${currency}${BOLD_SECRET_KEY}`;
  return crypto.createHash('sha256').update(concatenated).digest('hex');
}

/**
 * Genera un ID único para la orden
 */
function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  return `APT-${userId.slice(0, 8)}-${timestamp}`;
}

/**
 * Headers CORS
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Lambda Handler
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('📥 Bold Payment Handler - Event:', JSON.stringify(event, null, 2));

  const origin = event.headers?.origin || event.headers?.Origin;
  const corsHeaders = getCorsHeaders(origin);

  // Handle OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path || event.resource;
    console.log('📍 Request path:', path);
    console.log('🔧 HTTP method:', event.httpMethod);

    // POST /api/bold/generate-hash - Generar hash de integridad
    if (event.httpMethod === 'POST' && path.includes('/generate-hash')) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing request body' })
        };
      }

      const body: GenerateHashRequest = JSON.parse(event.body);
      const { orderId, amount, currency } = body;

      if (!orderId || !amount || !currency) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            error: 'Missing required fields: orderId, amount, currency' 
          })
        };
      }

      console.log('🔐 Generating hash for:', { orderId, amount, currency });

      const hash = generateBoldHash(orderId, amount, currency);

      const response: GenerateHashResponse = {
        hash,
        orderId,
        amount,
        currency
      };

      console.log('✅ Hash generated successfully');

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      };
    }

    // POST /api/bold/webhook - Webhook de Bold para actualizar estado de pago
    if (event.httpMethod === 'POST' && path.includes('/webhook')) {
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing request body' })
        };
      }

      const webhookData = JSON.parse(event.body);
      console.log('📨 Bold Webhook received:', webhookData);

      // TODO: Implementar lógica para actualizar estado de pago en DynamoDB
      // - Buscar la cita por orderId
      // - Actualizar el estado de pago
      // - Enviar notificación al usuario si aplica

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: true, 
          message: 'Webhook received' 
        })
      };
    }

    // GET /api/bold/order-id - Generar un nuevo orderId
    if (event.httpMethod === 'GET' && path.includes('/order-id')) {
      const userId = event.queryStringParameters?.userId;
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing userId parameter' })
        };
      }

      const orderId = generateOrderId(userId);

      return {
        statusCode: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      };
    }

    // Ruta no encontrada
    return {
      statusCode: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('❌ Error in Bold Payment Handler:', error);
    
    return {
      statusCode: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
