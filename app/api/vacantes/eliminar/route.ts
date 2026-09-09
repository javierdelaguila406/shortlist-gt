import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { vacante_id } = body;

    if (!vacante_id) {
      return NextResponse.json(
        { error: 'vacante_id requerido', success: false },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all candidates for this vacancy first
    const { error: candidatosError } = await supabase
      .from('candidatos')
      .delete()
      .eq('vacante_id', vacante_id);

    if (candidatosError) {
      console.error('[API] Error deleting candidates:', candidatosError);
      return NextResponse.json(
        { error: 'Error al eliminar candidatos', success: false },
        { status: 500 }
      );
    }

    // Delete the vacancy
    const { error: vacantesError } = await supabase
      .from('vacantes')
      .delete()
      .eq('id', vacante_id);

    if (vacantesError) {
      console.error('[API] Error deleting vacancy:', vacantesError);
      return NextResponse.json(
        { error: 'Error al eliminar vacante', success: false },
        { status: 500 }
      );
    }

    console.log('[API] Vacante eliminada:', vacante_id);
    return NextResponse.json({
      success: true,
      message: 'Vacante eliminada correctamente',
      vacante_id,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
