import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante, ownershipError } from '@/lib/authz';

const ESTADOS = ['activa', 'pausada', 'cerrada'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });

    const body = await request.json().catch(() => null);
    const estado = body?.estado;
    if (typeof estado !== 'string' || !ESTADOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido', success: false }, { status: 400 });
    }

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, id);
    if (!owned.ok) {
      const { body: errorBody, init } = ownershipError(owned);
      return NextResponse.json(errorBody, init);
    }

    const { error } = await auth.supabase
      .from('vacantes')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('[API] Vacancy update failed:', { code: error.code, vacanteId: id });
      return NextResponse.json({ error: 'No se pudo actualizar la vacante', success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, vacante_id: id, estado });
  } catch (error) {
    console.error('[API] Error updating vacancy:', error);
    return NextResponse.json({ error: 'Error del servidor', success: false }, { status: 500 });
  }
}
