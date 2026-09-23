import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { cvObjectPath, getOwnedCandidato, ownershipError } from '@/lib/authz';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'No autorizado. Debes estar autenticado.' },
        { status: 401 }
      );
    }

    const { candidatoId } = await request.json();
    if (!candidatoId || typeof candidatoId !== 'string') {
      return NextResponse.json(
        { error: 'candidatoId es requerido' },
        { status: 400 }
      );
    }

    const owned = await getOwnedCandidato(auth.supabase, auth.user.id, candidatoId);
    if (!owned.ok) {
      const { body, init } = ownershipError(owned);
      return NextResponse.json(body, init);
    }

    const cvPath = cvObjectPath(owned.data.cv_url);
    if (cvPath) {
      try {
        const { error: deleteError } = await createAdminClient().storage.from('cvs').remove([cvPath]);
        if (deleteError) console.warn('[ELIMINAR-CANDIDATO] Failed to delete CV file');
      } catch {
        console.error('[ELIMINAR-CANDIDATO] Error deleting CV file');
      }
    }

    const { error } = await auth.supabase
      .from('candidatos')
      .delete()
      .eq('id', candidatoId);

    if (error) {
      console.error('[ELIMINAR-CANDIDATO] Error eliminando candidato:', { code: error.code });
      throw error;
    }

    console.log('[ELIMINAR-CANDIDATO] Candidato eliminado:', candidatoId);

    return NextResponse.json({
      success: true,
      message: 'Candidato eliminado exitosamente',
    });
  } catch (error) {
    console.error('[ELIMINAR-CANDIDATO] Error (internal):', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: 'Error eliminando candidato. Intenta más tarde.' },
      { status: 500 }
    );
  }
}
