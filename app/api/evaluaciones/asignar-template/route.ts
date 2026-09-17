import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TEMPLATES_PREGUNTAS } from '@/lib/templates-preguntas';

/**
 * Endpoint: POST /api/evaluaciones/asignar-template
 * Asigna un template de preguntas a una vacante
 */
export async function POST(request: NextRequest) {
  try {
    const { vacante_id, categoria_template } = await request.json();

    if (!vacante_id || !categoria_template) {
      return NextResponse.json(
        { error: 'Faltan datos: vacante_id, categoria_template' },
        { status: 400 }
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

    // Guardar preguntas en Supabase
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
      .select()
      .single();

    if (saveError) {
      console.error('Error saving template:', saveError);
      throw saveError;
    }

    console.log('[ASIGNAR-TEMPLATE] Template asignado:', vacante_id);

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
    console.error('[ASIGNAR-TEMPLATE] Error:', error);
    return NextResponse.json(
      {
        error: 'Error asignando template',
        details: error instanceof Error ? error.message : 'Unknown error',
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
