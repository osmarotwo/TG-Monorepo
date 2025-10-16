/**
 * Email Service - Manejo de envío de emails con AWS SES
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client
const sesClient = new SESClient({ 
  region: process.env.SES_REGION || 'us-east-1' 
});

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send email using AWS SES
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const fromEmail = process.env.SES_FROM_EMAIL;
  
  if (!fromEmail) {
    throw new Error('SES_FROM_EMAIL environment variable not set');
  }

  const command = new SendEmailCommand({
    Source: fromEmail,
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: options.htmlBody,
          Charset: 'UTF-8',
        },
        Text: options.textBody ? {
          Data: options.textBody,
          Charset: 'UTF-8',
        } : undefined,
      },
    },
  });

  try {
    console.log(`📧 Sending email to: ${options.to} from: ${fromEmail}`);
    console.log(`📧 Subject: ${options.subject}`);
    const result = await sesClient.send(command);
    console.log(`✅ Email sent successfully! MessageId: ${result.MessageId}`);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    
    // In development, log the email content instead of failing
    if (process.env.NODE_ENV !== 'production') {
      console.log('=== EMAIL CONTENT (Development Mode) ===');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML Body:\n${options.htmlBody}`);
      console.log('=== END EMAIL CONTENT ===');
      return; // Don't throw error in development
    }
    
    throw new Error(`Failed to send email: ${error}`);
  }
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string, 
  verificationToken: string, 
  firstName: string
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/verify-email?token=${verificationToken}`;
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verificación de Email - TG-OM</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: #2563eb;
                color: white !important;
                padding: 14px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #1d4ed8;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
            .security-note {
                background-color: #f3f4f6;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
                color: #6b7280;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TG-OM</div>
                <h1 class="title">¡Bienvenido a TG-OM!</h1>
            </div>
            
            <div class="content">
                <p>Hola <strong>${firstName}</strong>,</p>
                
                <p>Gracias por registrarte en nuestra plataforma. Para completar tu registro y verificar tu dirección de email, por favor haz clic en el botón de abajo:</p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verificar mi Email</a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
                
                <div class="security-note">
                    <strong>Nota de seguridad:</strong> Este enlace expirará en 24 horas por motivos de seguridad. Si no verificas tu email dentro de este tiempo, será necesario solicitar un nuevo enlace de verificación.
                </div>
                
                <p>Si no creaste una cuenta en TG-OM, puedes ignorar este email de forma segura.</p>
            </div>
            
            <div class="footer">
                <p>Este email fue enviado por TG-OM</p>
                <p>Si tienes problemas con el botón, copia y pega el enlace directamente en tu navegador.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textTemplate = `
Bienvenido a TG-OM!

Hola ${firstName},

Gracias por registrarte en nuestra plataforma. Para completar tu registro y verificar tu dirección de email, por favor visita el siguiente enlace:

${verificationUrl}

Este enlace expirará en 24 horas por motivos de seguridad.

Si no creaste una cuenta en TG-OM, puedes ignorar este email de forma segura.

---
TG-OM Team
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Verifica tu email - TG-OM',
    htmlBody: htmlTemplate,
    textBody: textTemplate,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string, 
  resetToken: string, 
  firstName: string
): Promise<void> {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;
  
  const htmlTemplate = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - TG-OM</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #dc2626;
                margin-bottom: 10px;
            }
            .title {
                color: #1f2937;
                font-size: 24px;
                margin-bottom: 20px;
            }
            .content {
                color: #4b5563;
                font-size: 16px;
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                background-color: #dc2626;
                color: white !important;
                padding: 14px 30px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #b91c1c;
            }
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                font-size: 14px;
                color: #6b7280;
                text-align: center;
            }
            .security-note {
                background-color: #fef2f2;
                border: 1px solid #fecaca;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                font-size: 14px;
                color: #dc2626;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TG-OM</div>
                <h1 class="title">Restablecer Contraseña</h1>
            </div>
            
            <div class="content">
                <p>Hola <strong>${firstName}</strong>,</p>
                
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú quien hizo esta solicitud, haz clic en el botón de abajo:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>
                
                <p>O copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #dc2626;">${resetUrl}</p>
                
                <div class="security-note">
                    <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por motivos de seguridad. Si no fuiste tú quien solicitó este cambio, ignora este email y tu contraseña permanecerá sin cambios.
                </div>
            </div>
            
            <div class="footer">
                <p>Este email fue enviado por TG-OM</p>
                <p>Si tienes problemas con el botón, copia y pega el enlace directamente en tu navegador.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  const textTemplate = `
Restablecer Contraseña - TG-OM

Hola ${firstName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú quien hizo esta solicitud, visita el siguiente enlace:

${resetUrl}

Este enlace expirará en 1 hora por motivos de seguridad.

Si no fuiste tú quien solicitó este cambio, ignora este email y tu contraseña permanecerá sin cambios.

---
TG-OM Team
  `;

  await sendEmail({
    to: email,
    subject: '🔒 Restablecer tu contraseña - TG-OM',
    htmlBody: htmlTemplate,
    textBody: textTemplate,
  });
}