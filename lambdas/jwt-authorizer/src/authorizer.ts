import { APIGatewayRequestAuthorizerEvent, APIGatewayAuthorizerResult, Context } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as jwt from 'jsonwebtoken';

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const ssmClient = new SSMClient({});

// Cache for JWT secret (to avoid SSM calls on every request)
let jwtSecretCache: string | null = null;
let cacheExpiry: number = 0;

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
  iat: number;
  exp: number;
}

interface UserSession {
  PK: string;
  SK: string;
  userId: string;
  sessionId: string;
  tokenHash: string;
  expiresAt: string;
  isActive: boolean;
}

/**
 * Get JWT Secret from SSM Parameter Store with caching
 */
async function getJWTSecret(): Promise<string> {
  const now = Date.now();
  
  // Return cached secret if still valid (cache for 10 minutes)
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
 * Validate session in DynamoDB
 */
async function validateSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const command = new GetCommand({
      TableName: process.env.SESSIONS_TABLE!,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: 'TOKEN',
      },
    });

    const response = await docClient.send(command);
    const session = response.Item as UserSession;

    if (!session) {
      console.log('Session not found in database');
      return false;
    }

    // Check if session is active
    if (!session.isActive) {
      console.log('Session is not active');
      return false;
    }

    // Check if session belongs to the user
    if (session.userId !== userId) {
      console.log('Session does not belong to user');
      return false;
    }

    // Check if session is expired
    const expiresAt = new Date(session.expiresAt);
    const now = new Date();
    
    if (expiresAt <= now) {
      console.log('Session has expired');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
}

/**
 * Generate IAM policy
 */
function generatePolicy(principalId: string, effect: 'Allow' | 'Deny', resource: string, context?: any): APIGatewayAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
    context: context || {},
  };
}

/**
 * Main authorizer handler
 */
export const handler = async (
  event: APIGatewayRequestAuthorizerEvent,
  context: Context
): Promise<APIGatewayAuthorizerResult> => {
  console.log('Authorizer event:', JSON.stringify(event, null, 2));

  try {
    // Extract token from Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      console.log('No Authorization header found');
      throw new Error('Unauthorized');
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Authorization header is not a Bearer token');
      throw new Error('Unauthorized');
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      console.log('No token found in Authorization header');
      throw new Error('Unauthorized');
    }

    // Get JWT secret
    const jwtSecret = await getJWTSecret();

    // Verify JWT token
    let decodedToken: JWTPayload;
    try {
      decodedToken = jwt.verify(token, jwtSecret) as JWTPayload;
    } catch (jwtError) {
      console.log('JWT verification failed:', jwtError);
      throw new Error('Unauthorized');
    }

    // Extract user information from token
    const { userId, email, role, sessionId } = decodedToken;

    if (!userId || !sessionId) {
      console.log('Token missing required fields');
      throw new Error('Unauthorized');
    }

    // Validate session in database
    const isSessionValid = await validateSession(sessionId, userId);
    
    if (!isSessionValid) {
      console.log('Session validation failed');
      throw new Error('Unauthorized');
    }

    console.log(`Authorization successful for user: ${userId}`);

    // Return Allow policy with user context
    return generatePolicy(userId, 'Allow', event.methodArn, {
      userId,
      email,
      role,
      sessionId,
    });

  } catch (error) {
    console.error('Authorization error:', error);
    
    // Return Deny policy
    return generatePolicy('user', 'Deny', event.methodArn);
  }
};