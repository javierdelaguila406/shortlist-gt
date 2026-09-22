import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { persistentRateLimit } from '@/lib/rate-limit';
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

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';

    // Rate limit: 5 password changes per hour per IP (persistent across instances)
    const rateLimitResult = await persistentRateLimit(`password-change:${ipAddress}`, 'change_password', 5, 3600000);

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
          details: validation.error.issues.map(e => e.message),
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

    const { error: verificationError } = await supabase.auth.signInWithPassword({
      email: userData.user.email,
      password: currentPassword,
    });

    if (verificationError) {
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 401 }
      );
    }

    // Update password only after re-authenticating with the current password.
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.warn('[SECURITY] Credential change failed', {
        message: error.message,
        code: error.code || 'unknown',
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
    console.error('[SECURITY] Critical credential change error', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Ocurrió un error. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
