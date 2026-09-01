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

    const { data: candidato, error } = await supabase
      .from('candidatos')
      .select(`
        *,
        vacantes:vacante_id(usuario_id)
      `)
      .eq('id', id)
      .single();

    if (error || !candidato) {
      return NextResponse.json(
        { error: 'Candidato not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    const vacanteUsuario = (candidato as any).vacantes[0]?.usuario_id;
    if (vacanteUsuario !== userData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ candidato }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidato:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { estado } = body;

    if (!['pendiente', 'en_revision', 'aprobado', 'rechazado', 'oferta'].includes(estado)) {
      return NextResponse.json(
        { error: 'Invalid estado' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: candidato } = await supabase
      .from('candidatos')
      .select('vacantes:vacante_id(usuario_id)')
      .eq('id', id)
      .single();

    if (!candidato) {
      return NextResponse.json(
        { error: 'Candidato not found' },
        { status: 404 }
      );
    }

    const vacanteUsuario = (candidato as any).vacantes[0]?.usuario_id;
    if (vacanteUsuario !== userData.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: updated, error } = await supabase
      .from('candidatos')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { candidato: updated, message: 'Estado actualizado' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating candidato:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
