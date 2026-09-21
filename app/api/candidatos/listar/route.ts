import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized', candidatos: [], success: false },
        { status: 401 }
      );
    }

    const token = authHeader.slice('Bearer '.length);
    const vacante_id = request.nextUrl.searchParams.get('vacante_id');

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', candidatos: [], success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', candidatos: [], success: false },
        { status: 500 }
      );
    }

    // Use anon key with RLS enforcement
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized', candidatos: [], success: false },
        { status: 401 }
      );
    }

    const { data: vacante, error: vacanteError } = await supabase
      .from('vacantes')
      .select('usuario_id')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacante) {
      return NextResponse.json(
        { error: 'Vacante no encontrada', candidatos: [], success: false },
        { status: 404 }
      );
    }

    if (vacante.usuario_id !== userData.user.id) {
      return NextResponse.json(
        { error: 'Forbidden', candidatos: [], success: false },
        { status: 403 }
      );
    }

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
