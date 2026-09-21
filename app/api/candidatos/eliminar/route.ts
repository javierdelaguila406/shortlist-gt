import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verificar token de autenticación
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice('Bearer '.length);

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.getUser(token);
    return error ? null : data.user?.id || null;
  } catch {
    return null;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const userId = await getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      );
    }

    const { candidatoId } = await request.json();

    if (!candidatoId) {
      return NextResponse.json(
        { error: 'candidatoId es requerido' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obtener candidato y verificar que su vacante pertenece al usuario.
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .select('cv_url, vacantes:vacante_id(usuario_id)')
      .eq('id', candidatoId)
      .single();

    if (candidatoError || !candidato) {
      return NextResponse.json(
        { error: 'Candidato no encontrado' },
        { status: 404 }
      );
    }

    const vacanteRelation = candidato.vacantes as
      | { usuario_id: string }
      | { usuario_id: string }[]
      | null;
    const ownerId = Array.isArray(vacanteRelation)
      ? vacanteRelation[0]?.usuario_id
      : vacanteRelation?.usuario_id;

    if (ownerId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (candidato.cv_url) {
      try {
        const fileName = candidato.cv_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('cvs')
            .remove([fileName]);
        }
      } catch {
        console.error('[ELIMINAR-CANDIDATO] Error borrando archivo');
      }
    }

    const { error } = await supabase
      .from('candidatos')
      .delete()
      .eq('id', candidatoId);

    if (error) {
      console.error('[ELIMINAR-CANDIDATO] Error eliminando candidato:', error);
      throw error;
    }

    console.log('[ELIMINAR-CANDIDATO] Candidato eliminado:', candidatoId);

    return NextResponse.json({
      success: true,
      message: 'Candidato eliminado exitosamente',
    });
  } catch (error) {
    console.error('[ELIMINAR-CANDIDATO] Error:', error);
    return NextResponse.json(
      {
        error: 'Error eliminando candidato',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
