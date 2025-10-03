import { OAuth2Client } from 'google-auth-library';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = new SSMClient({});

// Cache for Google Client ID
let googleClientIdCache: string | null = null;
let cacheExpiry: number = 0;

export interface GoogleUserInfo {
  sub: string;           // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  locale?: string;
}

/**
 * Get Google Client ID from SSM Parameter Store with caching
 */
async function getGoogleClientId(): Promise<string> {
  const now = Date.now();
  
  if (googleClientIdCache && now < cacheExpiry) {
    return googleClientIdCache;
  }

  try {
    const command = new GetParameterCommand({
      Name: '/auth/google-client-id',
      WithDecryption: false,
    });
    
    const response = await ssmClient.send(command);
    
    if (!response.Parameter?.Value) {
      throw new Error('Google Client ID not found in SSM');
    }

    googleClientIdCache = response.Parameter.Value;
    cacheExpiry = now + (10 * 60 * 1000); // Cache for 10 minutes
    
    return googleClientIdCache;
  } catch (error) {
    console.error('Error getting Google Client ID from SSM:', error);
    throw new Error('Failed to retrieve Google Client ID');
  }
}

/**
 * Verify Google ID token and extract user information
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleUserInfo> {
  try {
    const clientId = await getGoogleClientId();
    const client = new OAuth2Client(clientId);
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }

    // Validate required fields
    if (!payload.sub || !payload.email) {
      throw new Error('Missing required fields in Google token');
    }

    const userInfo: GoogleUserInfo = {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified || false,
      name: payload.name || '',
      picture: payload.picture || '',
      given_name: payload.given_name || '',
      family_name: payload.family_name || '',
      locale: payload.locale,
    };

    console.log('Google token verified successfully for user:', userInfo.email);
    return userInfo;

  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
}