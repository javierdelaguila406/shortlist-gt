import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncUpdatePlan } from '@/lib/dual-sync';
import { rateLimit } from '@/lib/rate-limit';

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
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const userId = userData.user.id;
    const rateLimitResult = rateLimit(`license-code:${userId}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.', success: false },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) },
        }
      );
    }

    // Buscar el código de licencia
    const { data: licenseCode, error: fetchError } = await supabase
      .from('license_codes')
      .select('*')
      .eq('code', codigo.trim().toUpperCase())
      .single();

    if (fetchError || !licenseCode) {
      return NextResponse.json(
        { error: 'Código de licencia inválido', success: false },
        { status: 401 }
      );
    }

    // Validar que no esté usado
    if (licenseCode.status === 'used') {
      return NextResponse.json(
        { error: 'Este código ya ha sido utilizado', success: false },
        { status: 403 }
      );
    }

    if (licenseCode.status === 'inactive') {
      return NextResponse.json(
        { error: 'Código desactivado', success: false },
        { status: 403 }
      );
    }

    // Actualizar el código como usado
    const { data: updatedCode, error: updateError } = await supabase
      .from('license_codes')
      .update({
        status: 'used',
        used_by_user_id: userId || null,
        used_at: new Date().toISOString(),
      })
      .eq('id', licenseCode.id)
      .eq('status', licenseCode.status)
      .select('id')
      .single();

    if (updateError || !updatedCode) {
      console.error('[SECURITY] Error updating license code:', updateError);
      return NextResponse.json(
        { error: 'El código ya no está disponible', success: false },
        { status: 409 }
      );
    }

    // Obtener email del usuario para validar si debe sincronizar con Godaddy
    const { data: user } = await supabase
      .from('companies')
      .select('email')
      .eq('user_id', userId)
      .single();

    const userEmail = user?.email || '';

    // Sincronizar en background (sin bloquear respuesta)
    syncUpdatePlan(userId, userEmail, 'premium', codigo.trim().toUpperCase()).catch(err => {
      console.error('[SYNC] Background sync error updating plan:', err);
    });

    console.log('[API] License code used successfully:', {
      codigo: codigo.trim().toUpperCase(),
      userId,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: '¡Acceso Premium activado!',
      plan: 'premium',
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
