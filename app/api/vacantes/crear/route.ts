import { NextRequest, NextResponse } from 'next/server';
import { logAuditEvent } from '@/lib/audit';
import { requireUser } from '@/lib/supabase-server';
import { PLAN_LIMIT_MESSAGES, isPlanLimitError } from '@/lib/plan-limits';

const ESTADOS_PERMITIDOS = ['activa', 'pausada', 'cerrada'];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, departamento, estado } = body;

    if (!titulo || typeof titulo !== 'string' || !titulo.trim()) {
      return NextResponse.json(
        { error: 'Título requerido', success: false },
        { status: 400 }
      );
    }

    if (estado !== undefined && !ESTADOS_PERMITIDOS.includes(estado)) {
      return NextResponse.json(
        { error: 'Estado inválido', success: false },
        { status: 400 }
      );
    }

    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Se requiere autenticación', success: false },
        { status: 401 }
      );
    }
    const userId = auth.user.id;

    const newId = `vacante-${Date.now()}`;
    const vacante = {
      id: newId,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      departamento: departamento || '',
      usuario_id: userId,
      estado: estado || 'activa',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await auth.supabase
      .from('vacantes')
      .insert([vacante])
      .select();

    if (insertError) {
      if (isPlanLimitError(insertError)) {
        return NextResponse.json({ error: PLAN_LIMIT_MESSAGES.vacantes, success: false, plan: 'demo' }, { status: 403 });
      }
      console.error('[API] Database error (internal):', {
        message: insertError.message,
        code: insertError.code,
        timestamp: new Date().toISOString(),
      });
      return NextResponse.json(
        { error: 'Error al crear vacante. Intenta más tarde.', success: false },
        { status: 500 }
      );
    }

    await logAuditEvent({ action: 'CREATE', userId, resourceId: newId, resourceType: 'vacante', changes: { estado: vacante.estado } });

    console.log('[API] Vacante creada:', newId);
    return NextResponse.json({
      success: true,
      vacante_id: newId,
      link: `/postular/${newId}`,
    });
  } catch (error) {
    console.error('[API] Error en crear vacante:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
