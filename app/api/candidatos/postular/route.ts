import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  ventas: ['ventas', 'cliente', 'comisión', 'prospección', 'crm', 'negociación', 'cierre', 'lead', 'comercial', 'asesor', 'venta'],
  mecanica: ['motor', 'transmisión', 'diagnóstico', 'suspensión', 'frenos', 'inyección', 'reparación', 'automotriz', 'mecánico', 'scanner'],
};

function analyzeCV(cvText: string, vacanteTitle: string): number {
  if (!cvText || cvText.length < 50) return 0;

  const textLower = cvText.toLowerCase();
  let industry = 'default';
  
  if (vacanteTitle.toLowerCase().includes('venta')) industry = 'ventas';
  else if (vacanteTitle.toLowerCase().includes('mecán')) industry = 'mecanica';

  const keywords = KEYWORDS_BY_INDUSTRY[industry] || [];
  let score = 0;

  for (const keyword of keywords) {
    const count = (textLower.match(new RegExp(keyword, 'g')) || []).length;
    score += count * 5;
  }

  // Bonus por años
  if (/(\d+)\s*(?:años|years)/.test(textLower)) score += 15;
  
  // Bonus por educación
  if (/(?:licenciatura|técnico|carrera|diploma)/.test(textLower)) score += 10;

  return Math.min(100, score || 0);
}

function extractTextFromBuffer(buffer: Buffer): string {
  let text = '';
  
  // Intentar extraer texto legible del buffer
  for (let i = 0; i < buffer.length - 1; i++) {
    const byte = buffer[i];
    // Caracteres imprimibles ASCII y UTF-8
    if ((byte >= 32 && byte <= 126) || byte >= 192) {
      text += String.fromCharCode(byte);
    } else if (byte === 10 || byte === 13) {
      text += ' ';
    }
  }
  
  return text;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    if (!nombre || !telefono || !vacante_id) {
      return NextResponse.json({ error: 'Faltan campos', success: false }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: vacanteData } = await supabase
      .from('vacantes')
      .select('titulo')
      .eq('id', vacante_id)
      .single();

    if (!vacanteData) {
      return NextResponse.json({ error: 'Vacante no encontrada', success: false }, { status: 404 });
    }

    let cvText = '';
    try {
      if (cv) {
        const buffer = await cv.arrayBuffer();
        cvText = extractTextFromBuffer(Buffer.from(buffer));
      }
    } catch (e) {
      console.error('Error extrayendo buffer:', e);
    }

    // Analizar y generar score
    const score_ia = analyzeCV(cvText, vacanteData.titulo);
    const estado = score_ia >= 70 ? 'precalificado' : 'pendiente';

    const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;
    const candidato_id = `candidato-${Date.now()}`;

    const { data: candidato, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: 'Error al guardar', success: false }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      candidatoId: candidato.id,
      candidato: { id: candidato.id, email, score_ia, estado },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error', success: false }, { status: 500 });
  }
}
