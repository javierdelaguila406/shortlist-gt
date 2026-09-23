import { NextRequest, NextResponse } from 'next/server';
import { persistentRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { getOwnedVacante, ownerOf, type CandidatoRow, type OwnerRelation } from '@/lib/authz';
import { logAuditEvent } from '@/lib/audit';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { randomUUID } from 'node:crypto';
import { buildReportRows, REPORT_HEADERS, validateReportRange } from '@/lib/reporting';

/**
 * Sanitize cell values for Excel/CSV to prevent formula injection
 * Prevents attacks like =cmd|'/c calc'!A1
 */
function sanitizeExcelCell(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Prevent formula injection
  // Block strings starting with =, +, -, @, or tab character
  if (/^[\=\+\-\@\t]/.test(stringValue)) {
    return "'" + stringValue; // Prefix with single quote to force text format
  }

  // Remove any remaining potentially dangerous characters
  return stringValue
    .replace(/[\r\n]/g, ' ') // Replace newlines with space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ''); // Remove control characters
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { supabase, user } = auth;

    const rateLimitResult = await persistentRateLimit(`candidate-export:${user.id}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) },
        }
      );
    }

    const { email, telefono, vacante_id, formato, desde, hasta, estado } = await request.json();

    if (vacante_id) {
      if (!['excel', 'pdf'].includes(formato)) return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
      const rangeError = validateReportRange(desde, hasta);
      if (rangeError) return NextResponse.json({ error: rangeError }, { status: 400 });

      const owned = await getOwnedVacante(supabase, user.id, vacante_id);
      if (!owned.ok) {
        return NextResponse.json(
          { error: owned.status === 403 ? 'Forbidden' : 'Vacante no encontrada' },
          { status: owned.status }
        );
      }
      const vacante = owned.data;

      let candidateQuery = supabase
        .from('candidatos')
        .select('email, nombre, estado, score_total, score_ia, created_at')
        .eq('vacante_id', vacante_id)
        .gte('created_at', `${desde}T00:00:00.000Z`)
        .lte('created_at', `${hasta}T23:59:59.999Z`);
      if (estado) candidateQuery = candidateQuery.eq('estado', estado);
      const { data: candidatos, error: exportError } = await candidateQuery.order('created_at', { ascending: true });

      if (exportError) {
        return NextResponse.json({ error: 'Error al consultar candidatos' }, { status: 500 });
      }

      const startedAt = Date.now();
      const reportId = randomUUID();
      const rows = buildReportRows(candidatos || []);
      await logAuditEvent({
        action: 'READ', userId: user.id, resourceId: reportId, resourceType: 'reporte',
        changes: { vacante_id, formato, desde, hasta, registros: rows.length },
      });

      console.log('[Report] Generated', {
        reportId, userId: user.id, vacante_id, formato,
        startDate: desde, endDate: hasta, timestamp: new Date().toISOString(),
      });

      if (formato === 'excel') {
        // Sanitize all cell values to prevent formula injection
        const sanitizedRows = rows.map(row => {
          const sanitized: Record<string, any> = {};
          for (const [key, value] of Object.entries(row)) {
            sanitized[key] = sanitizeExcelCell(value);
          }
          return sanitized;
        });

        const worksheet = XLSX.utils.json_to_sheet(sanitizedRows, {
          header: [...REPORT_HEADERS],
        });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatos');
        const file = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        console.log('[Report] Completed', { reportId, candidatesCount: rows.length, durationMs: Date.now() - startedAt, fileSize: file.length });
        return new NextResponse(new Uint8Array(file), {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="candidatos-${vacante_id}.xlsx"`,
          },
        });
      }

      const document = new jsPDF();
      // Sanitize title for PDF
      const sanitizedTitle = sanitizeExcelCell(vacante.titulo || vacante_id);
      document.text(`Candidatos - ${sanitizedTitle}`, 10, 15);
      document.text(REPORT_HEADERS.join(' | '), 10, 25);

      rows.forEach((row, index) => {
        const pageRow = index % 28;
        if (index > 0 && pageRow === 0) {
          document.addPage();
          document.text(REPORT_HEADERS.join(' | '), 10, 15);
        }

        // Sanitize all values before adding to PDF
        const sanitizedEmail = sanitizeExcelCell(row.email);
        const sanitizedNombre = sanitizeExcelCell(row.nombre);
        const sanitizedEstado = sanitizeExcelCell(row.estado);
        const sanitizedScore = sanitizeExcelCell(row.score_total);
        const sanitizedFecha = sanitizeExcelCell(row.fecha_postulacion);

        document.text(
          `${sanitizedEmail} | ${sanitizedNombre} | ${sanitizedEstado} | ${sanitizedScore} | ${sanitizedFecha}`,
          10,
          35 + pageRow * 8,
          { maxWidth: 190 }
        );
      });
      const file = document.output('arraybuffer');
      console.log('[Report] Completed', { reportId, candidatesCount: rows.length, durationMs: Date.now() - startedAt, fileSize: file.byteLength });
      return new NextResponse(file, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="candidatos-${vacante_id}.pdf"`,
        },
      });
    }

    if (!email && !telefono) {
      return NextResponse.json(
        { error: 'Se requiere email o número de teléfono' },
        { status: 400 }
      );
    }

    const { data: matches } = await supabase
      .from('candidatos')
      .select('*, vacantes:vacante_id(usuario_id)')
      .eq(email ? 'email' : 'telefono', email || telefono);

    const rows = (matches || []) as Array<CandidatoRow & { vacantes: OwnerRelation }>;
    const candidatoData = rows.find((row) => ownerOf(row.vacantes) === user.id);

    if (!candidatoData) {
      return rows.length > 0
        ? NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        : NextResponse.json({ error: 'Candidato no encontrado' }, { status: 404 });
    }

    // Compilar datos en formato JSON compatible con GDPR
    const exportedData = {
      metadata: {
        fecha_exportacion: new Date().toISOString(),
        periodo_retension: '12 meses',
        derechos_ejercibles: [
          'Derecho de acceso',
          'Derecho de rectificación',
          'Derecho al olvido',
          'Derecho a la portabilidad de datos',
          'Derecho de oposición'
        ]
      },
      datos_personales: {
        nombre: candidatoData.nombre,
        email: candidatoData.email,
        telefono: candidatoData.telefono,
        fecha_registro: candidatoData.created_at,
        disponibilidad: candidatoData.disponibilidad,
        expectativa_salarial: candidatoData.salario
      },
      evaluacion_ia: {
        score_total: candidatoData.score_ia,
        feedback: candidatoData.feedback_ia,
        resumen_ejecutivo: candidatoData.resumen_ejecutivo,
        analisis_ia: candidatoData.analisis_ia || {},
        fecha_analisis: candidatoData.created_at
      },
      aviso_legal: {
        procesamiento_ia: 'Los datos han sido procesados mediante modelos de IA (OpenAI GPT-4o-mini) para análisis de compatibilidad',
        terceros_involucrados: [
          'OpenAI (análisis de IA)',
          'Supabase (almacenamiento)',
          'Vercel (hosting)',
          'Meta WhatsApp Cloud API (comunicaciones)'
        ],
        derecho_olvido: 'Puedes solicitar la eliminación completa de tus datos enviando un email a privacidad@shortlist.gt'
      }
    };

    try {
      await createAdminClient()
        .from('logs_privacidad')
        .insert({
          accion: 'EXPORTACION_DATOS',
          candidato_id: candidatoData.id,
          candidato_nombre: candidatoData.nombre,
          candidato_email: candidatoData.email,
          motivo: 'Solicitud de portabilidad de datos (Derecho GDPR Art. 20)',
          ip_origen: request.headers.get('x-forwarded-for') || 'unknown',
        });
    } catch {
      console.error('[Export] Privacy log write failed', { candidatoId: candidatoData.id });
    }

    // Retornar datos en formato JSON descargable
    return NextResponse.json(
      {
        success: true,
        mensaje: 'Datos exportados correctamente',
        data: exportedData
      },
      {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="shortlist-gt-datos-personales-${new Date().toISOString().split('T')[0]}.json"`,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error en exportación de datos:', error);
    return NextResponse.json(
      { error: 'Error al exportar datos' },
      { status: 500 }
    );
  }
}
