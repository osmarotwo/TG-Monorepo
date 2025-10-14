import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Cargar variables de entorno
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google';

export async function POST(req: NextRequest) {
  try {
    const { code } = await req.json();
    if (!code) {
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

    if (!tokenRes.ok || !tokenData.id_token) {
      return NextResponse.json({ error: tokenData.error_description || 'No se pudo obtener el idToken de Google.' }, { status: 400 });
    }

    // Retornar el idToken al frontend
    return NextResponse.json({ idToken: tokenData.id_token });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error en el servidor.' }, { status: 500 });
  }
}
