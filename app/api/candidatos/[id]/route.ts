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
    type CandidatoWithVacante = typeof candidato & {
      vacantes: Array<{ usuario_id: string }> | null;
    };
    const vacanteRelation = (candidato as CandidatoWithVacante).vacantes;
    const vacanteUsuario = Array.isArray(vacanteRelation)
      ? vacanteRelation[0]?.usuario_id
      : null;

    if (!vacanteUsuario || vacanteUsuario !== userData.user.id) {
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

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { estado } = body;
    const validEstados = ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'oferta'];

    // Validate estado is provided and is a valid value
    if (!estado || typeof estado !== 'string' || !validEstados.includes(estado)) {
      return NextResponse.json(
        {
          error: 'Invalid estado. Must be one of: ' + validEstados.join(', ')
        },
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

    type CandidatoWithVacante = typeof candidato & {
      vacantes: Array<{ usuario_id: string }> | null;
    };
    const vacanteRelation = (candidato as CandidatoWithVacante).vacantes;
    const vacanteUsuario = Array.isArray(vacanteRelation)
      ? vacanteRelation[0]?.usuario_id
      : null;

    if (!vacanteUsuario || vacanteUsuario !== userData.user.id) {
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
      console.error('[API] Database error (internal):', {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      return NextResponse.json(
        { error: 'Error al actualizar candidato. Intenta más tarde.' },
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
