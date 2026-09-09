import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const vacante_id = request.nextUrl.searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', candidatos: [] },
        { status: 400 }
      );
    }

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[API] Missing Supabase env vars');
      return NextResponse.json(
        { error: 'Configuración faltante', candidatos: [] },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json(
        { error: error.message, candidatos: [] },
        { status: 500 }
      );
    }

    console.log('[API] Candidatos encontrados:', data?.length || 0);
    return NextResponse.json({
      candidatos: data || [],
      vacante_id,
      count: data?.length || 0,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', candidatos: [] },
      { status: 500 }
    );
  }
}
