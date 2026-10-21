import { NextRequest, NextResponse } from 'next/server';
import { persistentRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
    }

    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json(
        { error: 'Código requerido', success: false },
        { status: 400 }
      );
    }

    const supabase = auth.supabase;
    const userId = auth.user.id;
    await createAdminClient()
      .from('companies')
      .upsert({ user_id: userId, email: auth.user.email ?? null, plan: 'demo' }, { onConflict: 'user_id', ignoreDuplicates: true });
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

    console.log('[API] License code used successfully:', {
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
