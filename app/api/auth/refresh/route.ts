import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config/constants';

/**
 * Token Refresh Endpoint
 * Renova o token antes de expirar
 */
export async function POST() {
  try {
    // Obter token atual do cookie
    const currentToken = cookies().get(CONFIG.AUTH.TOKEN_COOKIE_NAME);

    if (!currentToken) {
      return NextResponse.json(
        { error: 'No token found' },
        { status: 401 }
      );
    }

    // Chamar backend para refresh
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentToken.value}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Refresh failed - token inválido ou expirado
      return NextResponse.json(
        { error: 'Token refresh failed' },
        { status: 401 }
      );
    }

    const { token: newToken } = await response.json();

    // Atualizar cookie com novo token
    cookies().set({
      name: CONFIG.AUTH.TOKEN_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: CONFIG.AUTH.SESSION_DURATION,
      path: '/',
    });

    return NextResponse.json({ 
      token: newToken,
      success: true 
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
