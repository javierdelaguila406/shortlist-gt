import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { persistentRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { randomUUID } from 'node:crypto';
import { buildReportRows, REPORT_HEADERS, validateReportRange } from '@/lib/reporting';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });
    }

    const token = authHeader.slice('Bearer '.length);
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // RLS policies in Supabase enforce authorization
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await persistentRateLimit(`candidate-export:${userData.user.id}`, 5, 3600000);
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

      const { data: vacante } = await supabase
        .from('vacantes')
        .select('id, usuario_id, titulo')
        .eq('id', vacante_id)
        .single();

      if (!vacante) {
        return NextResponse.json({ error: 'Vacante no encontrada' }, { status: 404 });
      }

      if (vacante.usuario_id !== userData.user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

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
        action: 'READ', userId: userData.user.id, resourceId: reportId, resourceType: 'reporte',
        changes: { vacante_id, formato, desde, hasta, registros: rows.length },
      });

      console.log('[Report] Generated', {
        reportId, userId: userData.user.id, vacante_id, formato,
        startDate: desde, endDate: hasta, timestamp: new Date().toISOString(),
      });

      if (formato === 'excel') {
        const worksheet = XLSX.utils.json_to_sheet(rows, {
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
      document.text(`Candidatos - ${vacante.titulo || vacante_id}`, 10, 15);
      document.text(REPORT_HEADERS.join(' | '), 10, 25);
      rows.forEach((row, index) => {
        const pageRow = index % 28;
        if (index > 0 && pageRow === 0) {
          document.addPage();
          document.text(REPORT_HEADERS.join(' | '), 10, 15);
        }
        document.text(
          `${row.email} | ${row.nombre} | ${row.estado} | ${row.score_total} | ${row.fecha_postulacion}`,
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

    // Buscar candidato
    let candidatoData = null;

    if (email) {
      const { data } = await supabase
        .from('candidatos')
        .select('*, vacantes:vacante_id(usuario_id)')
        .eq('email', email)
        .single();
      candidatoData = data;
    } else if (telefono) {
      const { data } = await supabase
        .from('candidatos')
        .select('*, vacantes:vacante_id(usuario_id)')
        .eq('telefono', telefono)
        .single();
      candidatoData = data;
    }

    if (!candidatoData) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      );
    }

    const vacanteRelation = candidatoData.vacantes as
      | { usuario_id: string }
      | { usuario_id: string }[]
      | null;
    const ownerId = Array.isArray(vacanteRelation)
      ? vacanteRelation[0]?.usuario_id
      : vacanteRelation?.usuario_id;

    if (ownerId !== userData.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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

    // Log de exportación
    await supabase
      .from('logs_privacidad')
      .insert({
        accion: 'EXPORTACION_DATOS',
        candidato_id: candidatoData.id,
        candidato_nombre: candidatoData.nombre,
        candidato_email: candidatoData.email,
        motivo: 'Solicitud de portabilidad de datos (Derecho GDPR Art. 20)',
        ip_origen: request.headers.get('x-forwarded-for') || 'unknown',
      });

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
          'Content-Disposition': `attachment; filename="shortlist-gt-datos-personales-${candidatoData.email}-${new Date().toISOString().split('T')[0]}.json"`,
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
