import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify vacante belongs to user
    const { data: vacante } = await supabase
      .from('vacantes')
      .select('id')
      .eq('id', id)
      .eq('usuario_id', userData.user.id)
      .single();

    if (!vacante) {
      return NextResponse.json(
        { error: 'Vacante not found' },
        { status: 404 }
      );
    }

    const { data: candidatos, error } = await supabase
      .from('candidatos')
      .select('*')
      .eq('vacante_id', id)
      .order('score_total', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const stats = {
      total: candidatos?.length || 0,
      en_whatsapp: candidatos?.filter((c) => c.score_video > 0).length || 0,
      aprobados: candidatos?.filter((c) => c.estado === 'aprobado').length || 0,
      rechazados: candidatos?.filter((c) => c.estado === 'rechazado').length || 0,
    };

    return NextResponse.json(
      { candidatos, stats },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching candidatos:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
