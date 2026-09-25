import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedCandidato, ownershipError } from '@/lib/authz';
import { persistentRateLimit } from '@/lib/rate-limit';
import { EVALUACION_VIGENCIA_DIAS, hasQuestions, newEvaluationToken } from '@/lib/evaluaciones';
import { PLAN_LIMIT_MESSAGES, isPlanLimitError } from '@/lib/plan-limits';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'No autorizado', success: false }, { status: 401 });
    const { user, supabase } = auth;

    const limit = await persistentRateLimit(`evaluacion-enviar:${user.id}`, 30, 3600000);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.', success: false },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter || 3600) } }
      );
    }

    const body = await request.json().catch(() => null);
    const candidatoId = body?.candidatoId;
    if (typeof candidatoId !== 'string' || !candidatoId) {
      return NextResponse.json({ error: 'candidatoId es requerido', success: false }, { status: 400 });
    }

    const owned = await getOwnedCandidato(supabase, user.id, candidatoId);
    if (!owned.ok) {
      const { body: errorBody, init } = ownershipError(owned);
      return NextResponse.json(errorBody, init);
    }
    const candidato = owned.data;

    const { data: preguntas } = await supabase
      .from('vacante_preguntas')
      .select('pre_entrevista, prueba_tecnica, preguntas_video')
      .eq('vacante_id', candidato.vacante_id)
      .maybeSingle();
    if (!preguntas || !hasQuestions(preguntas)) {
      return NextResponse.json(
        { error: 'Asigna preguntas a la vacante (Template o Preguntas IA) antes de enviar la evaluación.', success: false },
        { status: 409 }
      );
    }

    // Un enlace vigente por candidato: al generar uno nuevo, el anterior deja de funcionar.
    await supabase
      .from('evaluaciones_candidato')
      .update({ estado: 'anulada' })
      .eq('candidato_id', candidatoId)
      .eq('estado', 'pendiente');

    const { token, hash } = newEvaluationToken();
    const expiraEn = new Date(Date.now() + EVALUACION_VIGENCIA_DIAS * 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase.from('evaluaciones_candidato').insert({
      candidato_id: candidatoId,
      vacante_id: candidato.vacante_id,
      token_hash: hash,
      preguntas,
      expira_en: expiraEn,
      creado_por: user.id,
    });
    if (insertError) {
      if (isPlanLimitError(insertError)) {
        return NextResponse.json({ error: PLAN_LIMIT_MESSAGES.evaluaciones, success: false, plan: 'demo' }, { status: 403 });
      }
      console.error('[EVALUACION] Could not create evaluation', { code: insertError.code, candidatoId });
      return NextResponse.json({ error: 'No se pudo crear la evaluación. Intenta más tarde.', success: false }, { status: 500 });
    }

    await supabase.from('candidatos').update({ estado: 'evaluacion' }).eq('id', candidatoId);

    return NextResponse.json({
      success: true,
      link: `${request.nextUrl.origin}/evaluacion/${token}`,
      expira_en: expiraEn,
    });
  } catch (error) {
    console.error('[EVALUACION] Error:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Error procesando solicitud. Intenta más tarde.', success: false }, { status: 500 });
  }
}
