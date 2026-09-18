import { NextRequest, NextResponse } from 'next/server';
import { sendEvaluationStart } from '@/lib/whatsapp';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint: POST /api/evaluaciones/iniciar-whatsapp
 * Inicia una evaluación WhatsApp para un candidato específico
 * Llamado por: Reclutador desde el dashboard
 * SEGURIDAD: Requiere token Bearer válido
 */

// Verificar token de autenticación
async function verifyAuth(request: NextRequest): Promise<{valid: boolean; userId?: string}> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return { valid: false };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseClient = require('@supabase/supabase-js').createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabaseClient.auth.getUser(token);
    if (error || !data.user) return { valid: false };
    return { valid: true, userId: data.user.id };
  } catch {
    return { valid: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const auth = await verifyAuth(request);
    if (!auth.valid) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      );
    }

    // VALIDACIÓN DE PLAN: WhatsApp solo en PREMIUM
    if (auth.userId) {
      try {
        const { createClient } = require('@supabase/supabase-js');
        const supabaseService = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );

        const { data: company } = await supabaseService
          .from('companies')
          .select('plan')
          .eq('user_id', auth.userId)
          .single();

        if (company?.plan === 'demo') {
          return NextResponse.json(
            {
              error: 'Las evaluaciones por WhatsApp solo están disponibles en el plan Premium.',
              success: false,
              plan: 'demo',
            },
            { status: 403 }
          );
        }
      } catch (planCheckError) {
        console.log('[API] Error checking plan for WhatsApp:', planCheckError);
        // Continuar sin validación si hay error
      }
    }

    const { candidatoId } = await request.json();

    if (!candidatoId) {
      return NextResponse.json(
        { error: 'candidatoId es requerido' },
        { status: 400 }
      );
    }

    console.log(`[EVALUACION] Iniciando WhatsApp para candidato: ${candidatoId}`);

    // Obtener datos del candidato
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .select('id, nombre, email, telefono, vacante_id, score_cv')
      .eq('id', candidatoId)
      .single();

    if (candidatoError || !candidato) {
      console.error('Candidato no encontrado:', candidatoError);
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      );
    }

    // Validar que tenga teléfono
    if (!candidato.telefono) {
      return NextResponse.json(
        { error: 'El candidato no tiene teléfono registrado' },
        { status: 400 }
      );
    }

    // Verificar que WhatsApp esté configurado
    if (!process.env.WHATSAPP_ACCESS_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
      console.warn('WhatsApp no está configurado, usando modo demo');

      // En modo demo, solo crear la evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({
          candidato_id: candidatoId,
          vacante_id: candidato.vacante_id,
          paso: 1,
          estado: 'en_proceso',
          mensaje_confirmacion_enviado: true,
        })
        .select()
        .single();

      if (evalError) {
        throw evalError;
      }

      return NextResponse.json(
        {
          success: true,
          message: '[DEMO] Evaluación iniciada (WhatsApp no configurado)',
          evaluacionId: evaluacion?.id,
          candidato: {
            nombre: candidato.nombre,
            email: candidato.email,
            telefono: candidato.telefono,
          },
        },
        { status: 201 }
      );
    }

    // MODO PRODUCCIÓN: Enviar WhatsApp real
    try {
      await sendEvaluationStart(candidatoId, candidato.telefono, candidato.nombre);

      // Crear registro de evaluación
      const { data: evaluacion, error: evalError } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({
          candidato_id: candidatoId,
          vacante_id: candidato.vacante_id,
          paso: 1,
          estado: 'en_proceso',
          mensaje_confirmacion_enviado: true,
        })
        .select()
        .single();

      if (evalError) {
        throw evalError;
      }

      // Actualizar estado del candidato
      await supabase
        .from('candidatos')
        .update({
          estado: 'en_evaluacion_whatsapp',
          estado_evaluacion: 'en_proceso',
        })
        .eq('id', candidatoId);

      console.log(`✅ Mensaje WhatsApp enviado a ${candidato.telefono}`);

      return NextResponse.json(
        {
          success: true,
          message: `✅ Mensaje enviado a ${candidato.telefono}. Esperando respuesta...`,
          evaluacionId: evaluacion?.id,
          candidato: {
            nombre: candidato.nombre,
            email: candidato.email,
            telefono: candidato.telefono,
          },
        },
        { status: 201 }
      );
    } catch (whatsappError) {
      console.error('Error enviando WhatsApp:', whatsappError);

      // Aún así crear la evaluación para que el reclutador pueda ver que lo intentó
      const { data: evaluacion } = await supabase
        .from('evaluaciones_whatsapp')
        .insert({
          candidato_id: candidatoId,
          vacante_id: candidato.vacante_id,
          paso: 1,
          estado: 'error_envio',
        })
        .select()
        .single();

      return NextResponse.json(
        {
          success: false,
          message: '⚠️ Error enviando mensaje. Verifica configuración de WhatsApp',
          error: whatsappError instanceof Error ? whatsappError.message : 'Error desconocido',
          evaluacionId: evaluacion?.id,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en evaluación/iniciar-whatsapp:', error);
    return NextResponse.json(
      {
        error: 'Error procesando solicitud',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
