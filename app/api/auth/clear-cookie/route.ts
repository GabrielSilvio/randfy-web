import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    cookies().delete('auth_token');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao limpar cookie:', error);
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    );
  }
}
