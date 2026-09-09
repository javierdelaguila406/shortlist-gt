import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const nombre = formData.get('nombre') as string;
    const telefono = formData.get('telefono') as string;
    const vacante_id = formData.get('vacante_id') as string;
    const cv = formData.get('cv') as File;

    if (!nombre || !telefono || !vacante_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos', success: false },
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

    // Verify vacante exists
    const { data: vacanteData, error: vacanteError } = await supabase
      .from('vacantes')
      .select('id')
      .eq('id', vacante_id)
      .single();

    if (vacanteError || !vacanteData) {
      console.error('[API] Vacante not found:', vacante_id);
      return NextResponse.json(
        { error: 'Vacante no encontrada', success: false },
        { status: 404 }
      );
    }

    // Generate email from nombre if not provided
    const email = `${nombre.toLowerCase().replace(/\s+/g, '.')}@candidate.shortlist.gt`;

    // Generate unique candidate ID
    const candidato_id = `candidato-${Date.now()}`;

    // Create candidate in Supabase
    const { data: candidato, error: candidatoError } = await supabase
      .from('candidatos')
      .insert({
        id: candidato_id,
        vacante_id: vacante_id,
        nombre: nombre,
        email: email,
        telefono: telefono,
        estado: 'pendiente',
        score_ia: 0,
      })
      .select()
      .single();

    if (candidatoError) {
      console.error('[API] Error creating candidate:', candidatoError);
      return NextResponse.json(
        { error: `Error al guardar candidato: ${candidatoError.message}`, success: false },
        { status: 500 }
      );
    }

    console.log('[API] Candidato creado:', {
      candidatoId: candidato.id,
      vacante_id: vacante_id,
      nombre: nombre,
    });

    return NextResponse.json({
      success: true,
      candidatoId: candidato.id,
      candidato: {
        id: candidato.id,
        email: email,
      },
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
