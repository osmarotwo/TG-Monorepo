import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Cargar variables de entorno
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google';

export async function POST(req: NextRequest) {
  try {
    // Log de variables de entorno (sin exponer secretos completos)
    console.log('[Google OAuth] Entorno:', {
      GOOGLE_CLIENT_ID: GOOGLE_CLIENT_ID?.slice(0, 8) + '...' || 'undefined',
      GOOGLE_CLIENT_SECRET: GOOGLE_CLIENT_SECRET ? '***' + GOOGLE_CLIENT_SECRET.slice(-4) : 'undefined',
      GOOGLE_REDIRECT_URI
    });
    const { code } = await req.json();
    console.log('[Google OAuth] Código recibido:', code);
    if (!code) {
      console.error('[Google OAuth] No se recibió el código de Google.');
      return NextResponse.json({ error: 'No se recibió el código de Google.' }, { status: 400 });
    }

    // Intercambiar el código por tokens en Google
    const params = new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const tokenData = await tokenRes.json();
    console.log('[Google OAuth] Respuesta de Google:', tokenData);

    if (!tokenRes.ok || !tokenData.id_token) {
      console.error('[Google OAuth] Error:', tokenData.error, tokenData.error_description);
      return NextResponse.json({ error: tokenData.error_description || 'No se pudo obtener el idToken de Google.' }, { status: 400 });
    }

    // Retornar el idToken al frontend
    return NextResponse.json({ idToken: tokenData.id_token });
  } catch (err: any) {
    console.error('[Google OAuth] Error en el servidor:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor.' }, { status: 500 });
  }
}
