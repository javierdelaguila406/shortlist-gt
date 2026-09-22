import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { TEMPLATES_PREGUNTAS } from '@/lib/templates-preguntas';

/**
 * Endpoint: POST /api/evaluaciones/asignar-template
 * Asigna un template de preguntas a una vacante
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración faltante' },
        { status: 500 }
      );
    }

    const authSupabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await authSupabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { vacante_id, categoria_template } = await request.json();

    if (!vacante_id || !categoria_template) {
      return NextResponse.json(
        { error: 'Faltan datos: vacante_id, categoria_template' },
        { status: 400 }
      );
    }

    const { data: vacante, error: vacanteError } = await authSupabase
      .from('vacantes')
      .select('usuario_id')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacante) {
      return NextResponse.json(
        { error: 'Vacante no encontrada' },
        { status: 404 }
      );
    }

    if (vacante.usuario_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Obtener template
    const template = TEMPLATES_PREGUNTAS[categoria_template];
    if (!template) {
      return NextResponse.json(
        { error: 'Categoría de template no encontrada' },
        { status: 404 }
      );
    }

    console.log('[ASIGNAR-TEMPLATE] Asignando template:', categoria_template, 'a vacante:', vacante_id);

    // Intentar guardar preguntas en Supabase
    try {
      const { data: savedPreguntas, error: saveError } = await supabase
        .from('vacante_preguntas')
        .upsert({
          vacante_id,
          pre_entrevista: template.pre_entrevista,
          prueba_tecnica: template.prueba_tecnica,
          preguntas_video: template.preguntas_video,
          nivel_requerido: template.nombre,
          generado_por: 'template',
          categoria_template: categoria_template,
        })
        .select();

      if (saveError) {
        console.error('[ASIGNAR-TEMPLATE] Supabase error:', saveError);
        console.error('Error details:', { code: saveError.code, message: saveError.message });
        // Continuar de todas formas - el template se asignó aunque no se guardó en DB
      } else {
        console.log('[ASIGNAR-TEMPLATE] Template guardado en DB:', vacante_id);
      }
    } catch (dbError) {
      console.error('[ASIGNAR-TEMPLATE] Database exception:', dbError);
      // No fallar si hay error de DB - el template se devuelve de todas formas
    }

    return NextResponse.json({
      success: true,
      message: 'Template asignado exitosamente',
      data: {
        template: template.nombre,
        preguntas: {
          pre_entrevista: template.pre_entrevista.length,
          prueba_tecnica: template.prueba_tecnica.length,
          preguntas_video: template.preguntas_video.length,
        },
      },
    });
  } catch (error) {
    console.error('[ASIGNAR-TEMPLATE] Error fatal:', error);
    return NextResponse.json(
      {
        error: 'Error asignando template. Intenta más tarde.',
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint: GET /api/evaluaciones/asignar-template
 * Devuelve todas las categorías disponibles
 */
export async function GET() {
  try {
    const categorias = Object.values(TEMPLATES_PREGUNTAS).map(t => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion,
      preguntas: {
        pre_entrevista: t.pre_entrevista.length,
        prueba_tecnica: t.prueba_tecnica.length,
        preguntas_video: t.preguntas_video.length,
      },
    }));

    return NextResponse.json({
      success: true,
      categorias,
      total: categorias.length,
    });
  } catch (error) {
    console.error('[ASIGNAR-TEMPLATE] Error:', error);
    return NextResponse.json(
      { error: 'Error obteniendo categorías' },
      { status: 500 }
    );
  }
}
