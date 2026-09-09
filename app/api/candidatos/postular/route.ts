import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { rateLimit } from '@/lib/rate-limit';
import { candidatoPostulacionSchema, pdfFileSchema } from '@/lib/validations';
import * as fs from 'fs';
import * as path from 'path';

// Use service role key for server-side operations (has full permissions)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 5 postulaciones por IP cada 15 minutos
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = rateLimit(`postular:${ipAddress}`, 5, 900000); // 15 min

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Demasiadas solicitudes. Intenta más tarde.',
          success: false
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          }
        }
      );
    }

    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cvFile = formData.get('cv') as File;

    // Validar campos requeridos
    if (!nombre || !nombre.trim()) {
      return NextResponse.json(
        { error: 'El nombre es requerido', success: false },
        { status: 400 }
      );
    }

    if (!telefono || !telefono.trim()) {
      return NextResponse.json(
        { error: 'El teléfono es requerido', success: false },
        { status: 400 }
      );
    }

    if (!vacante_id || !vacante_id.trim()) {
      return NextResponse.json(
        { error: 'La vacante es requerida', success: false },
        { status: 400 }
      );
    }

    // Validar archivo PDF
    if (!cvFile) {
      return NextResponse.json(
        { error: 'Archivo CV es requerido', success: false },
        { status: 400 }
      );
    }

    const fileValidation = pdfFileSchema.safeParse(cvFile);
    if (!fileValidation.success) {
      return NextResponse.json(
        {
          error: 'Archivo inválido. Solo PDF, máximo 5MB.',
          success: false
        },
        { status: 400 }
      );
    }

    const candidatoId = `candidato-${Date.now()}`;
    const generatedEmail = `${nombre.replace(/\s+/g, '.')}@postulacion.local`;

    const candidatoData = {
      id: candidatoId,
      vacante_id,
      nombre,
      email: generatedEmail,
      telefono,
      cv_url: null,
      cv_texto: null,
      score_cv: 0,
      score_video: 0,
      score_test: 0,
      score_total: 0,
      estado: 'pendiente',
      metadata: {
        aplicacion_fecha: new Date().toISOString(),
        archivo_nombre: cvFile.name,
        archivo_tamaño: cvFile.size,
      },
    };

    // Save to Supabase - this is the primary storage
    try {
      const { error: dbError } = await supabase
        .from('candidatos')
        .insert(candidatoData);

      if (dbError) {
        console.error('[API] Supabase save failed:', dbError);
        return NextResponse.json(
          { error: 'Error al guardar en base de datos: ' + dbError.message, success: false },
          { status: 500 }
        );
      }

      console.log('[API] Candidato guardado en Supabase:', candidatoId);
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json(
        { error: 'Error al guardar en base de datos', success: false },
        { status: 500 }
      );
    }

    // Return success only if everything worked
    return NextResponse.json(
      {
        success: true,
        candidatoId,
        candidato: {
          id: candidatoId,
          nombre,
          email: generatedEmail,
          telefono,
          estado: 'pendiente',
        },
        message: '✅ ¡Postulación recibida! Te contactaremos pronto por WhatsApp.',
      },
      { status: 201 }
    );
  } catch (error) {
    // Log interno - NUNCA expongas errores al cliente
    console.error('[SECURITY] Error in postular endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Devolver error genérico al cliente
    return NextResponse.json(
      {
        success: false,
        error: 'Ocurrió un error al procesar tu postulación. Por favor intenta más tarde.',
      },
      { status: 500 }
    );
  }
}
