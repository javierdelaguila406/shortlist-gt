import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes, timingSafeEqual } from 'crypto';
import { persistentRateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 30 requests por IP cada 15 minutos
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = await persistentRateLimit(`admin-generate-license:${ipAddress}`, 30, 900000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', success: false },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          }
        }
      );
    }

    // Verificar admin token
    const adminToken = request.headers.get('X-Admin-Token');
    const expectedToken = process.env.ADMIN_SECRET_TOKEN;

    let isValid = false;
    if (expectedToken && adminToken) {
      try {
        isValid = timingSafeEqual(
          new Uint8Array(Buffer.from(adminToken)),
          new Uint8Array(Buffer.from(expectedToken))
        );
      } catch {
        isValid = false;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Acceso no autorizado', success: false },
        { status: 403 }
      );
    }

    const { cantidad = 1 } = await request.json();

    if (cantidad < 1 || cantidad > 100) {
      return NextResponse.json(
        { error: 'Cantidad debe estar entre 1 y 100', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generar códigos únicos
    const generatedCodes = [];
    for (let i = 0; i < cantidad; i++) {
      const randomPart = randomBytes(6).toString('hex').toUpperCase();
      const timestamp = Date.now().toString(36).toUpperCase();
      const codigo = `SHORTLIST-${timestamp}-${randomPart}`;
      generatedCodes.push({
        code: codigo,
        status: 'unused',
        created_at: new Date().toISOString(),
      });
    }

    // Guardar códigos en BD
    const { data, error } = await supabase
      .from('license_codes')
      .insert(generatedCodes)
      .select();

    if (error) {
      console.error('[ADMIN] Error generating license codes:', error);
      return NextResponse.json(
        { error: 'Error al generar códigos', success: false },
        { status: 500 }
      );
    }

    console.log('[ADMIN] License codes generated:', {
      cantidad,
      generatedCodes: data?.map(c => c.code),
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `${cantidad} códigos generados exitosamente`,
      codes: data?.map(c => c.code) || [],
    });

  } catch (error) {
    console.error('[SECURITY] Critical license generation error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
