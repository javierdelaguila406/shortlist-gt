import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { persistentRateLimit } from '@/lib/rate-limit';
import {
  hashEvaluationToken,
  isWellFormedToken,
  publicQuestions,
  respuestasSchema,
  scoreAnswers,
  type PreguntasEvaluacion,
} from '@/lib/evaluaciones';

// Ruta pública del candidato: el token del enlace es la única credencial; en la base solo existe su hash.
type Params = { params: Promise<{ token: string }> };

function clientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

async function loadEvaluation(token: string) {
  if (!isWellFormedToken(token)) return null;
  const { data } = await createAdminClient()
    .from('evaluaciones_candidato')
    .select('id, candidato_id, vacante_id, estado, expira_en, abierta_en, preguntas')
    .eq('token_hash', hashEvaluationToken(token))
    .maybeSingle();
  return data;
}

function unavailable(evaluacion: { estado: string; expira_en: string }) {
  if (evaluacion.estado === 'completada') return 'completada';
  if (evaluacion.estado === 'anulada') return 'anulada';
  if (new Date(evaluacion.expira_en).getTime() <= Date.now()) return 'expirada';
  return null;
}

const notFound = () => NextResponse.json({ error: 'Enlace no válido', estado: 'invalida' }, { status: 404 });

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const limit = await persistentRateLimit(`evaluacion-abrir:${clientIp(request)}`, 60, 3600000);
    if (!limit.success) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const { token } = await params;
    const evaluacion = await loadEvaluation(token);
    if (!evaluacion) return notFound();
    const estado = unavailable(evaluacion);
    if (estado) return NextResponse.json({ error: 'Esta evaluación ya no está disponible', estado }, { status: 410 });

    const admin = createAdminClient();
    const { data: vacante } = await admin
      .from('vacantes')
      .select('titulo, usuario_id')
      .eq('id', evaluacion.vacante_id)
      .maybeSingle();
    const { data: empresa } = vacante
      ? await admin.from('companies').select('nombre').eq('user_id', vacante.usuario_id).maybeSingle()
      : { data: null };

    if (!evaluacion.abierta_en) {
      await admin.from('evaluaciones_candidato').update({ abierta_en: new Date().toISOString() }).eq('id', evaluacion.id);
    }

    return NextResponse.json({
      vacante: vacante?.titulo ?? '',
      empresa: empresa?.nombre ?? '',
      expira_en: evaluacion.expira_en,
      preguntas: publicQuestions(evaluacion.preguntas as PreguntasEvaluacion),
    });
  } catch (error) {
    console.error('[EVALUACION] Error opening evaluation:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const limit = await persistentRateLimit(`evaluacion-responder:${clientIp(request)}`, 20, 3600000);
    if (!limit.success) return NextResponse.json({ error: 'Demasiadas solicitudes' }, { status: 429 });

    const { token } = await params;
    const evaluacion = await loadEvaluation(token);
    if (!evaluacion) return notFound();
    const estado = unavailable(evaluacion);
    if (estado) return NextResponse.json({ error: 'Esta evaluación ya no está disponible', estado }, { status: 410 });

    const preguntas = evaluacion.preguntas as PreguntasEvaluacion;
    const parsed = respuestasSchema(preguntas).safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Respuestas incompletas o inválidas' }, { status: 400 });
    }
    const { score } = scoreAnswers(preguntas, parsed.data);

    // Solo la primera respuesta cuenta: la condición estado = pendiente hace el cambio atómico.
    const admin = createAdminClient();
    const { data: updated, error } = await admin
      .from('evaluaciones_candidato')
      .update({
        estado: 'completada',
        respuestas: parsed.data,
        score_test: score,
        completada_en: new Date().toISOString(),
      })
      .eq('id', evaluacion.id)
      .eq('estado', 'pendiente')
      .gt('expira_en', new Date().toISOString())
      .select('id');
    if (error) throw error;
    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Esta evaluación ya no está disponible', estado: 'completada' }, { status: 410 });
    }

    const { error: candidateError } = await admin
      .from('candidatos')
      .update({ estado: 'evaluado', score_test: score, updated_at: new Date().toISOString() })
      .eq('id', evaluacion.candidato_id);
    if (candidateError) console.error('[EVALUACION] Candidate score not updated', { evaluationId: evaluacion.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[EVALUACION] Error submitting evaluation:', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
