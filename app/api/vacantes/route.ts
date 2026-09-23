import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: vacantes, error } = await auth.supabase
      .from('vacantes')
      .select('*')
      .eq('usuario_id', auth.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] Database error (internal):', { code: error.code, timestamp: new Date().toISOString() });
      return NextResponse.json(
        { error: 'Error al obtener vacantes. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ vacantes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching vacantes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
