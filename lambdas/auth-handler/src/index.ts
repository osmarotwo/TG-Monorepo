import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { 
  generateTokens, 
  verifyToken, 
  generatePasswordResetToken, 
  verifyPasswordResetToken 
} from './utils/jwt';
import { hashPassword, comparePassword, generateRandomPassword } from './utils/password';
import { 
  createUser, 
  getUserByEmail, 
  getUserByGoogleId, 
  getUserById, 
  updateUser, 
  createSession, 
  getSession, 
  createEmailVerification, 
  getEmailVerification, 
  deleteEmailVerification,
  SESSIONS_TABLE,
  docClient 
} from './utils/dynamodb';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { verifyGoogleToken } from './utils/google-verify';
import { sendVerificationEmail, sendPasswordResetEmail } from './utils/email';
import {
  validateData,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  completeProfileSchema,
  refreshTokenSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  RegisterRequest,
  LoginRequest,
  GoogleAuthRequest,
  CompleteProfileRequest,
  RefreshTokenRequest,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest
} from './utils/validation';
import { v4 as uuidv4 } from 'uuid';

// Tipos auxiliares
interface AuthorizedEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayProxyEvent['requestContext'] & {
    authorizer: {
      userId: string;
      email: string;
      sessionId: string;
    };
  };
}

// Respuesta estándar
const createResponse = (statusCode: number, body: any, headers: any = {}): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    ...headers,
  },
  body: JSON.stringify(body),
});

// Manejo de errores
const handleError = (error: any): APIGatewayProxyResult => {
  console.error('Error:', error);
  
  if (error.message.includes('Validation error')) {
    return createResponse(400, { error: error.message });
  }
  
  if (error.message.includes('User already exists') || error.message.includes('Invalid credentials')) {
    return createResponse(400, { error: error.message });
  }
  
  if (error.message.includes('Unauthorized') || error.message.includes('Token expired')) {
    return createResponse(401, { error: error.message });
  }
  
  if (error.message.includes('Not found')) {
    return createResponse(404, { error: error.message });
  }
  
  return createResponse(500, { error: 'Internal server error' });
};

// Email functions are now imported from ./utils/email

// 🔓 ENDPOINT: Registro manual
export const handleRegister = async (event: any): Promise<any> => {
  try {
    console.log('Register event received:', JSON.stringify(event));
    
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { email, password, firstName, lastName, fullName, birthDate, gender, clientId } = JSON.parse(event.body);

    // Support both fullName and firstName/lastName
    const finalFullName = fullName || (firstName && lastName ? `${firstName} ${lastName}` : '');
    const finalFirstName = firstName || (fullName ? fullName.split(' ')[0] : '');
    const finalLastName = lastName || (fullName ? fullName.split(' ').slice(1).join(' ') : '');

    if (!email || !password || (!fullName && (!firstName || !lastName))) {
      return createResponse(400, { 
        error: 'Email, password, and name (fullName or firstName/lastName) are required' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createResponse(400, { error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return createResponse(400, { 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Validate birth date if provided
    if (birthDate) {
      const birthDateObj = new Date(birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDateObj.getFullYear();
      
      if (isNaN(birthDateObj.getTime())) {
        return createResponse(400, { error: 'Invalid birth date format. Use YYYY-MM-DD' });
      }
      
      if (age < 13) {
        return createResponse(400, { error: 'You must be at least 13 years old to register' });
      }
      
      if (age > 120) {
        return createResponse(400, { error: 'Invalid birth date' });
      }
    }

    // Validate gender if provided
    if (gender && !['male', 'female', 'prefer-not-to-say'].includes(gender)) {
      return createResponse(400, { error: 'Invalid gender value' });
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return createResponse(400, { error: 'User already exists' });
    }

    // Create new user
    const userId = uuidv4();
    const hashedPassword = await hashPassword(password);
    
    const newUser = {
      userId,
      email,
      password: hashedPassword,
      firstName: finalFirstName,
      lastName: finalLastName,
      fullName: finalFullName,
      birthDate: birthDate || undefined,
      gender: gender || undefined,
      clientId: clientId || null,
      emailVerified: false,
      profileCompleted: !!birthDate && !!gender, // Profile completed if optional fields are provided
      provider: 'email' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await createUser(newUser);

    // Generate email verification token
    const verificationToken = uuidv4();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await createEmailVerification({
      userId,
      email,
      token: verificationToken,
      expiresAt: verificationExpiry.getTime(),
      createdAt: new Date().toISOString()
    });

    console.log(`Email verification created for user ${userId} with token ${verificationToken}`);

    // Send verification email
    await sendVerificationEmail(email, verificationToken, finalFirstName);
    console.log(`Verification email sent to: ${email}`);

    return createResponse(201, {
      message: 'User registered successfully. Please check your email for verification.',
      userId
      // verificationToken removed for security in production
    });

  } catch (error) {
    console.error('Registration error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// 🔓 ENDPOINT: Login manual
const handleLogin = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(loginSchema, JSON.parse(event.body || '{}')) as LoginRequest;
    
    // Buscar usuario
    const user = await getUserByEmail(data.email);
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }
    
    // Verificar password
    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }
    
    // Verificar que el email esté verificado
    if (!user.emailVerified) {
      throw new Error('Please verify your email before logging in');
    }
    
    // Generar tokens
    const tokens = await generateTokens(user.userId, user.email);
    
    // Crear sesión
    const sessionId = uuidv4();
    await createSession({
      sessionId,
      userId: user.userId,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 días
    });
    
    return createResponse(200, {
      message: 'Login successful',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
      },
      tokens,
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔓 ENDPOINT: Google OAuth
const handleGoogleAuth = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(googleAuthSchema, JSON.parse(event.body || '{}')) as GoogleAuthRequest;
    
    // Verificar Google ID token
    const googleUser = await verifyGoogleToken(data.idToken);
    
    // Buscar usuario existente por Google ID o email
    let user = await getUserByGoogleId(googleUser.sub);
    if (!user) {
      user = await getUserByEmail(googleUser.email);
    }
    
    if (user) {
      // Usuario existente - actualizar Google ID si es necesario
      if (!user.googleId) {
        await updateUser(user.userId, { googleId: googleUser.sub });
        user.googleId = googleUser.sub;
      }
    } else {
      // Nuevo usuario - crear cuenta
      const userId = uuidv4();
      user = await createUser({
        userId,
        email: googleUser.email,
        firstName: googleUser.given_name || '',
        lastName: googleUser.family_name || '',
        googleId: googleUser.sub,
        emailVerified: true, // Google ya verificó el email
        profileCompleted: false,
        provider: 'google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    // Generar tokens
    const tokens = await generateTokens(user.userId, user.email);
    
    // Crear sesión
    const sessionId = uuidv4();
    await createSession({
      sessionId,
      userId: user.userId,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 días
    });
    
    return createResponse(200, {
      message: 'Google authentication successful',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
      },
      tokens,
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔒 ENDPOINT: Completar perfil (protegido)
const handleCompleteProfile = async (event: AuthorizedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(completeProfileSchema, JSON.parse(event.body || '{}')) as CompleteProfileRequest;
    const userId = event.requestContext.authorizer.userId;
    
    // Actualizar perfil del usuario
    await updateUser(userId, {
      phone: data.phone,
      birthDate: data.birthDate,
      profileCompleted: true,
      updatedAt: new Date().toISOString(),
    });
    
    // Obtener usuario actualizado
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return createResponse(200, {
      message: 'Profile completed successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔒 ENDPOINT: Obtener perfil (protegido)
const handleGetProfile = async (event: AuthorizedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.requestContext.authorizer.userId;
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return createResponse(200, {
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
        provider: user.provider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔒 ENDPOINT: Logout (protegido)
const handleLogout = async (event: AuthorizedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const sessionId = event.requestContext.authorizer.sessionId;
    
    // Eliminar sesión correctamente usando SESSIONS_TABLE
    await docClient.send(new DeleteCommand({
      TableName: SESSIONS_TABLE,
      Key: {
        PK: `SESSION#${sessionId}`,
        SK: 'SESSION'
      }
    }));
    
    return createResponse(200, {
      message: 'Logout successful',
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔓 ENDPOINT: Refresh token
const handleRefreshToken = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(refreshTokenSchema, JSON.parse(event.body || '{}')) as RefreshTokenRequest;
    
    // Verificar refresh token
    const payload = await verifyToken(data.refreshToken, 'refresh');
    
    // Verificar sesión
    const session = await getSession(payload.sessionId);
    if (!session || session.refreshToken !== data.refreshToken) {
      throw new Error('Invalid refresh token');
    }
    
    // Generar nuevos tokens
    const tokens = await generateTokens(session.userId, payload.email);
    
    // Actualizar sesión con nuevo refresh token
    await createSession({
      sessionId: session.sessionId,
      userId: session.userId,
      refreshToken: tokens.refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 días
    });
    
    return createResponse(200, {
      message: 'Tokens refreshed successfully',
      tokens,
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔓 ENDPOINT: Verificar email
const handleVerifyEmail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    console.log('Verify email event received:', JSON.stringify(event));
    
    if (!event.body) {
      return createResponse(400, { error: 'Request body is required' });
    }

    const { token } = JSON.parse(event.body);
    console.log('Token received:', token);

    if (!token) {
      return createResponse(400, { error: 'Token is required' });
    }

    // Obtener verificación de email
    console.log('Getting email verification for token:', token);
    const verification = await getEmailVerification(token);
    console.log('Verification found:', verification);
    
    if (!verification) {
      return createResponse(400, { error: 'Invalid or expired verification token' });
    }
    
    // Verificar si no ha expirado
    console.log('Current time:', Date.now(), 'Expires at:', verification.expiresAt);
    if (verification.expiresAt < Date.now()) {
      await deleteEmailVerification(token);
      return createResponse(400, { error: 'Verification token has expired' });
    }
    
    // Marcar email como verificado
    console.log('Updating user:', verification.userId);
    await updateUser(verification.userId, {
      emailVerified: true,
    });
    
    // Eliminar token de verificación
    console.log('Deleting verification token');
    await deleteEmailVerification(token);
    
    return createResponse(200, {
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Verification error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};

// 🔓 ENDPOINT: Forgot password
const handleForgotPassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(forgotPasswordSchema, JSON.parse(event.body || '{}')) as ForgotPasswordRequest;
    
    // Buscar usuario
    const user = await getUserByEmail(data.email);
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return createResponse(200, {
        message: 'If an account with this email exists, you will receive a password reset link.',
      });
    }
    
    // Generar token de reset
    const resetToken = await generatePasswordResetToken(user.userId, user.email);
    
    // Enviar email con token
    await sendPasswordResetEmail(user.email, resetToken, user.firstName || 'Usuario');
    
    return createResponse(200, {
      message: 'If an account with this email exists, you will receive a password reset link.',
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔓 ENDPOINT: Reset password
const handleResetPassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(resetPasswordSchema, JSON.parse(event.body || '{}')) as ResetPasswordRequest;
    
    // Verificar token de reset
    const payload = await verifyPasswordResetToken(data.token);
    
    // Hash de la nueva password
    const hashedPassword = await hashPassword(data.newPassword);
    
    // Actualizar password
    await updateUser(payload.userId, {
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    });
    
    return createResponse(200, {
      message: 'Password reset successfully',
    });
  } catch (error) {
    return handleError(error);
  }
};

// 🔒 ENDPOINT: Actualizar perfil (protegido)
const handleUpdateProfile = async (event: AuthorizedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const data = validateData(updateProfileSchema, JSON.parse(event.body || '{}')) as UpdateProfileRequest;
    const userId = event.requestContext.authorizer.userId;
    
    // Actualizar solo los campos proporcionados
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (data.firstName) updateData.firstName = data.firstName;
    if (data.lastName) updateData.lastName = data.lastName;
    if (data.phone) updateData.phone = data.phone;
    if (data.birthDate) updateData.birthDate = data.birthDate;
    
    await updateUser(userId, updateData);
    
    // Obtener usuario actualizado
    const user = await getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }
    
    return createResponse(200, {
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        birthDate: user.birthDate,
        profileCompleted: user.profileCompleted,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    return handleError(error);
  }
};

// Handler principal de Lambda
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  console.log('=== LAMBDA HANDLER STARTED ===');
  console.log('Lambda function name:', context.functionName);
  console.log('Lambda function version:', context.functionVersion);
  console.log('Event received:', JSON.stringify(event, null, 2));
  console.log('Environment variables:', JSON.stringify(process.env, null, 2));
  
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return createResponse(200, {}, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    });
  }
  
  const path = event.path;
  const method = event.httpMethod;
  
  try {
    // Rutas públicas (sin autenticación)
    if (method === 'POST' && path === '/auth/register') {
      return await handleRegister(event);
    }
    
    if (method === 'POST' && path === '/auth/login') {
      return await handleLogin(event);
    }
    
    // Support both /auth/google and /auth/google-auth for backward compatibility
    if (method === 'POST' && (path === '/auth/google' || path === '/auth/google-auth')) {
      return await handleGoogleAuth(event);
    }
    
    if (method === 'POST' && path === '/auth/refresh') {
      return await handleRefreshToken(event);
    }
    
    if (method === 'POST' && path === '/auth/verify-email') {
      return await handleVerifyEmail(event);
    }
    
    if (method === 'POST' && path === '/auth/forgot-password') {
      return await handleForgotPassword(event);
    }
    
    if (method === 'POST' && path === '/auth/reset-password') {
      return await handleResetPassword(event);
    }
    
    // Rutas protegidas (requieren autenticación)
    // El JWT Authorizer ya validó el token y agregó el contexto del usuario
    const authorizedEvent = event as AuthorizedEvent;
    
    if (method === 'POST' && path === '/auth/complete-profile') {
      return await handleCompleteProfile(authorizedEvent);
    }
    
    if (method === 'GET' && path === '/auth/me') {
      return await handleGetProfile(authorizedEvent);
    }
    
    if (method === 'POST' && path === '/auth/logout') {
      return await handleLogout(authorizedEvent);
    }
    
    if (method === 'PUT' && path === '/auth/profile') {
      return await handleUpdateProfile(authorizedEvent);
    }
    
    // Ruta no encontrada
    return createResponse(404, { error: 'Route not found' });
    
  } catch (error) {
    return handleError(error);
  }
};