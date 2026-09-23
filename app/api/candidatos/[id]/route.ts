import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedCandidato, ownershipError } from '@/lib/authz';

const VALID_ESTADOS = ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'oferta'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const owned = await getOwnedCandidato(auth.supabase, auth.user.id, id);
    if (!owned.ok) {
      const { body, init } = ownershipError(owned);
      return NextResponse.json(body, init);
    }

    return NextResponse.json({ candidato: owned.data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching candidato:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { estado } = body;
    if (!estado || typeof estado !== 'string' || !VALID_ESTADOS.includes(estado)) {
      return NextResponse.json(
        { error: 'Invalid estado. Must be one of: ' + VALID_ESTADOS.join(', ') },
        { status: 400 }
      );
    }

    const owned = await getOwnedCandidato(auth.supabase, auth.user.id, id);
    if (!owned.ok) {
      const { body: errorBody, init } = ownershipError(owned);
      return NextResponse.json(errorBody, init);
    }

    const { data: updated, error } = await auth.supabase
      .from('candidatos')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[API] Database error (internal):', { code: error.code, timestamp: new Date().toISOString() });
      return NextResponse.json(
        { error: 'Error al actualizar candidato. Intenta más tarde.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ candidato: updated, message: 'Estado actualizado' }, { status: 200 });
  } catch (error) {
    console.error('Error updating candidato:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
