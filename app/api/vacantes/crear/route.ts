import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, departamento } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: 'Título requerido', success: false },
        { status: 400 }
      );
    }

    const newId = `vacante-${Date.now()}`;

    const vacante = {
      id: newId,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      departamento: departamento || '',
      usuario_id: 'public',
      created_at: new Date().toISOString(),
    };

    const { error: insertError } = await supabase
      .from('vacantes')
      .insert([vacante]);

    if (insertError) {
      console.error('[API] Error inserting vacante:', insertError);
      return NextResponse.json(
        { error: 'Error al crear vacante', success: false },
        { status: 500 }
      );
    }

    console.log('[API] Vacante creada en Supabase:', newId);
    return NextResponse.json({
      success: true,
      vacante_id: newId,
      link: `/postular/${newId}`,
    });
  } catch (error) {
    console.error('[API] Error en crear vacante:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
