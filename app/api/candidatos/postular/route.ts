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

function calculateScore(cvText: string, plazaTitulo: string, plazaDesc: string): number {
  console.log('[SCORING] Calculando score localmente...');

  if (!cvText || cvText.trim().length < 10) {
    console.log('[SCORING] CV muy corto');
    return 20;
  }

  const cvLower = cvText.toLowerCase();
  const plazaFull = (plazaTitulo + ' ' + plazaDesc).toLowerCase();

  // Extraer palabras (4+ caracteres)
  const cvWords = new Set(cvLower.match(/\b\w{4,}\b/g) || []);
  const plazaWords = new Set(plazaFull.match(/\b\w{4,}\b/g) || []);

  if (plazaWords.size === 0) return 20;

  // Calcular coincidencias
  let matches = 0;
  for (const word of plazaWords) {
    if (cvWords.has(word)) matches++;
  }

  const coverage = matches / plazaWords.size;
  let score = 30 + (coverage * 50);

  // Bonos
  if (/\b(años|years|experiencia|experience)\b/.test(cvLower)) score += 10;
  if (/\b(licenciatura|degree|carrera|bachelor)\b/.test(cvLower)) score += 10;

  const finalScore = Math.min(100, Math.max(20, Math.round(score)));
  console.log(`[SCORING] Score final: ${finalScore} (matches: ${matches}/${plazaWords.size})`);
  return finalScore;
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

    // Generar candidato_id al inicio (necesario para Storage)
    // Usar timestamp + random para evitar colisiones
    const candidato_id = `candidato-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    if (!nombre || !telefono || !vacante_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos', success: false }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: vacanteData } = await supabase
      .from('vacantes')
      .select('titulo, descripcion')
      .eq('id', vacante_id)
      .single();

    if (!vacanteData) {
      return NextResponse.json({ error: 'Vacante no encontrada', success: false }, { status: 404 });
    }

    // Usar cvText + habilidades para análisis
    let finalCVText = (cvText || '').trim();
    let cvUrl = '';
    let extractedEmail = email || ''; // Usar email ingresado como base, o vacío

    // Si no hay cvText del frontend, intentar extraer del PDF
    if (!finalCVText && cv) {
      try {
        const buffer = await cv.arrayBuffer();
        finalCVText = extractTextFromBuffer(Buffer.from(buffer));
        console.log('[API] Texto extraído del PDF:', finalCVText.substring(0, 100) + '...');
      } catch (e) {
        console.error('[API] Error extrayendo PDF buffer:', e);
      }
    }

    // Extraer email del PDF si no vino en formulario (ANTES de agregar habilidades)
    if (finalCVText && !email) {
      const pdfEmail = extractEmailFromText(finalCVText);
      if (pdfEmail) {
        extractedEmail = pdfEmail;
        console.log('[API] Email extraído del PDF:', pdfEmail);
      }
    }

    // Agregar habilidades al final (para scoring, NO para extraction)
    let textForScoring = finalCVText.trim();
    if (habilidades) {
      textForScoring = (textForScoring + ' ' + habilidades).trim();
      console.log('[API] Agregando habilidades para scoring');
    }

    // Validar que tenemos email (REQUERIDO)
    if (!extractedEmail || extractedEmail.trim().length === 0) {
      return NextResponse.json({
        error: 'Email es requerido. Proporciona tu email o asegúrate que esté en el PDF.',
        success: false
      }, { status: 400 });
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

    // Calcular score
    const score_ia = calculateScore(textForScoring, vacanteData.titulo, vacanteData.descripcion || '');
    const estado = score_ia >= 70 ? 'precalificado' : 'pendiente';

    console.log('[API] Guardando candidato:', { nombre, email: extractedEmail, score_ia, estado });

    const { data: candidato, error } = await supabase
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id: vacante_id,
        nombre: nombre,
        email: extractedEmail,
        telefono: telefono,
        cv_url: cvUrl,
        estado: estado,
        score_ia: score_ia,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] Error guardando candidato:', error);
      return NextResponse.json({ error: 'Error al guardar candidato', success: false }, { status: 500 });
    }

    console.log('[API] Candidato guardado exitosamente:', candidato.id);

    return NextResponse.json({
      success: true,
      candidatoId: candidato.id,
      candidato: {
        id: candidato.id,
        email: extractedEmail,  // ✅ Retorna email extraído
        score_ia,
        estado,
        cv_url: cvUrl
      },
    });
  } catch (error) {
    console.error('[API] Error inesperado:', error);
    return NextResponse.json({ error: 'Error del servidor', success: false }, { status: 500 });
  }
}
