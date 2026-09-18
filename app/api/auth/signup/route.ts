import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { signupSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 3 registros por IP cada hora
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = rateLimit(`auth-signup:${ipAddress}`, 3, 3600000); // 1 hour

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro. Intenta más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 3600),
          }
        }
      );
    }

    const body = await request.json();

    // Validar con Zod
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validación fallida',
          details: validation.error.issues.map((e: any) => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password, nombre } = validation.data;

    // Crear usuario en Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { nombre },
      },
    });

    if (authError) {
      // Log interno
      console.error('[SECURITY] Signup error:', {
        error: authError.message,
        code: authError.status,
        email,
        timestamp: new Date().toISOString(),
        ipAddress,
      });

      // Respuesta genérica al cliente
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado. Intenta con otro.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Error al registrar. Intenta más tarde.' },
        { status: 500 }
      );
    }

    // Crear registro de empresa en plan DEMO
    if (authData.user) {
      try {
        const supabaseService = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        await supabaseService
          .from('companies')
          .insert({
            user_id: authData.user.id,
            email: email,
            nombre: nombre,
            plan: 'demo',
            created_at: new Date().toISOString(),
          });
      } catch (dbError) {
        console.error('[SECURITY] Error creating company record:', {
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          userId: authData.user.id,
          timestamp: new Date().toISOString(),
        });
        // No impedir el registro si hay error en companies, solo loguear
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: authData.user,
        message: 'Registro exitoso. Por favor confirma tu email.',
        plan: 'demo',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SECURITY] Critical signup error:', {
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
