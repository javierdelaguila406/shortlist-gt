import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import pdfParse from 'pdf-parse';

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  ventas: ['ventas', 'cliente', 'comisión', 'prospección', 'crm', 'negociación', 'cierre', 'pipeline', 'lead', 'venta', 'vendedor', 'comercial', 'telemarketing', 'asesor', 'consultor'],
  mecanica: ['motor', 'transmisión', 'diagnóstico', 'suspensión', 'frenos', 'inyección', 'herramientas', 'scanner', 'reparación', 'automotriz', 'vehículo', 'soldadura', 'eléctrico', 'mecánico'],
  default: ['experiencia', 'años', 'trabajo', 'responsable', 'líder', 'equipo', 'gestión', 'proyecto', 'empresa'],
};

// Extraer emails
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(emailRegex) || [];
}

// Extraer teléfonos
function extractPhones(text: string): string[] {
  const phoneRegex = /(\+?[\d\s\-()]{9,}|\d{7,})/g;
  return text.match(phoneRegex) || [];
}

// Extraer nombres (primeras líneas del CV)
function extractName(text: string): string | null {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    // Si tiene pocas palabras y no es un email, probablemente es el nombre
    if (line.length > 3 && line.length < 80 && !line.includes('@') && !line.includes('http')) {
      return line;
    }
  }
  return null;
}

// Analizar CV con palabras clave
function analyzeCV(cvText: string, vacanteTitle: string, vacanteDescription: string): number {
  if (!cvText || cvText.trim().length < 30) return 0;

  const textLower = cvText.toLowerCase();
  
  // Detectar industria
  let industry = 'default';
  const titleLower = vacanteTitle.toLowerCase();
  if (titleLower.includes('venta')) industry = 'ventas';
  else if (titleLower.includes('mecán')) industry = 'mecanica';
  
  const keywords = [...KEYWORDS_BY_INDUSTRY[industry], ...KEYWORDS_BY_INDUSTRY.default];
  
  // Contar coincidencias
  let matches = 0;
  for (const keyword of keywords) {
    const regex = new RegExp(`\b${keyword}\b`, 'gi');
    const found = textLower.match(regex);
    if (found) matches += found.length;
  }

  // Bonus por años de experiencia
  let yearsScore = 0;
  const yearsMatch = textLower.match(/(\d+)\s*(?:años|years|a[ño]os)\s*(?:de\s*)?(?:experiencia|exp)/i);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    yearsScore = Math.min(30, years * 5);
  }

  // Bonus por educación
  let educationScore = 0;
  const educationKeywords = ['licenciatura', 'ingeniería', 'diploma', 'certificado', 'carrera técnica', 'técnico', 'grado'];
  for (const keyword of educationKeywords) {
    if (textLower.includes(keyword)) {
      educationScore = 15;
      break;
    }
  }

  // Calcular score final
  let score = Math.min(100, Math.max(0, matches * 2 + yearsScore + educationScore));
  
  // Si tiene muy pocas coincidencias pero tiene contenido, minimo 20
  if (score < 20 && cvText.trim().length > 100) {
    score = 20;
  }

  return Math.floor(score);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    if (!nombre || !telefono || !vacante_id) {
      return NextResponse.json(
        { error: 'Faltan campos', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener vacante
    const { data: vacanteData } = await supabase
      .from('vacantes')
      .select('id, titulo, descripcion')
      .eq('id', vacante_id)
      .single();

    if (!vacanteData) {
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    // PASO 1: Extraer texto del PDF
    let cvText = '';
    try {
      if (cv) {
        const buffer = await cv.arrayBuffer();
        const data = await pdfParse(Buffer.from(buffer));
        cvText = data.text || '';
      }
    } catch (e) {
      console.error('Error PDF:', e);
    }

    // PASO 2: Extraer nombre, email, teléfono del CV
    const extractedName = extractName(cvText) || nombre;
    const emails = extractEmails(cvText);
    const phones = extractPhones(cvText);
    
    const email = emails.length > 0 ? emails[0] : `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;
    const extractedPhone = phones.length > 0 ? phones[0] : telefono;

    // PASO 3: Analizar CV y generar SCORE REAL
    const score_ia = analyzeCV(cvText, vacanteData.titulo, vacanteData.descripcion || '');
    const estado = score_ia >= 70 ? 'precalificado' : 'pendiente';

    console.log('RESULTADO:', {
      nombre: extractedName,
      email,
      telefono: extractedPhone,
      score_ia,
      estado,
      cvLength: cvText.length,
    });

    // PASO 4: Guardar en Supabase
    const candidato_id = `candidato-${Date.now()}`;

    const { data: candidato, error } = await supabase
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id: vacante_id,
        nombre: extractedName,
        email: email,
        telefono: extractedPhone,
        estado: estado,
        score_ia: score_ia,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Error al guardar', success: false },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      candidatoId: candidato.id,
      candidato: {
        id: candidato.id,
        nombre: extractedName,
        email: email,
        telefono: extractedPhone,
        score_ia: score_ia,
        estado: estado,
      },
    });
  } catch (error) {
    console.error('ERROR:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
