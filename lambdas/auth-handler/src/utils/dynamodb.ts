import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({});
export const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Table names from environment variables
export const USERS_TABLE = process.env.USERS_TABLE!;
export const SESSIONS_TABLE = process.env.SESSIONS_TABLE!;
export const EMAIL_VERIFICATIONS_TABLE = process.env.EMAIL_VERIFICATIONS_TABLE!;

export interface User {
  PK: string;                    // USER#${userId}
  SK: string;                    // PROFILE
  GSI1PK: string;               // EMAIL#${email}
  GSI1SK: string;               // USER
  GSI2PK?: string;              // GOOGLE#${googleId}
  GSI2SK?: string;              // USER
  
  userId: string;
  googleId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;            // Nombre completo
  name?: string;                // Para compatibilidad con Google
  pictureUrl?: string;
  phone?: string;
  birthDate?: string;           // Fecha de nacimiento (YYYY-MM-DD)
  gender?: 'male' | 'female' | 'prefer-not-to-say'; // Sexo
  password?: string;
  passwordHash?: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  provider: 'google' | 'email';
  registrationMethod?: 'google' | 'manual';
  accountStatus?: 'pending' | 'active';
  role?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  PK: string; // SESSION#sessionId
  SK: string; // SESSION
  sessionId: string;
  userId: string;
  refreshToken: string;
  expiresAt: number;
  isActive?: boolean; // Estado de la sesión
  ttl?: number; // TTL para DynamoDB (expiresAt en segundos)
}

export interface EmailVerification {
  PK: string;                    // EMAIL_VERIFY#${token}
  SK: string;                    // TOKEN
  
  userId: string;
  email: string;
  token: string;
  expiresAt: number;
  createdAt?: string;
  ttl?: number;                   // TTL for automatic cleanup
}

/**
 * Create a new user
 */
export async function createUser(userData: Omit<User, 'PK' | 'SK' | 'GSI1PK' | 'GSI1SK' | 'GSI2PK' | 'GSI2SK'>): Promise<User> {
  const user: User = {
    PK: `USER#${userData.userId}`,
    SK: 'PROFILE',
    GSI1PK: `EMAIL#${userData.email}`,
    GSI1SK: 'USER',
    ...userData,
  };

  // Add Google GSI if googleId exists
  if (userData.googleId) {
    user.GSI2PK = `GOOGLE#${userData.googleId}`;
    user.GSI2SK = 'USER';
  }

  try {
    await docClient.send(new PutCommand({
      TableName: USERS_TABLE,
      Item: user,
      ConditionExpression: 'attribute_not_exists(PK)', // Prevent duplicates
    }));

    return user;
  } catch (error: any) {
    if (error.name === 'ConditionalCheckFailedException') {
      throw new Error('User already exists');
    }
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: USERS_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
    }));

    return response.Item as User || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'GSI1',
      KeyConditionExpression: 'GSI1PK = :email AND GSI1SK = :sk',
      ExpressionAttributeValues: {
        ':email': `EMAIL#${email}`,
        ':sk': 'USER',
      },
    }));

    const items = response.Items;
    return items && items.length > 0 ? items[0] as User : null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Get user by Google ID
 */
export async function getUserByGoogleId(googleId: string): Promise<User | null> {
  try {
    const response = await docClient.send(new QueryCommand({
      TableName: USERS_TABLE,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :googleId AND GSI2SK = :sk',
      ExpressionAttributeValues: {
        ':googleId': `GOOGLE#${googleId}`,
        ':sk': 'USER',
      },
    }));

    const items = response.Items;
    return items && items.length > 0 ? items[0] as User : null;
  } catch (error) {
    console.error('Error getting user by Google ID:', error);
    throw new Error('Failed to get user');
  }
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  // Build update expression dynamically
  Object.entries(updates).forEach(([key, value]) => {
    if (key !== 'PK' && key !== 'SK' && key !== 'userId' && value !== undefined) {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    }
  });

  // Always update updatedAt
  updateExpressions.push('#updatedAt = :updatedAt');
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  try {
    const response = await docClient.send(new UpdateCommand({
      TableName: USERS_TABLE,
      Key: {
        PK: `USER#${userId}`,
        SK: 'PROFILE',
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    }));

    return response.Attributes as User;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }
}

/**
 * Create a session
 */
export async function createSession(sessionData: Omit<Session, 'PK' | 'SK'>): Promise<Session> {
  const session: Session = {
    PK: `SESSION#${sessionData.sessionId}`,
    SK: 'SESSION',
    ...sessionData,
    isActive: true, // Sesión activa por defecto
    // Agregar TTL en segundos (expiresAt está en milisegundos)
    ttl: Math.floor(sessionData.expiresAt / 1000),
  };

  console.log('Creating session:', {
    sessionId: sessionData.sessionId,
    userId: sessionData.userId,
    expiresAt: new Date(sessionData.expiresAt).toISOString(),
    ttl: session.ttl
  });

  try {
    await docClient.send(new PutCommand({
      TableName: SESSIONS_TABLE, // Corregido: usar la tabla correcta
      Item: session,
    }));

    console.log('Session created successfully');
    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: 'SESSION', // Corregido: usar el SK correcto
      },
    }));

    return response.Item as Session || null;
  } catch (error) {
    console.error('Error getting session:', error);
    throw new Error('Failed to get session');
  }
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  try {
    await docClient.send(new UpdateCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: 'TOKEN',
      },
      UpdateExpression: 'SET isActive = :inactive',
      ExpressionAttributeValues: {
        ':inactive': false,
      },
    }));
  } catch (error) {
    console.error('Error invalidating session:', error);
    throw new Error('Failed to invalidate session');
  }
}

/**
 * Create email verification
 */
export async function createEmailVerification(verificationData: Omit<EmailVerification, 'PK' | 'SK'>): Promise<EmailVerification> {
  const verification: EmailVerification = {
    PK: `EMAIL_VERIFY#${verificationData.token}`,
    SK: 'TOKEN',
    ...verificationData,
    // Agregar TTL en segundos (expiresAt está en milisegundos)
    ttl: Math.floor(verificationData.expiresAt / 1000),
  };

  console.log('Creating email verification:', {
    token: verificationData.token,
    email: verificationData.email,
    userId: verificationData.userId,
    expiresAt: new Date(verificationData.expiresAt).toISOString(),
    ttl: verification.ttl
  });

  try {
    await docClient.send(new PutCommand({
      TableName: EMAIL_VERIFICATIONS_TABLE,
      Item: verification,
    }));

    console.log('Email verification created successfully');
    return verification;
  } catch (error) {
    console.error('Error creating email verification:', error);
    throw new Error('Failed to create email verification');
  }
}

/**
 * Get email verification by token
 */
export async function getEmailVerification(token: string): Promise<EmailVerification | null> {
  try {
    const response = await docClient.send(new GetCommand({
      TableName: EMAIL_VERIFICATIONS_TABLE,
      Key: {
        PK: `EMAIL_VERIFY#${token}`,
        SK: 'TOKEN',
      },
    }));

    return response.Item as EmailVerification || null;
  } catch (error) {
    console.error('Error getting email verification:', error);
    throw new Error('Failed to get email verification');
  }
}

/**
 * Delete email verification
 */
export async function deleteEmailVerification(token: string): Promise<void> {
  try {
    await docClient.send(new DeleteCommand({
      TableName: EMAIL_VERIFICATIONS_TABLE,
      Key: {
        PK: `EMAIL_VERIFY#${token}`,
        SK: 'TOKEN',
      },
    }));
  } catch (error) {
    console.error('Error deleting email verification:', error);
    throw new Error('Failed to delete email verification');
  }
}