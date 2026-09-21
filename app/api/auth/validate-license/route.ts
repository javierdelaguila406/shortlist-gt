import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice('Bearer '.length);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', valid: false },
        { status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
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
