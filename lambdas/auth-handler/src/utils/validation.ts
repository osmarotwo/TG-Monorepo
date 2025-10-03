import Joi from 'joi';

// Schemas de validación para todos los endpoints

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const googleAuthSchema = Joi.object({
  idToken: Joi.string().required(),
});

export const completeProfileSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  birthDate: Joi.date().iso().max('now').required(),
  profileCompleted: Joi.boolean().default(true),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const verifyEmailSchema = Joi.object({
  token: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  birthDate: Joi.date().iso().max('now').optional(),
});

// Función auxiliar para validar datos
export const validateData = (schema: Joi.ObjectSchema, data: any) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }
  
  return value;
};

// Tipos TypeScript basados en los schemas
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleAuthRequest {
  idToken: string;
}

export interface CompleteProfileRequest {
  phone: string;
  birthDate: string;
  profileCompleted?: boolean;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
}