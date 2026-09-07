import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('sb-auth-token')?.value;

    // Cerrar sesión en Supabase (opcional - el token vencerá de todas formas)
    if (token) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        // Ignore Supabase signout errors - we'll clear the cookie anyway
        console.warn('Supabase signout warning:', error);
      }
    }

    // Crear respuesta
    const response = NextResponse.json(
      { success: true, message: 'Sesión cerrada' },
      { status: 200 }
    );

    // Limpiar cookie
    response.cookies.set({
      name: 'sb-auth-token',
      value: '',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[SECURITY] Logout error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Error al cerrar sesión' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for logout (some clients may use GET)
  return POST(request);
}
