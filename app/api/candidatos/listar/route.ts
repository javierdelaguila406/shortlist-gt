import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized', candidatos: [], success: false },
        { status: 401 }
      );
    }

    const vacante_id = request.nextUrl.searchParams.get('vacante_id');
    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', candidatos: [], success: false },
        { status: 400 }
      );
    }

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, vacante_id);
    if (!owned.ok) {
      return NextResponse.json(
        { error: owned.status === 403 ? 'Forbidden' : 'Vacante no encontrada', candidatos: [], success: false },
        { status: owned.status }
      );
    }

    const { data: candidatos, error } = await auth.supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', vacante_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Error loading candidates:', { code: error.code });
      return NextResponse.json(
        { error: 'Error al cargar candidatos', candidatos: [], success: false },
        { status: 500 }
      );
    }

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
