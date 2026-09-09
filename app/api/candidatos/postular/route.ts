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

function extractKeywords(text: string): string[] {
  if (!text) return [];
  const textLower = text.toLowerCase();

  // Palabras a excluir (comunes y poco relevantes)
  const stopwords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'es', 'se', 'por', 'con', 'para', 'una', 'un', 'sus',
    'del', 'las', 'los', 'o', 'este', 'ese', 'este', 'como', 'si', 'no', 'los', 'en', 'al', 'es'
  ]);

  // Palabras técnicas relevantes para búsqueda
  const techWords = /\b(?:python|java|javascript|react|angular|vue|node|sql|mongodb|postgresql|git|docker|kubernetes|aws|azure|gcp|api|rest|graphql|html|css|typescript|golang|rust|php|laravel|django|spring|kotlin|swift|mobile|web|frontend|backend|fullstack|devops|ci|cd|linux|windows|agile|scrum|jira|confluence|slack|figma|ui|ux|wordpress|drupal|shopify|salesforce|sap|crm|erp|excel|vba|tableau|power bi|powerpoint|wordpress|linux|apache|nginx|jenkins)\b/gi;

  // Extraer palabras técnicas
  const techMatches = textLower.match(techWords) || [];
  const keywords = new Set<string>();

  // Agregar palabras técnicas
  techMatches.forEach(word => keywords.add(word.toLowerCase()));

  // Extraer palabras largas (4+ caracteres) que no sean stopwords
  const words = textLower.split(/\W+/);
  words.forEach(word => {
    if (word.length >= 4 && !stopwords.has(word) && /^[a-záéíóúa-z0-9]+$/.test(word)) {
      keywords.add(word);
    }
  });

  return Array.from(keywords);
}

function analyzeCV(cvText: string, vacanteTitle: string, vacanteDesc: string = ''): number {
  if (!cvText || cvText.trim().length < 10) {
    console.log('[SCORING] CV muy corto, score mínimo');
    return 20;
  }

  const cvLower = cvText.toLowerCase();

  // Extraer palabras clave de la descripción de la plaza
  const plazaKeywords = extractKeywords(vacanteDesc);
  const cvKeywords = extractKeywords(cvText);

  if (plazaKeywords.length === 0) {
    console.log('[SCORING] No se extrajeron palabras de la plaza');
  }
  if (cvKeywords.length === 0) {
    console.log('[SCORING] No se extrajeron palabras del CV');
  }

  let score = 30; // Base 30

  // Comparar palabras clave
  let matchCount = 0;
  for (const keyword of plazaKeywords) {
    if (cvKeywords.includes(keyword)) {
      matchCount++;
      score += 3; // 3 puntos por cada coincidencia
    }
  }

  console.log(`[SCORING] Matches: ${matchCount}/${plazaKeywords.length}`);

  // Bonus por cobertura (qué porcentaje de requisitos cubre)
  if (plazaKeywords.length > 0) {
    const coverage = Math.min(matchCount / plazaKeywords.length, 1);
    const coverageBonus = coverage * 20;
    score += coverageBonus;
    console.log(`[SCORING] Cobertura: ${(coverage * 100).toFixed(0)}% (+${coverageBonus.toFixed(0)} pts)`);
  }

  // Bonus por años de experiencia
  const yearsMatch = cvLower.match(/(\d+)\s*(?:años|years|a[ñ]os)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1]);
    let yearsBonus = 0;
    if (years >= 5) yearsBonus = 20;
    else if (years >= 3) yearsBonus = 15;
    else if (years >= 1) yearsBonus = 8;
    score += yearsBonus;
    console.log(`[SCORING] Experiencia: ${years} años (+${yearsBonus} pts)`);
  }

  // Bonus por educación
  if (/(?:licenciatura|técnico|carrera|ingeniería|diploma|grado|profesional|degree|university|bachelor)/.test(cvLower)) {
    score += 10;
    console.log('[SCORING] Educación detectada (+10 pts)');
  }

  // Bonus por certificaciones
  if (/(?:certificad|cert\.|certification|certified|certificate)/.test(cvLower)) {
    score += 8;
    console.log('[SCORING] Certificaciones detectadas (+8 pts)');
  }

  const finalScore = Math.min(100, Math.max(20, score));
  console.log(`[SCORING] Score final: ${finalScore}/100`);
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
    const candidato_id = `candidato-${Date.now()}`;

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
    let extractedEmail = email; // Usar email ingresado como base
    let extractedPhone = telefono;

    // Si no hay cvText del frontend, intentar extraer del PDF
    if (!finalCVText && cv) {
      try {
        const buffer = await cv.arrayBuffer();
        finalCVText = extractTextFromBuffer(Buffer.from(buffer));
      } catch (e) {
        console.error('[API] Error extrayendo PDF buffer:', e);
      }
    }

    // Agregar habilidades al final
    if (habilidades) {
      finalCVText = finalCVText + ' ' + habilidades;
    }

    // Extraer email del PDF si no vino en formulario
    if (finalCVText && !email) {
      const pdfEmail = extractEmailFromText(finalCVText);
      if (pdfEmail) {
        extractedEmail = pdfEmail;
        console.log('[API] Email extraído del PDF:', pdfEmail);
      }
    }

    // Validar que tenemos email (requerido)
    if (!extractedEmail) {
      return NextResponse.json({ error: 'Email requerido (no se pudo extraer del PDF)', success: false }, { status: 400 });
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
    const score_ia = analyzeCV(finalCVText, vacanteData.titulo, vacanteData.descripcion || '');
    const estado = score_ia >= 70 ? 'precalificado' : 'pendiente';

    console.log('[API] Guardando candidato:', { nombre, email: extractedEmail, score_ia, estado });

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
