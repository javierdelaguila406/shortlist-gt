import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncUpdatePlan } from '@/lib/dual-sync';
import { persistentRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);
    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código requerido', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const rateLimitResult = await persistentRateLimit(`license-code:${userId}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.', success: false },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) },
        }
      );
    }

    const normalizedCode = codigo.trim().toUpperCase();
    const { data: redemption, error: redemptionError } = await supabase
      .rpc('redeem_license_code', { p_code: normalizedCode })
      .single();

    if (redemptionError || !redemption) {
      console.error('[SECURITY] Atomic license redemption failed:', redemptionError);
      return NextResponse.json(
        { error: 'Código inválido, inactivo o ya utilizado', success: false },
        { status: 409 }
      );
    }

    const result = redemption as { email: string | null; plan: string };
    const userEmail = result.email || '';

    // Sincronizar en background (sin bloquear respuesta)
    syncUpdatePlan(userId, userEmail, 'premium', normalizedCode).catch(err => {
      console.error('[SYNC] Background sync error updating plan:', err);
    });

    console.log('[API] License code used successfully:', {
      codigo: normalizedCode,
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '¡Acceso Premium activado!',
      plan: result.plan,
    });

  } catch (error) {
    console.error('[SECURITY] Critical license error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
