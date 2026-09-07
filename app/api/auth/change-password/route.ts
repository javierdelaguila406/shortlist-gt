import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { passwordSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = request.cookies.get('sb-auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';

    // Rate limit: 5 password changes per hour per user
    const rateLimitResult = rateLimit(`password-change:${ipAddress}`, 5, 3600000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 3600),
          }
        }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate new password
    const validation = passwordSchema.safeParse(newPassword);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: validation.error.issues.map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    if (!currentPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual requerida' },
        { status: 400 }
      );
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.warn('[SECURITY] Password change failed:', {
        error: error.message,
        ipAddress,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: 'Error al cambiar contraseña. Intenta más tarde.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Contraseña cambiada exitosamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SECURITY] Critical password change error:', {
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
