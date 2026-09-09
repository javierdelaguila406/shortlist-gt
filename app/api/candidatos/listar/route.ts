import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const vacante_id = request.nextUrl.searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', candidatos: [], success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', candidatos: [], success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch candidates for this vacancy
    const { data: candidatos, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Error loading candidates:', error);
      return NextResponse.json(
        { error: 'Error al cargar candidatos', candidatos: [], success: false },
        { status: 500 }
      );
    }

    console.log('[API] Candidatos cargados:', {
      vacante_id: vacante_id,
      count: candidatos?.length || 0,
    });

    return NextResponse.json({
      success: true,
      candidatos: candidatos || [],
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', candidatos: [], success: false },
      { status: 500 }
    );
  }
}
