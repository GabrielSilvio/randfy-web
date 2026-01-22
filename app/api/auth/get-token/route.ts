import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = cookies().get('auth_token');

    if (!token) {
      return NextResponse.json(
        { token: null },
        { status: 200 }
      );
    }

    return NextResponse.json({ token: token.value });
  } catch (error) {
    console.error('Erro ao obter token:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
