import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncUpdatePlan } from '@/lib/dual-sync';

export async function POST(request: NextRequest) {
  try {
    const { codigo, userId } = await request.json();

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
    const { error: updateError } = await supabase
      .from('license_codes')
      .update({
        status: 'used',
        used_by_user_id: userId || null,
        used_at: new Date().toISOString(),
      })
      .eq('id', licenseCode.id);

    if (updateError) {
      console.error('[SECURITY] Error updating license code:', updateError);
      return NextResponse.json(
        { error: 'Error al procesar licencia', success: false },
        { status: 500 }
      );
    }

    // Actualizar el plan del usuario a premium (solo si userId existe)
    if (userId) {
      // Obtener email del usuario para validar si debe sincronizar con Godaddy
      const { data: user } = await supabase
        .from('companies')
        .select('email')
        .eq('user_id', userId)
        .single();

      const userEmail = user?.email || '';

      // Sincronizar con ambas bases de datos (solo Godaddy si es lesters@furniturecity.com.gt)
      await syncUpdatePlan(userId, userEmail, 'premium', codigo.trim().toUpperCase());
    }

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
