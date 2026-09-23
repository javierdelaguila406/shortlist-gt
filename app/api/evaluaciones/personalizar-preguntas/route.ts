import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

const preguntaTecnica = z.object({
  numero: z.number().int(),
  pregunta: z.string().min(1).max(500),
  opciones: z.array(z.string().min(1).max(200)).min(2).max(6),
  respuesta_correcta: z.number().int().min(0),
  criterio: z.string().max(300).optional(),
}).passthrough().refine(p => p.respuesta_correcta < p.opciones.length, { message: 'respuesta_correcta fuera de rango' });

const bodySchema = z.object({
  vacante_id: z.string().min(1),
  pre_entrevista: z.array(z.unknown()).max(20).optional(),
  prueba_tecnica: z.array(preguntaTecnica).max(20).optional(),
  preguntas_video: z.array(z.unknown()).max(10).optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }
    const { vacante_id, pre_entrevista, prueba_tecnica, preguntas_video } = parsed.data;

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, vacante_id);
    if (!owned.ok) {
      return NextResponse.json(
        { error: owned.status === 403 ? 'Forbidden - You do not own this vacancy' : 'Vacante no encontrada' },
        { status: owned.status }
      );
    }

    const { error: updateError } = await auth.supabase
      .from('vacante_preguntas')
      .update({
        pre_entrevista,
        prueba_tecnica,
        preguntas_video,
        updated_at: new Date().toISOString(),
      })
      .eq('vacante_id', vacante_id)
      .select()
      .single();

    if (updateError) {
      console.error('[PERSONALIZAR-PREGUNTAS] Update failed:', { code: updateError.code, vacante_id });
      return NextResponse.json(
        { error: 'Error personalizando preguntas. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preguntas personalizadas exitosamente',
      data: {
        vacante_id,
        pre_entrevista_count: pre_entrevista?.length || 0,
        prueba_tecnica_count: prueba_tecnica?.length || 0,
        preguntas_video_count: preguntas_video?.length || 0,
      },
    });
  } catch (error) {
    console.error('[PERSONALIZAR-PREGUNTAS] Error:', error);
    return NextResponse.json(
      { error: 'Error personalizando preguntas. Intenta más tarde.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized - Bearer token required' }, { status: 401 });
    }

    const vacante_id = request.nextUrl.searchParams.get('vacante_id');
    if (!vacante_id) {
      return NextResponse.json({ error: 'Falta vacante_id' }, { status: 400 });
    }

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, vacante_id);
    if (!owned.ok) {
      return NextResponse.json(
        { error: owned.status === 403 ? 'Forbidden - You do not own this vacancy' : 'Vacante no encontrada' },
        { status: owned.status }
      );
    }

    const { data: preguntas, error } = await auth.supabase
      .from('vacante_preguntas')
      .select('*')
      .eq('vacante_id', vacante_id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Preguntas no encontradas' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: preguntas });
  } catch (error) {
    console.error('[PERSONALIZAR-PREGUNTAS] Error:', error);
    return NextResponse.json({ error: 'Error obteniendo preguntas' }, { status: 500 });
  }
}
