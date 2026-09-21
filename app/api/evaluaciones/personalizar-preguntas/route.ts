import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint: PUT /api/evaluaciones/personalizar-preguntas
 * Permite personalizar/editar las preguntas de una vacante
 */
export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { vacante_id, pre_entrevista, prueba_tecnica, preguntas_video } = await request.json();

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'Falta vacante_id' },
        { status: 400 }
      );
    }

    console.log('[PERSONALIZAR-PREGUNTAS] Personalizando preguntas para vacante:', vacante_id);

    // Actualizar preguntas en Supabase
    const { data: updated, error: updateError } = await supabase
      .from('vacante_preguntas')
      .update({
        pre_entrevista: pre_entrevista || undefined,
        prueba_tecnica: prueba_tecnica || undefined,
        preguntas_video: preguntas_video || undefined,
        updated_at: new Date().toISOString(),
      })
      .eq('vacante_id', vacante_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating questions:', updateError);
      throw updateError;
    }

    console.log('[PERSONALIZAR-PREGUNTAS] Preguntas personalizadas:', vacante_id);

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
      {
        error: 'Error personalizando preguntas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint: GET /api/evaluaciones/personalizar-preguntas?vacante_id=xxx
 * Obtiene las preguntas actuales de una vacante
 * SECURITY: Requiere autenticación Bearer token
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - Bearer token required' },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const vacante_id = searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'Falta vacante_id' },
        { status: 400 }
      );
    }

    // Verify ownership: User must own the vacancy
    const { data: vacante } = await supabase
      .from('vacantes')
      .select('usuario_id')
      .eq('id', vacante_id)
      .single();

    if (!vacante || vacante.usuario_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'Forbidden - You do not own this vacancy' },
        { status: 403 }
      );
    }

    const { data: preguntas, error } = await supabase
      .from('vacante_preguntas')
      .select('*')
      .eq('vacante_id', vacante_id)
      .single();

    if (error) {
      console.error('Error fetching questions:', error);
      return NextResponse.json(
        { error: 'Preguntas no encontradas' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: preguntas,
    });
  } catch (error) {
    console.error('[PERSONALIZAR-PREGUNTAS] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo preguntas' },
      { status: 500 }
    );
  }
}
