import jwt from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

// Cache for JWT secret
let jwtSecretCache: string | null = null;
let cacheExpiry: number = 0;

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Get JWT Secret from SSM Parameter Store with caching
 */
async function getJWTSecret(): Promise<string> {
  const now = Date.now();
  
  if (jwtSecretCache && now < cacheExpiry) {
    return jwtSecretCache;
  }

  try {
    const command = new GetParameterCommand({
      Name: '/auth/jwt-secret',
      WithDecryption: true,
    });
    
    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error('JWT secret not found in SSM');
    }

    jwtSecretCache = response.Parameter.Value;
    cacheExpiry = now + (10 * 60 * 1000); // Cache for 10 minutes
    
    return jwtSecretCache;
  } catch (error) {
    console.error('Error getting JWT secret from SSM:', error);
    throw new Error('Failed to retrieve JWT secret');
  }
}

/**
 * Generate access token and refresh token
 */
export async function generateTokens(userId: string, email?: string, sessionId?: string): Promise<TokenPair> {
  const secret = await getJWTSecret();
  const finalSessionId = sessionId || Date.now().toString();
  
  const payload: JWTPayload = {
    userId,
    email: email || '',
    role: 'user',
    sessionId: finalSessionId
  };
  
  const accessTokenExpiry = process.env.TOKEN_EXPIRY || '1h';
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY || '30d';

  // Generate access token
  const accessToken = jwt.sign(payload, secret, {
    expiresIn: accessTokenExpiry,
  } as any);

  // Generate refresh token (longer expiry, minimal payload)
  const refreshToken = jwt.sign(
    { 
      userId: payload.userId, 
      sessionId: payload.sessionId,
      email: payload.email,
      type: 'refresh'
    }, 
    secret, 
    {
      expiresIn: refreshTokenExpiry,
    } as any
  );

  // Calculate expiry time in seconds
  const expiresIn = jwt.decode(accessToken) as any;
  const expirationTime = expiresIn?.exp ? expiresIn.exp - expiresIn.iat : 3600;

  return {
    accessToken,
    refreshToken,
    expiresIn: expirationTime,
  };
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string, type: 'access' | 'refresh' = 'access'): Promise<any> {
  const secret = await getJWTSecret();
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'auth-service',
      audience: type === 'access' ? 'api-service' : 'api-service',
    }) as any;
    
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Alias para compatibilidad
export const generatePasswordResetToken = generateResetToken;
export const verifyPasswordResetToken = verifyResetToken;

/**
 * Generate password reset token
 */
export async function generateResetToken(userId: string, email: string): Promise<string> {
  const secret = await getJWTSecret();
  
  return jwt.sign(
    { 
      userId, 
      email, 
      type: 'password-reset' 
    }, 
    secret, 
    {
      expiresIn: '1h', // Reset tokens expire in 1 hour
      issuer: 'auth-service',
      audience: 'password-reset',
    }
  );
}

/**
 * Verify password reset token
 */
export async function verifyResetToken(token: string): Promise<{ userId: string; email: string }> {
  const secret = await getJWTSecret();
  
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'auth-service',
      audience: 'password-reset',
    }) as any;
    
    if (decoded.type !== 'password-reset') {
      throw new Error('Invalid token type');
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    throw new Error('Invalid or expired reset token');
  }
}