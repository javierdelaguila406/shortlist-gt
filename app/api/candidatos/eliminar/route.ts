import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verificar token de autenticación
async function verifyAuth(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data, error } = await supabase.auth.getUser(token);
    return !error && !!data.user;
  } catch {
    return false;
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verificar autenticación
    const isAuthenticated = await verifyAuth(request);
    if (!isAuthenticated) {
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

    // Obtener candidato para borrar el CV si existe
    const { data: candidato } = await supabase
      .from('candidatos')
      .select('cv_url')
      .eq('id', candidatoId)
      .single();

    if (candidato && candidato.cv_url) {
      try {
        const fileName = candidato.cv_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('cvs')
            .remove([fileName]);
        }
      } catch (e) {
        console.error('[ELIMINAR-CANDIDATO] Error borrando CV:', e);
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
