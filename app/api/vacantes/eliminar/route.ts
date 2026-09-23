import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { syncDeleteVacante } from '@/lib/dual-sync';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { vacante_id } = body;

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', success: false },
        { status: 400 }
      );
    }

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, vacante_id);
    if (!owned.ok) {
      return NextResponse.json(
        { error: owned.status === 403 ? 'Forbidden' : 'Vacante no encontrada', success: false },
        { status: owned.status }
      );
    }

    const { error: candidatosError } = await auth.supabase
      .from('candidatos')
      .delete()
      .eq('vacante_id', vacante_id);

    if (candidatosError) {
      console.error('[API] Error deleting candidates:', { code: candidatosError.code });
      return NextResponse.json(
        { error: 'Error al eliminar candidatos', success: false },
        { status: 500 }
      );
    }

    const { error: vacantesError } = await auth.supabase
      .from('vacantes')
      .delete()
      .eq('id', vacante_id);

    if (vacantesError) {
      console.error('[API] Error deleting vacancy:', { code: vacantesError.code });
      return NextResponse.json(
        { error: 'Error al eliminar vacante', success: false },
        { status: 500 }
      );
    }

    const mirrorDeleted = await syncDeleteVacante(vacante_id);
    if (!mirrorDeleted) console.error('[SYNC] Mirror deletion failed', { vacancyId: vacante_id });
    await logAuditEvent({
      action: 'DELETE', userId: auth.user.id, resourceId: vacante_id,
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
