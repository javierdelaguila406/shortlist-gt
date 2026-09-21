import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logAuditEvent } from '@/lib/audit';
import { syncDeleteVacante } from '@/lib/dual-sync';

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);
    const body = await request.json();
    const { vacante_id } = body;

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', success: false },
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

    // Use anon key with RLS enforcement
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const { data: vacante, error: vacanteError } = await supabase
      .from('vacantes')
      .select('usuario_id')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacante) {
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    if (vacante.usuario_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', success: false },
        { status: 403 }
      );
    }

    // Delete all candidates for this vacancy first
    const { error: candidatosError } = await supabase
      .from('candidatos')
      .delete()
      .eq('vacante_id', vacante_id);

    if (candidatosError) {
      console.error('[API] Error deleting candidates:', candidatosError);
      return NextResponse.json(
        { error: 'Error al eliminar candidatos', success: false },
        { status: 500 }
      );
    }

    // Delete the vacancy
    const { error: vacantesError } = await supabase
      .from('vacantes')
      .delete()
      .eq('id', vacante_id);

    if (vacantesError) {
      console.error('[API] Error deleting vacancy:', vacantesError);
      return NextResponse.json(
        { error: 'Error al eliminar vacante', success: false },
        { status: 500 }
      );
    }

    const mirrorDeleted = await syncDeleteVacante(vacante_id);
    if (!mirrorDeleted) console.error('[SYNC] Mirror deletion failed', { vacancyId: vacante_id });
    await logAuditEvent({
      action: 'DELETE', userId: userData.user.id, resourceId: vacante_id,
      resourceType: 'vacante', changes: { reason: 'user_deletion' },
    });

    console.log('[API] Vacante eliminada:', vacante_id);
    return NextResponse.json({
      success: true,
      message: 'Vacante eliminada correctamente',
      vacante_id,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
