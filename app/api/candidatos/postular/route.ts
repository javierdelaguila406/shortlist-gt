import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Función para extraer email del texto
function extractEmailFromText(text: string): string | null {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex);
  if (matches && matches.length > 0) {
    // Retornar el primer email válido (no temporal)
    return matches[0];
  }
  return null;
}

// Función para extraer teléfono del texto
function extractPhoneFromText(text: string): string | null {
  const phoneRegex = /(\+?[\d\s\-()]{9,}|\d{8,})/;
  const match = text.match(phoneRegex);
  return match ? match[0] : null;
}

const KEYWORDS_BY_INDUSTRY: Record<string, string[]> = {
  ventas: ['ventas', 'cliente', 'comisión', 'prospección', 'crm', 'negociación', 'cierre', 'lead', 'comercial', 'asesor', 'venta'],
  mecanica: ['motor', 'transmisión', 'diagnóstico', 'suspensión', 'frenos', 'inyección', 'reparación', 'automotriz', 'mecánico', 'scanner'],
};

function analyzeCV(cvText: string, vacanteTitle: string): number {
  if (!cvText || cvText.length < 20) return 20; // Mínimo 20 si hay algo

  const textLower = cvText.toLowerCase();
  let industry = 'default';

  if (vacanteTitle.toLowerCase().includes('venta')) industry = 'ventas';
  else if (vacanteTitle.toLowerCase().includes('mecán')) industry = 'mecanica';

  const keywords = KEYWORDS_BY_INDUSTRY[industry] || [];
  let score = 20; // Base 20

  // Contar palabras clave (peso aumentado)
  for (const keyword of keywords) {
    const count = (textLower.match(new RegExp(keyword, 'g')) || []).length;
    score += Math.min(count, 3) * 8; // Max 3 por palabra, 8 puntos cada
  }

  // Bonus significativo por años de experiencia
  const yearsMatch = textLower.match(/(\d+)\s*(?:años|years|a[ñ]os)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    if (years >= 5) score += 25;
    else if (years >= 3) score += 20;
    else if (years >= 1) score += 10;
  }

  // Bonus por educación
  if (/(?:licenciatura|técnico|carrera|ingeniería|diploma|grado)/.test(textLower)) {
    score += 15;
  }

  // Bonus si tiene múltiples palabras clave (indica mejor fit)
  const keywordMatches = keywords.filter(k => textLower.includes(k)).length;
  if (keywordMatches >= 3) score += 15;
  if (keywordMatches >= 5) score += 10;

  return Math.min(100, Math.max(20, score));
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
    const email = formData.get('email') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cvText = formData.get('cvText') as string;
    const habilidades = formData.get('habilidades') as string;
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

    // Usar cvText + habilidades para análisis
    let finalCVText = (cvText || '') + ' ' + (habilidades || '');
    let cvUrl = '';
    let extractedEmail = email; // Usar email ingresado como base
    let extractedPhone = telefono;

    if (!finalCVText && cv) {
      try {
        const buffer = await cv.arrayBuffer();
        finalCVText = extractTextFromBuffer(Buffer.from(buffer));
      } catch (e) {
        console.error('Error extrayendo buffer:', e);
      }
    }

    // Extraer email y teléfono del PDF si no vienen en formulario
    if (finalCVText) {
      const pdfEmail = extractEmailFromText(finalCVText);
      if (pdfEmail && !email) {
        extractedEmail = pdfEmail;
      }
    }

    // Guardar PDF en Supabase Storage
    if (cv) {
      try {
        const fileName = `${candidato_id}_${Date.now()}.pdf`;
        const buffer = await cv.arrayBuffer();

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, Buffer.from(buffer), {
            contentType: 'application/pdf',
          });

        if (!uploadError && uploadData) {
          const { data: urlData } = supabase.storage
            .from('cvs')
            .getPublicUrl(fileName);
          cvUrl = urlData.publicUrl;
          console.log('[API] PDF guardado:', cvUrl);
        } else {
          console.error('[API] Error guardando PDF:', uploadError);
        }
      } catch (e) {
        console.error('[API] Error en Storage:', e);
      }
    }

    // Analizar y generar score
    const score_ia = analyzeCV(finalCVText, vacanteData.titulo);
    const estado = score_ia >= 70 ? 'precalificado' : 'pendiente';

    const candidato_id = `candidato-${Date.now()}`;

    const { data: candidato, error } = await supabase
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id: vacante_id,
        nombre: nombre,
        email: extractedEmail,
        telefono: extractedPhone,
        cv_url: cvUrl,
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
