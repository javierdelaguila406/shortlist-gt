import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Configuración faltante', success: false },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Delete all candidates first
    const { error: candidatosError } = await supabase
      .from('candidatos')
      .delete()
      .neq('id', 'null');

    if (candidatosError) {
      console.error('[API] Error deleting all candidates:', candidatosError);
    }

    // Delete all vacantes
    const { error: vacantesError } = await supabase
      .from('vacantes')
      .delete()
      .neq('id', 'null');

    if (vacantesError) {
      console.error('[API] Error deleting all vacantes:', vacantesError);
      return NextResponse.json(
        { error: 'Error al limpiar vacantes', success: false },
        { status: 500 }
      );
    }

    console.log('[API] Base de datos limpiada');
    return NextResponse.json({
      success: true,
      message: 'Base de datos limpiada correctamente',
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
