import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { sanitizeInput, validateEmail, logAuditEvent } from '@/lib/security-utils';
import { syncCreateCandidato } from '@/lib/dual-sync';

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
  console.log('[SCORING] Calculando score inteligente...');

  if (!cvText || cvText.trim().length < 20) {
    console.log('[SCORING] CV muy corto, score mínimo');
    return 25;
  }

  const cv = cvText.toLowerCase();
  const plaza = (plazaTitulo + ' ' + plazaDesc).toLowerCase();

  let score = 30; // Base

  // 1. ANÁLISIS DE EXPERIENCIA (20 puntos max)
  const expMatch = cv.match(/(\d+)\s*(?:años|years|experience|años de experiencia)/gi);
  if (expMatch) {
    const years = parseInt(expMatch[0]) || 0;
    if (years >= 5) score += 20;
    else if (years >= 3) score += 15;
    else if (years >= 1) score += 10;
    else score += 5;
  } else if (/\b(experiencia|experience|trabajé|worked|desarrollé|developed)\b/i.test(cv)) {
    score += 8;
  }

  // 2. EDUCACIÓN (15 puntos max)
  if (/\b(licenciatura|licenciado|degree|bachelor|ingeniero|engineer|máster|master)\b/i.test(cv)) {
    score += 15;
  } else if (/\b(técnico|técnica|diploma|certificado|certified)\b/i.test(cv)) {
    score += 8;
  }

  // 3. COINCIDENCIA CON VACANTE (35 puntos max)
  const keywords = plaza.match(/\b\w{4,}\b/g) || [];
  const uniqueKeywords = new Set(keywords);

  let keywordMatches = 0;
  for (const kw of uniqueKeywords) {
    if (cv.includes(kw)) keywordMatches++;
  }

  if (uniqueKeywords.size > 0) {
    const keywordScore = (keywordMatches / uniqueKeywords.size) * 35;
    score += Math.min(35, keywordScore);
  }

  // 4. PALABRAS CLAVE DE ALTO PESO (10 puntos bonus)
  const highValueKeywords = [
    'liderazgo', 'leadership', 'gestión', 'management',
    'análisis', 'analysis', 'diseño', 'design',
    'implementación', 'implementation', 'éxito', 'success',
    'proyecto', 'project', 'equipo', 'team', 'cliente', 'client'
  ];

  let highValueMatches = 0;
  for (const kw of highValueKeywords) {
    if (cv.includes(kw)) highValueMatches++;
  }

  if (highValueMatches > 0) {
    score += Math.min(10, highValueMatches * 2);
  }

  // 5. FORMATOS PROFESIONALES (5 puntos bonus)
  if (cv.includes('email') || cv.includes('linkedin') || cv.includes('teléfono') || cv.includes('phone')) {
    score += 5;
  }

  const finalScore = Math.min(100, Math.max(25, Math.round(score)));
  console.log(`[SCORING] Score final: ${finalScore} (experiencia: ${expMatch ? 'si' : 'no'}, educación: ${/licenciatura|degree/i.test(cv) ? 'si' : 'no'}, keywords: ${keywordMatches}/${uniqueKeywords.size})`);
  return finalScore;
}


export async function POST(request: NextRequest) {
  try {
    // ========== RATE LIMITING ==========
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     '127.0.0.1';
    const rateLimitResult = rateLimit(`postular:${ipAddress}`, 5, 3600000); // 5 postulaciones por hora

    if (!rateLimitResult.success) {
      console.warn('[SECURITY] Postular rate limit exceeded:', { ipAddress });
      return NextResponse.json(
        { error: 'Demasiadas postulaciones. Intenta más tarde.', success: false },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 3600),
          }
        }
      );
    }

    const formData = await request.formData();
    const nombre = sanitizeInput(formData.get('nombre') as string);
    const email = sanitizeInput(formData.get('email') as string);
    const telefono = sanitizeInput(formData.get('telefono') as string);
    const experiencia_anos = formData.get('experiencia_anos') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cvText = formData.get('cvText') as string;
    const habilidades = formData.get('habilidades') as string;
    const cv = formData.get('cv') as File;

    // ========== VALIDACIÓN DE SEGURIDAD ==========
    if (!validateEmail(email)) {
      logAuditEvent('postular', 'candidato', 'N/A', 'failure', { reason: 'invalid_email' }, undefined, ipAddress);
      return NextResponse.json({ error: 'Email inválido', success: false }, { status: 400 });
    }

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
      .select('titulo, descripcion, estado')
      .eq('id', vacante_id)
      .single();

    if (!vacanteData) {
      return NextResponse.json({ error: 'Vacante no encontrada', success: false }, { status: 404 });
    }

    // Verificar que la vacante está abierta (no cerrada)
    if (vacanteData.estado === 'cerrada' || vacanteData.estado === 'closed') {
      return NextResponse.json({
        error: 'La vacante está cerrada y no acepta más aplicaciones',
        success: false
      }, { status: 410 }); // 410 Gone - El recurso ya no está disponible
    }

    // VALIDACIÓN DE PLAN: Verificar límite de candidatos en DEMO
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (user && !authError) {
          // Obtener plan del usuario
          const { data: company } = await supabase
            .from('companies')
            .select('plan')
            .eq('user_id', user.id)
            .single();

          if (company?.plan === 'demo') {
            // En DEMO: máximo 1 candidato TOTAL
            const { count: candidatoCount } = await supabase
              .from('candidatos')
              .select('*', { count: 'exact', head: true });

            if (candidatoCount && candidatoCount >= 1) {
              return NextResponse.json({
                error: 'Has alcanzado el límite de 1 candidato en el plan Demo. Actualiza a Premium para continuar.',
                success: false,
                plan: 'demo',
              }, { status: 403 });
            }
          }
        }
      } catch (planCheckError) {
        console.log('[API] Error checking plan (continuing):', planCheckError);
        // Continuar sin validación si hay error
      }
    }

    // Usar cvText + habilidades para análisis
    let finalCVText = (cvText || '').trim();
    let cvUrl = '';
    let extractedEmail = email || ''; // Usar email ingresado como base, o vacío

    // El frontend extrae el PDF con pdfjs - confiamos en eso
    console.log('[API] cvText recibido del frontend:', finalCVText.substring(0, 100) + '...');

    // Extraer email del PDF si no vino en formulario (ANTES de agregar habilidades)
    if (finalCVText && !email) {
      const pdfEmail = extractEmailFromText(finalCVText);
      if (pdfEmail) {
        extractedEmail = pdfEmail;
        console.log('[API] Email extraído del PDF:', pdfEmail);
      }
    }

    // Usar solo el CV extraído para scoring (no incluir habilidades manuales)
    let textForScoring = finalCVText.trim();
    // Solo agregar habilidades si el CV está muy vacío
    if (textForScoring.length < 50 && habilidades) {
      textForScoring = (textForScoring + ' ' + habilidades).trim();
      console.log('[API] Completando con habilidades porque CV es muy corto');
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

    const candidatoData: any = {
      id: candidato_id,
      vacante_id: vacante_id,
      nombre: nombre,
      email: extractedEmail,
      telefono: telefono,
      experiencia_anos: experiencia_anos ? parseInt(experiencia_anos) : null,
      cv_url: cvUrl,
      estado: estado,
      score_ia: score_ia,
    };

    const { data: candidato, error } = await supabase
      .from('candidatos')
      .insert(candidatoData)
      .select()
      .single();

    if (error) {
      console.error('[API] Error guardando candidato:', error);
      return NextResponse.json({
        error: `Error al guardar candidato: ${error.message}`,
        details: error.details,
        success: false
      }, { status: 500 });
    }

    console.log('[API] Candidato guardado exitosamente:', candidato.id);

    // Sincronizar con Godaddy en background (sin bloquear respuesta)
    // Obtener email del reclutador (dueño de la vacante)
    const { data: vacanteOwner } = await supabase
      .from('companies')
      .select('email')
      .eq('user_id', vacanteData.user_id)
      .single();

    syncCreateCandidato({
      id: candidato.id,
      vacante_id: vacante_id,
      nombre: nombre,
      email: extractedEmail,
      telefono: telefono,
      cv_url: cvUrl,
      score_ia: score_ia,
      experiencia_anos: experiencia_anos ? parseInt(experiencia_anos) : undefined,
      recruiterEmail: vacanteOwner?.email,
    }).catch(err => {
      console.error('[SYNC] Background sync error for candidato:', err);
    });

    // ========== AUDIT LOG ==========
    logAuditEvent(
      'postular',
      'candidato',
      candidato.id,
      'success',
      { vacante_id, score: score_ia, estado },
      undefined,
      ipAddress
    );

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
