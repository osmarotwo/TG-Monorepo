/**
 * Bold Payment Service
 * Servicio para integración con Bold.co pagos
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_DATA_API_URL || 'https://v0igzegm95.execute-api.us-east-1.amazonaws.com/prod';

export interface BoldHashRequest {
  orderId: string;
  amount: number;
  currency: string;
}

export interface BoldHashResponse {
  hash: string;
  orderId: string;
  amount: number;
  currency: string;
}

export interface BoldOrderIdResponse {
  orderId: string;
}

/**
 * Get authentication token
 */
function getAuthToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
}

/**
 * Genera un nuevo Order ID único
 */
export async function generateOrderId(userId: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bold/order-id?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to generate order ID: ${response.statusText}`);
    }

    const data: BoldOrderIdResponse = await response.json();
    return data.orderId;
  } catch (error) {
    console.error('Error generating order ID:', error);
    // Fallback: generar localmente
    const timestamp = Date.now();
    return `APT-${userId.slice(0, 8)}-${timestamp}`;
  }
}

/**
 * Genera el hash de integridad para Bold
 */
export async function generateBoldHash(
  orderId: string,
  amount: number,
  currency: string = 'COP'
): Promise<BoldHashResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bold/generate-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ orderId, amount, currency })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate hash');
    }

    const data: BoldHashResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating Bold hash:', error);
    throw error;
  }
}

/**
 * Calcula el 20% del monto del servicio (anticipo)
 */
export function calculateDeposit(servicePrice: number): number {
  return Math.round(servicePrice * 0.20);
}

/**
 * Formatea el monto para Bold (sin decimales)
 */
export function formatAmountForBold(amount: number): number {
  return Math.round(amount);
}
