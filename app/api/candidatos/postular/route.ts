import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

// Palabras clave por industria
const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  ventas: ['ventas', 'cliente', 'comisión', 'prospección', 'crm', 'negociación', 'cierre', 'pipeline', 'lead', 'venta', 'vendedor', 'comercial', 'telemarketing'],
  mecanica: ['motor', 'transmisión', 'diagnóstico', 'suspensión', 'frenos', 'inyección', 'herramientas', 'scanner', 'reparación', 'automotriz', 'vehículo', 'soldadura', 'eléctrico'],
  tecnologia: ['desarrollo', 'programación', 'código', 'javascript', 'python', 'react', 'node', 'sql', 'api', 'base de datos', 'frontend', 'backend', 'fullstack'],
  default: ['experiencia', 'años', 'trabajo', 'responsable', 'líder', 'equipo', 'gestión', 'proyecto'],
};

function analyzeCV(cvText: string, vacanteTitle: string, vacanteDescription: string): number {
  const textLower = cvText.toLowerCase();
  
  // Detectar industria basado en título
  let industry = 'default';
  if (vacanteTitle.toLowerCase().includes('venta')) industry = 'ventas';
  else if (vacanteTitle.toLowerCase().includes('mecán')) industry = 'mecanica';
  else if (vacanteTitle.toLowerCase().includes('desarro') || vacanteTitle.toLowerCase().includes('progra')) industry = 'tecnologia';

  // Obtener palabras clave para la industria
  const keywords = [...KEYWORDS_BY_INDUSTRY[industry], ...KEYWORDS_BY_INDUSTRY.default];
  
  // Contar coincidencias de palabras clave
  let matches = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\b${keyword}\b`, 'gi');
    const found = textLower.match(regex);
    if (found) matches += found.length;
  }

  // Buscar años de experiencia
  let yearsScore = 0;
  const yearsRegex = /(\d+)\s*(?:años|years|a[ño]os)\s*(?:de\s*)?(?:experiencia|exp\.?)/gi;
  const yearsMatch = textLower.match(yearsRegex);
  if (yearsMatch) {
    yearsScore = 20; // Bonus por tener experiencia documentada
  }

  // Buscar educación/certificaciones
  let educationScore = 0;
  const educationKeywords = ['licenciatura', 'bachillerato', 'diploma', 'certificado', 'carrera', 'técnico', 'ingeniería', 'grado'];
  for (const keyword of educationKeywords) {
    if (textLower.includes(keyword)) {
      educationScore = 15;
      break;
    }
  }

  // Calcular score basado en coincidencias
  // Mínimo 20 (tiene algo), máximo 100
  let score = Math.min(100, Math.max(20, Math.floor(matches * 3 + yearsScore + educationScore)));

  return score;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    console.log('[API] 📝 Postulación recibida:', { nombre, vacante_id });

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

    // Obtener vacante
    const { data: vacanteData, error: vacanteError } = await supabase
      .from('vacantes')
      .select('id, titulo, descripcion, departamento')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacanteData) {
      console.error('[API] ❌ Vacante no encontrada:', vacante_id);
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    console.log('[API] ✅ Vacante encontrada:', vacanteData.titulo);

    // Extraer texto del PDF
    let cvText = '';
    if (cv) {
      try {
        console.log('[API] 📄 Extrayendo PDF...');
        const buffer = await cv.arrayBuffer();
        const data = await pdfParse(Buffer.from(buffer));
        cvText = data.text;
        console.log('[API] ✅ PDF extraído:', cvText.length, 'caracteres');
      } catch (pdfError) {
        console.error('[API] ❌ Error en PDF:', pdfError);
        cvText = '';
      }
    }

    // Analizar CV
    let score_ia = 30; // Score mínimo si no hay CV
    let estado = 'pendiente';

    if (cvText && cvText.trim().length > 50) {
      score_ia = analyzeCV(cvText, vacanteData.titulo, vacanteData.descripcion || '');
      estado = score_ia >= 80 ? 'precalificado' : 'pendiente';
      console.log('[API] 🤖 Análisis completado:', { nombre, score_ia, estado });
    } else {
      console.warn('[API] ⚠️ CV vacío, score mínimo');
    }

    // Generar email
    const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;
    const candidato_id = `candidato-${Date.now()}`;

    // Crear candidato en Supabase
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
      console.error('[API] ❌ Error creando candidato:', candidatoError);
      return NextResponse.json(
        { error: `Error al guardar candidato: ${candidatoError.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('[API] ✅ Candidato guardado:', {
      id: candidato.id,
      score: score_ia,
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
    console.error('[API] ❌ Error general:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
