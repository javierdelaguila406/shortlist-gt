import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import { persistentRateLimit } from '@/lib/rate-limit';
import { sanitizeInput, validateEmail, logAuditEvent } from '@/lib/security-utils';
import { logAuditEvent as persistAuditEvent } from '@/lib/audit';
import { MAX_CV_BYTES, extractPdfText, isPdf } from '@/lib/pdf';
import { evaluarCV } from '@/lib/cv-score';
import { PLAN_LIMIT_MESSAGES, isPlanLimitError } from '@/lib/plan-limits';

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const ipAddress = clientIp(request);
    const rateLimitResult = await persistentRateLimit(`postular:${ipAddress}`, 5, 3600000);
    if (!rateLimitResult.success) {
      console.warn('[SECURITY] Application rate limit exceeded');
      return NextResponse.json(
        { error: 'Demasiadas postulaciones. Intenta más tarde.', success: false },
        { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) } }
      );
    }

    let formData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: 'Datos del formulario inválidos', success: false }, { status: 400 });
    }

    const nombre = sanitizeInput(formData.get('nombre') as string);
    const email = sanitizeInput(formData.get('email') as string);
    const telefono = sanitizeInput(formData.get('telefono') as string);
    const experienciaTexto = formData.get('experiencia_anos');
    const vacante_id = formData.get('vacante_id');
    const cv = formData.get('cv');
    const consentimiento = formData.get('consentimiento') === 'true';

    if (!consentimiento) {
      return NextResponse.json({ error: 'Debes aceptar los términos de privacidad', success: false }, { status: 400 });
    }
    if (!validateEmail(email)) {
      logAuditEvent('postular', 'candidato', 'N/A', 'failure', { reason: 'invalid_email' }, undefined, ipAddress);
      return NextResponse.json({ error: 'Email inválido', success: false }, { status: 400 });
    }
    if (!nombre || !telefono || typeof vacante_id !== 'string' || !vacante_id) {
      return NextResponse.json({ error: 'Faltan campos requeridos', success: false }, { status: 400 });
    }
    const experienciaNumero = typeof experienciaTexto === 'string' && experienciaTexto.trim() !== ''
      ? Number.parseInt(experienciaTexto, 10)
      : null;
    if (experienciaNumero !== null && (!Number.isInteger(experienciaNumero) || experienciaNumero < 0 || experienciaNumero > 70)) {
      return NextResponse.json({ error: 'Años de experiencia inválidos', success: false }, { status: 400 });
    }

    if (!(cv instanceof File) || cv.size === 0) {
      return NextResponse.json({ error: 'Adjunta tu CV en PDF', success: false }, { status: 400 });
    }
    if (cv.size > MAX_CV_BYTES) {
      return NextResponse.json({ error: 'El CV no puede superar 5 MB', success: false }, { status: 413 });
    }
    const cvBytes = Buffer.from(await cv.arrayBuffer());
    if (!isPdf(cvBytes)) {
      return NextResponse.json({ error: 'El archivo debe ser un PDF', success: false }, { status: 400 });
    }

    // Ruta pública sin usuario: el servidor valida todo y escribe con service role (RLS no permite INSERT a anon).
    let admin: ReturnType<typeof createAdminClient>;
    try {
      admin = createAdminClient();
    } catch {
      return NextResponse.json({ error: 'Configuración faltante', success: false }, { status: 500 });
    }

    const { data: vacanteData } = await admin
      .from('vacantes')
      .select('titulo, descripcion, estado, usuario_id')
      .eq('id', vacante_id)
      .maybeSingle();
    if (!vacanteData) {
      return NextResponse.json({ error: 'Vacante no encontrada', success: false }, { status: 404 });
    }
    if (vacanteData.estado !== 'activa') {
      return NextResponse.json({ error: 'La vacante no está recibiendo aplicaciones', success: false }, { status: 410 });
    }

    const candidato_id = `candidato-${randomUUID()}`;
    const { error: consentError } = await admin.from('consent_log').insert({
      usuario_id: candidato_id,
      vacante_id,
      tipo: 'postulacion',
      aceptado: true,
      ip_address: ipAddress,
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
    });
    if (consentError) {
      console.error('[Consent] Persistent record failed', { vacancyId: vacante_id });
      return NextResponse.json({ error: 'No se pudo registrar el consentimiento', success: false }, { status: 500 });
    }

    // El puntaje sale del PDF que se guarda, nunca de texto enviado por el navegador.
    let cvTexto = '';
    try {
      cvTexto = await extractPdfText(cvBytes);
    } catch {
      console.warn('[API] Candidate document could not be read; marked as not evaluated');
    }
    const { evaluado, score, estado } = evaluarCV(cvTexto, vacanteData.titulo, vacanteData.descripcion || '');

    const cvPath = `${vacante_id}/${candidato_id}.pdf`;
    const { error: uploadError } = await admin.storage
      .from('cvs')
      .upload(cvPath, cvBytes, { contentType: 'application/pdf', upsert: false });
    if (uploadError) {
      console.error('[API] Candidate document storage failed', { code: uploadError.name });
      return NextResponse.json({ error: 'No se pudo guardar el CV. Intenta más tarde.', success: false }, { status: 500 });
    }

    const { data: candidato, error } = await admin
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id,
        nombre,
        email,
        telefono,
        experiencia_anos: experienciaNumero,
        cv_url: cvPath,
        estado,
        score_ia: score,
        cv_evaluado: evaluado,
      })
      .select('id')
      .single();

    if (error) {
      await admin.storage.from('cvs').remove([cvPath]);
      if (isPlanLimitError(error)) {
        return NextResponse.json({ error: PLAN_LIMIT_MESSAGES.candidatos, success: false }, { status: 403 });
      }
      console.error('[API] Database error (internal):', { code: error.code, timestamp: new Date().toISOString() });
      return NextResponse.json({ error: 'Error al guardar candidato. Intenta más tarde.', success: false }, { status: 500 });
    }

    logAuditEvent('postular', 'candidato', candidato.id, 'success', { vacante_id, score, estado }, undefined, ipAddress);
    await persistAuditEvent({
      action: 'CREATE', userId: candidato_id, resourceId: candidato.id,
      resourceType: 'candidato', changes: { vacante_id, estado },
    });

    return NextResponse.json({ success: true, candidatoId: candidato.id });
  } catch (error) {
    console.error('[API] Unexpected error in postular:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu postulación. Intenta más tarde.', success: false },
      { status: 500 }
    );
  }
}
