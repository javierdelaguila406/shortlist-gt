import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { syncCreateVacante } from '@/lib/dual-sync';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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

    // Obtener usuario autenticado del header
    const authHeader = request.headers.get('authorization');
    let userId = 'public';
    let userEmail = '';

    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (user && !authError) {
          userId = user.id;

          // Obtener email del usuario
          const { data: company } = await supabase
            .from('companies')
            .select('email')
            .eq('user_id', user.id)
            .single();

          userEmail = company?.email || '';
        }
      } catch (authCheckError) {
        console.log('[API] Error checking auth (continuing with public):', authCheckError);
      }
    }

    const newId = `vacante-${Date.now()}`;

    const vacante = {
      id: newId,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      departamento: departamento || '',
      usuario_id: userId,
      created_at: new Date().toISOString(),
    };

    const { error: insertError, data: insertedData } = await supabase
      .from('vacantes')
      .insert([vacante]);

    if (insertError) {
      console.error('[API] Error inserting vacante:', {
        error: insertError,
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        vacante: vacante
      });
      return NextResponse.json(
        { error: 'Error al crear vacante', details: insertError.message, success: false },
        { status: 500 }
      );
    }

    console.log('[API] Vacante inserted successfully:', { id: newId, data: insertedData });

    // Sincronizar con Godaddy en background (sin bloquear respuesta)
    syncCreateVacante({
      id: newId,
      user_id: userId,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      departamento: departamento || '',
      userEmail: userEmail,
    }).catch(err => {
      console.error('[SYNC] Background sync error:', err);
    });

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
