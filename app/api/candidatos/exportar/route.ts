import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceRole) {
      return NextResponse.json({ error: 'Configuración faltante' }, { status: 500 });
    }

    const token = authHeader.slice('Bearer '.length);
    const supabase = createClient(supabaseUrl, supabaseServiceRole);
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = rateLimit(`candidate-export:${userData.user.id}`, 5, 3600000);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Intenta más tarde.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) },
        }
      );
    }

    const { email, telefono } = await request.json();

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
