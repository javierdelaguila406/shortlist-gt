import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { emailSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';

    // Rate limit: 3 reset requests per hour per IP
    const rateLimitResult = rateLimit(`password-reset:${ipAddress}`, 3, 3600000);

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
    const { email } = body;

    // Validate email
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(validation.data, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
    });

    if (error) {
      console.warn('[SECURITY] Password reset failed:', {
        error: error.message,
        email,
        ipAddress,
        timestamp: new Date().toISOString(),
      });
    }

    // Always return success (don't reveal if email exists)
    return NextResponse.json(
      {
        success: true,
        message: 'Si el email existe en nuestra base de datos, recibirás un enlace para resetear tu contraseña.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SECURITY] Critical password reset error:', {
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
