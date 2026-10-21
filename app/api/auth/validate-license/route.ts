import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { persistentRateLimit } from '@/lib/rate-limit';
import { requireUser } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: máx 5 intentos por IP cada 15 minutos
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      '127.0.0.1';
    const rateLimitResult = await persistentRateLimit(`license-validate:${ipAddress}`, 5, 900000);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados intentos. Intenta más tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 900),
          }
        }
      );
    }

    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', valid: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Buscar el código en la BD
    const { data: licenseCode, error: fetchError } = await supabase
      .from('license_codes')
      .select('*')
      .eq('code', codigo.trim().toUpperCase())
      .single();

    if (fetchError || !licenseCode) {
      return NextResponse.json({
        error: 'Código de licencia inválido',
        valid: false
      }, { status: 401 });
    }

    // Validar estado
    if (licenseCode.status === 'inactive') {
      return NextResponse.json({
        error: 'Licencia desactivada',
        valid: false
      }, { status: 401 });
    }

    if (licenseCode.status === 'used') {
      return NextResponse.json({
        error: 'Este código ya ha sido utilizado',
        valid: false
      }, { status: 401 });
    }

    // Retornar datos del código
    return NextResponse.json({
      valid: true,
      tipo: 'PREMIUM',
      empresa: 'SHORTLIST Premium',
      maxVacantes: 999,
      maxUsers: 999,
    });
  } catch (error) {
    console.error('Error validando licencia:', error);
    return NextResponse.json({ error: 'Error validando licencia', valid: false }, { status: 500 });
  }
}
