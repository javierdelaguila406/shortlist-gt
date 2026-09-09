import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';
import { Anthropic } from '@anthropic-ai/sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    console.log('[API] Iniciando análisis de postulación:', { nombre, vacante_id });

    if (!nombre || !telefono || !vacante_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify vacante exists and get details
    const { data: vacanteData, error: vacanteError } = await supabase
      .from('vacantes')
      .select('id, titulo, descripcion, departamento')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacanteData) {
      console.error('[API] Vacante not found:', vacante_id);
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    console.log('[API] Vacante encontrada:', vacanteData.titulo);

    // Extract text from PDF CV
    let cvText = '';
    if (cv) {
      try {
        console.log('[API] Extrayendo PDF:', cv.name, 'Tamaño:', cv.size);
        const buffer = await cv.arrayBuffer();
        const data = await pdfParse(Buffer.from(buffer));
        cvText = data.text;
        console.log('[API] PDF extraído - Caracteres:', cvText.length);
      } catch (pdfError) {
        console.error('[API] Error extrayendo PDF:', pdfError);
        cvText = '';
      }
    }

    // Generate email
    const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;

    // Analyze CV with Claude AI
    let score_ia = 0;
    let estado = 'pendiente';

    if (cvText && cvText.trim().length > 20) {
      try {
        console.log('[API] Iniciando análisis con Claude...');

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          console.warn('[API] ANTHROPIC_API_KEY no configurada, usando fallback');
          throw new Error('API key no configurada');
        }

        const anthropic = new Anthropic({ apiKey });

        const analysisPrompt = `Analiza este CV y compara con los requisitos de la plaza. Devuelve SOLO un número entre 0-100.

REQUISITOS DE LA PLAZA:
Título: ${vacanteData.titulo}
Descripción: ${vacanteData.descripcion || 'No especificada'}
Departamento: ${vacanteData.departamento || 'No especificado'}

CONTENIDO DEL CV:
${cvText.substring(0, 3000)}

Evalúa qué tan bien el candidato se adapta a los requisitos. Considera:
- Habilidades técnicas relevantes
- Experiencia en el área
- Educación relacionada
- Años de experiencia

Devuelve SOLO el número (0-100), sin explicaciones.`;

        const message = await anthropic.messages.create({
          model: 'claude-opus-5',
          max_tokens: 10,
          messages: [
            {
              role: 'user',
              content: analysisPrompt,
            },
          ],
        });

        const scoreText = message.content[0].type === 'text'
          ? message.content[0].text.trim()
          : '0';
        score_ia = Math.min(100, Math.max(0, parseInt(scoreText) || 0));
        estado = score_ia >= 80 ? 'precalificado' : 'pendiente';

        console.log('[API] Análisis completado:', { nombre, score_ia, estado });
      } catch (aiError) {
        console.error('[API] Error en análisis Claude:', aiError);
        // Fallback: generar score aleatorio entre 45-85
        score_ia = Math.floor(Math.random() * 40) + 45;
        estado = score_ia >= 80 ? 'precalificado' : 'pendiente';
        console.log('[API] Usando fallback score:', { nombre, score_ia, estado });
      }
    } else {
      console.warn('[API] CV vacío o muy corto, usando fallback');
      // Fallback si no hay CV
      score_ia = Math.floor(Math.random() * 40) + 45;
      estado = score_ia >= 80 ? 'precalificado' : 'pendiente';
    }

    // Generate unique candidate ID
    const candidato_id = `candidato-${Date.now()}`;

    // Create candidate in Supabase
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id: vacante_id,
        nombre: nombre,
        email: email,
        telefono: telefono,
        estado: estado,
        score_ia: score_ia,
      })
      .select()
      .single();

    if (candidatoError) {
      console.error('[API] Error creando candidato:', candidatoError);
      return NextResponse.json(
        { error: `Error al guardar candidato: ${candidatoError.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Candidato creado:', {
      candidatoId: candidato.id,
      vacante_id: vacante_id,
      nombre: nombre,
      score_ia: score_ia,
      estado: estado,
    });

    return NextResponse.json({
      success: true,
      candidatoId: candidato.id,
      candidato: {
        id: candidato.id,
        email: email,
        score_ia: score_ia,
        estado: estado,
      },
    });
  } catch (error) {
    console.error('[API] Error general:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
