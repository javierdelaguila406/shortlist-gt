import { NextRequest, NextResponse } from 'next/server';
import { isWhatsAppEnabled, sendEvaluationStart } from '@/lib/whatsapp';
import { persistentRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedCandidato, ownershipError } from '@/lib/authz';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      );
    }
    const { user, supabase } = auth;

    const rateLimitResult = await persistentRateLimit(`whatsapp-start:${user.id}`, 10, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) } }
      );
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('plan')
      .eq('user_id', user.id)
      .maybeSingle();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'No se pudo verificar el plan de la empresa.', success: false },
        { status: 403 }
      );
    }
    if (company.plan !== 'premium') {
      return NextResponse.json(
        {
          error: 'Las evaluaciones por WhatsApp solo están disponibles en el plan Premium.',
          success: false,
          plan: company.plan,
        },
        { status: 403 }
      );
    }

    const { candidatoId } = await request.json().catch(() => ({}));
    if (!candidatoId || typeof candidatoId !== 'string') {
      return NextResponse.json(
        { error: 'candidatoId es requerido' },
        { status: 400 }
      );
    }

    const owned = await getOwnedCandidato(supabase, user.id, candidatoId);
    if (!owned.ok) {
      const { body, init } = ownershipError(owned);
      return NextResponse.json(body, init);
    }
    const candidato = owned.data;

    if (!candidato.telefono) {
      return NextResponse.json(
        { error: 'El candidato no tiene teléfono registrado' },
        { status: 400 }
      );
    }

    const evaluacionBase = {
      candidato_id: candidatoId,
      vacante_id: candidato.vacante_id,
      paso: 1,
    };

    if (!isWhatsAppEnabled()) {
      console.warn('[EVALUACION] WhatsApp desactivado en este entorno; se registra la evaluación sin enviar mensajes');

      const { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({ ...evaluacionBase, estado: 'en_proceso', mensaje_confirmacion_enviado: false })
        .select()
        .single();

      if (evalError) throw evalError;

      return NextResponse.json(
        {
          success: true,
          message: '[DEMO] Evaluación registrada (WhatsApp no configurado)',
          evaluacionId: evaluacion?.id,
        },
        { status: 201 }
      );
    }

    try {
      await sendEvaluationStart(candidatoId, candidato.telefono, candidato.nombre);

      const { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({ ...evaluacionBase, estado: 'en_proceso', mensaje_confirmacion_enviado: true })
        .select()
        .single();

      if (evalError) throw evalError;

      await supabase
        .from('candidatos')
        .update({
          estado: 'en_evaluacion_whatsapp',
          estado_evaluacion: 'en_proceso',
        })
        .eq('id', candidatoId);

      console.log('[EVALUACION] Mensaje inicial enviado', { candidatoId });

      return NextResponse.json(
        {
          success: true,
          message: 'Mensaje enviado. Esperando respuesta del candidato.',
          evaluacionId: evaluacion?.id,
        },
        { status: 201 }
      );
    } catch (whatsappError) {
      console.error('[EVALUACION] Error enviando WhatsApp', {
        candidatoId,
        message: whatsappError instanceof Error ? whatsappError.message : 'unknown',
      });

      const { data: evaluacion } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({ ...evaluacionBase, estado: 'error_envio' })
        .select()
        .single();

      return NextResponse.json(
        {
          success: false,
          message: 'Error enviando mensaje. Verifica la configuración de WhatsApp.',
          evaluacionId: evaluacion?.id,
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error en evaluación/iniciar-whatsapp:', error);
    return NextResponse.json(
      { error: 'Error procesando solicitud. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
