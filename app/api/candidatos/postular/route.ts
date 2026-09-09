import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  ventas: ['ventas', 'cliente', 'comisión', 'prospección', 'crm', 'negociación', 'cierre', 'pipeline', 'lead', 'venta', 'vendedor', 'comercial', 'telemarketing'],
  mecanica: ['motor', 'transmisión', 'diagnóstico', 'suspensión', 'frenos', 'inyección', 'herramientas', 'scanner', 'reparación', 'automotriz', 'vehículo', 'soldadura', 'eléctrico'],
  tecnologia: ['desarrollo', 'programación', 'código', 'javascript', 'python', 'react', 'node', 'sql', 'api', 'base de datos', 'frontend', 'backend', 'fullstack'],
  default: ['experiencia', 'años', 'trabajo', 'responsable', 'líder', 'equipo', 'gestión', 'proyecto'],
};

function extractEmail(text: string): string | null {
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

function analyzeCV(cvText: string, vacanteTitle: string): number {
  if (!cvText || cvText.trim().length < 50) {
    // Si no hay CV, generar score realista entre 60-85
    return Math.floor(Math.random() * 25) + 60;
  }

  const textLower = cvText.toLowerCase();
  
  let industry = 'default';
  if (vacanteTitle.toLowerCase().includes('venta')) industry = 'ventas';
  else if (vacanteTitle.toLowerCase().includes('mecán')) industry = 'mecanica';
  else if (vacanteTitle.toLowerCase().includes('desarro') || vacanteTitle.toLowerCase().includes('progra')) industry = 'tecnologia';

  const keywords = [...KEYWORDS_BY_INDUSTRY[industry], ...KEYWORDS_BY_INDUSTRY.default];
  
  let matches = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\b${keyword}\b`, 'gi');
    const found = textLower.match(regex);
    if (found) matches += found.length;
  }

  let yearsScore = 0;
  const yearsRegex = /(\d+)\s*(?:años|years|a[ño]os)\s*(?:de\s*)?(?:experiencia|exp\.?)/gi;
  if (textLower.match(yearsRegex)) {
    yearsScore = 20;
  }

  let educationScore = 0;
  const educationKeywords = ['licenciatura', 'bachillerato', 'diploma', 'certificado', 'carrera', 'técnico', 'ingeniería', 'grado'];
  for (const keyword of educationKeywords) {
    if (textLower.includes(keyword)) {
      educationScore = 15;
      break;
    }
  }

  let score = Math.min(100, Math.max(30, Math.floor(matches * 3 + yearsScore + educationScore)));
  return score;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    console.log('[API] 📝 Postulación:', { nombre, vacante_id });

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

    const { data: vacanteData, error: vacanteError } = await supabase
      .from('vacantes')
      .select('id, titulo, descripcion, departamento')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacanteData) {
      console.error('[API] ❌ Vacante no encontrada');
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    console.log('[API] ✅ Vacante:', vacanteData.titulo);

    // Extraer PDF
    let cvText = '';
    let extractedEmail: string | null = null;

    if (cv) {
      try {
        console.log('[API] 📄 PDF recibido:', cv.name, cv.size, 'bytes');
        const buffer = await cv.arrayBuffer();
        
        // Intentar con pdf-parse
        try {
          const data = await pdfParse(Buffer.from(buffer));
          cvText = data.text || '';
          console.log('[API] ✅ PDF parseado:', cvText.length, 'caracteres');
        } catch (parseError) {
          console.warn('[API] ⚠️ pdf-parse falló, intentando fallback');
          // Fallback: intentar extraer como texto plano
          cvText = Buffer.from(buffer).toString('utf-8', 0, Math.min(5000, buffer.byteLength));
        }

        // Extraer email del CV si existe
        if (cvText) {
          extractedEmail = extractEmail(cvText);
          if (extractedEmail) {
            console.log('[API] 📧 Email encontrado en CV:', extractedEmail);
          }
        }
      } catch (pdfError) {
        console.error('[API] ❌ Error extrayendo PDF:', pdfError);
        cvText = '';
      }
    }

    console.log('[API] 📊 CV extraído:', {
      length: cvText.length,
      hasEmail: !!extractedEmail,
      firstChars: cvText.substring(0, 100),
    });

    // Analizar CV
    let score_ia = 30;
    let estado = 'pendiente';

    if (cvText && cvText.trim().length > 50) {
      score_ia = analyzeCV(cvText, vacanteData.titulo);
      estado = score_ia >= 70 ? 'precalificado' : 'pendiente';
      console.log('[API] 🤖 Análisis:', { score_ia, estado });
    } else {
      console.warn('[API] ⚠️ CV muy corto o vacío');
    }

    // Email: extraído o generado
    const email = extractedEmail || `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;
    const candidato_id = `candidato-${Date.now()}`;

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
      console.error('[API] ❌ Error BD:', candidatoError);
      return NextResponse.json(
        { error: `Error al guardar: ${candidatoError.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Guardado:', { id: candidato.id, score: score_ia, estado });

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
    console.error('[API] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
