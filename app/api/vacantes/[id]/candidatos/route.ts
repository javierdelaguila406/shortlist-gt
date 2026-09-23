import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante, ownershipError } from '@/lib/authz';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, id);
    if (!owned.ok) {
      const { body, init } = ownershipError(owned);
      return NextResponse.json(body, init);
    }

    const { data: candidatos, error } = await auth.supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', id)
      .order('score_total', { ascending: false });

    if (error) {
      console.error('[API] Database error (internal):', { code: error.code, timestamp: new Date().toISOString() });
      return NextResponse.json(
        { error: 'Error al obtener candidatos. Intenta más tarde.' },
        { status: 500 }
      );
    }

    const stats = {
      total: candidatos?.length || 0,
      en_whatsapp: candidatos?.filter((c) => c.score_video > 0).length || 0,
      aprobados: candidatos?.filter((c) => c.estado === 'aprobado').length || 0,
      rechazados: candidatos?.filter((c) => c.estado === 'rechazado').length || 0,
    };

    return NextResponse.json({ candidatos, stats }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidatos:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
