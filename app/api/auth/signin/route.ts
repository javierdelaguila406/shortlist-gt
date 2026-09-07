import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { loginSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 10 intentos de login por IP cada 15 minutos
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = rateLimit(`auth-signin:${ipAddress}`, 10, 900000); // 15 min

    if (!rateLimitResult.success) {
      console.warn('[SECURITY] Login rate limit exceeded:', { ipAddress, timestamp: new Date().toISOString() });
      return NextResponse.json(
        { error: 'Demasiados intentos de inicio de sesión. Intenta más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          }
        }
      );
    }

    const body = await request.json();

    // Validar con Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: validation.error.issues.map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Log interno - NUNCA expongas detalles al cliente
      console.warn('[SECURITY] Login failed:', {
        error: error.message,
        email,
        ipAddress,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Email o contraseña incorrectos.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SECURITY] Critical signin error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Ocurrió un error. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
