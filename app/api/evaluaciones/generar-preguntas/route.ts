import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Endpoint: POST /api/evaluaciones/generar-preguntas
 * Genera preguntas de evaluación usando Claude API basadas en la descripción de la vacante
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

async function generarPreguntasConClaude(
  titulo: string,
  descripcion: string,
  nivel: string
): Promise<{
  pre_entrevista: any[];
  prueba_tecnica: any[];
  preguntas_video: any[];
}> {
  const prompt = `Eres un experto en Recursos Humanos y reclutamiento. Genera preguntas de evaluación precisas y profesionales para la siguiente vacante:

TÍTULO: ${titulo}
DESCRIPCIÓN: ${descripcion}
NIVEL REQUERIDO: ${nivel}

Genera EXACTAMENTE en formato JSON (sin markdown, solo JSON válido):
{
  "pre_entrevista": [
    {
      "numero": 1,
      "pregunta": "[pregunta abierta que valide experiencia básica]",
      "tipo": "abierta",
      "criterio": "[qué evalúa esta pregunta]"
    },
    {
      "numero": 2,
      "pregunta": "[pregunta sobre competencias clave]",
      "tipo": "abierta",
      "criterio": "[qué evalúa esta pregunta]"
    },
    {
      "numero": 3,
      "pregunta": "[pregunta sobre metodología/enfoque]",
      "tipo": "abierta",
      "criterio": "[qué evalúa esta pregunta]"
    }
  ],
  "prueba_tecnica": [
    {
      "numero": 1,
      "pregunta": "[pregunta técnica #1]",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "respuesta_correcta": 0,
      "criterio": "[qué evalúa]"
    },
    {
      "numero": 2,
      "pregunta": "[pregunta técnica #2]",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "respuesta_correcta": 1,
      "criterio": "[qué evalúa]"
    },
    {
      "numero": 3,
      "pregunta": "[pregunta técnica #3]",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "respuesta_correcta": 2,
      "criterio": "[qué evalúa]"
    },
    {
      "numero": 4,
      "pregunta": "[pregunta técnica #4]",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "respuesta_correcta": 3,
      "criterio": "[qué evalúa]"
    },
    {
      "numero": 5,
      "pregunta": "[pregunta técnica #5]",
      "opciones": ["opción a", "opción b", "opción c", "opción d"],
      "respuesta_correcta": 0,
      "criterio": "[qué evalúa]"
    }
  ],
  "preguntas_video": [
    {
      "numero": 1,
      "pregunta": "[pregunta situacional que requiera respuesta en video - máx 1 min]",
      "tipo": "video",
      "criterio": "[evalúa liderazgo/comunicación/resolución de conflictos]",
      "tiempo_maximo": "1 minuto"
    },
    {
      "numero": 2,
      "pregunta": "[pregunta sobre desafío laboral específico]",
      "tipo": "video",
      "criterio": "[evalúa pensamiento crítico/experiencia]",
      "tiempo_maximo": "1 minuto"
    }
  ]
}

IMPORTANTE:
- Las preguntas deben ser ESPECÍFICAS para este puesto, no genéricas
- Pre-entrevista: preguntas abiertas que validen experiencia
- Prueba técnica: 5 preguntas de opción múltiple con 4 opciones cada una
- Preguntas video: 2 preguntas situacionales que evalúen soft skills
- Todas en ESPAÑOL
- Responde SOLO con el JSON, sin explicaciones adicionales`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Claude API error:', data);
      throw new Error(data.error?.message || 'Error calling Claude API');
    }

    const content = data.content[0]?.text;
    if (!content) {
      throw new Error('No response from Claude API');
    }

    // Limpiar respuesta (en caso de que incluya markdown)
    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const preguntas = JSON.parse(jsonString);
    return preguntas;
  } catch (error) {
    console.error('Error generating questions:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { vacante_id, titulo, descripcion, nivel } = await request.json();

    if (!vacante_id || !titulo || !descripcion) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: vacante_id, titulo, descripcion' },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY no configurado' },
        { status: 500 }
      );
    }

    console.log('[GENERAR-PREGUNTAS] Generando preguntas para vacante:', vacante_id);

    // Generar preguntas con Claude
    const preguntas = await generarPreguntasConClaude(titulo, descripcion, nivel || 'No especificado');

    // Guardar en Supabase
    const { data: savedPreguntas, error: saveError } = await supabase
      .from('vacante_preguntas')
      .upsert({
        vacante_id,
        pre_entrevista: preguntas.pre_entrevista,
        prueba_tecnica: preguntas.prueba_tecnica,
        preguntas_video: preguntas.preguntas_video,
        nivel_requerido: nivel || 'No especificado',
        generado_por: 'claude',
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving questions:', saveError);
      throw saveError;
    }

    console.log('[GENERAR-PREGUNTAS] Preguntas guardadas:', vacante_id);

    return NextResponse.json({
      success: true,
      message: 'Preguntas generadas y guardadas exitosamente',
      data: preguntas,
    });
  } catch (error) {
    console.error('[GENERAR-PREGUNTAS] Error:', error);
    return NextResponse.json(
      {
        error: 'Error generando preguntas',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
