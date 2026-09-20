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

    // Obtener usuario autenticado del header (REQUERIDO)
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[API] No authorization header provided');
      return NextResponse.json(
        { error: 'Se requiere autenticación', success: false },
        { status: 401 }
      );
    }

    let userId: string;
    let userEmail = '';

    try {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!user || authError) {
        console.error('[API] Invalid auth token:', authError);
        return NextResponse.json(
          { error: 'Token inválido', success: false },
          { status: 401 }
        );
      }

      userId = user.id;

      // Obtener email del usuario (opcional - no requerido para crear vacante)
      const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('email')
        .eq('user_id', user.id);

      if (!companyError && companies && companies.length > 0) {
        userEmail = companies[0].email;
      }
      console.log('[API] Usuario email obtenido:', userEmail || '(no encontrado)');
    } catch (authCheckError) {
      console.error('[API] Error verifying auth:', authCheckError);
      return NextResponse.json(
        { error: 'Error de autenticación', success: false },
        { status: 401 }
      );
    }

    const newId = `vacante-${Date.now()}`;

    const vacante = {
      id: newId,
      titulo: titulo.trim(),
      descripcion: descripcion || '',
      departamento: departamento || '',
      usuario_id: userId,
      estado: 'activa',
      created_at: new Date().toISOString(),
    };

    console.log('[API] STEP 1 - Preparando insert:', { id: newId, usuario_id: userId, titulo });
    console.log('[API] STEP 2 - Objeto vacante:', JSON.stringify(vacante));

    const { error: insertError, data: insertedData } = await supabase
      .from('vacantes')
      .insert([vacante])
      .select();

    console.log('[API] STEP 3 - Respuesta del insert:', { error: insertError?.message, dataLength: insertedData?.length });

    if (insertError) {
      const errorDetails = {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        fullError: JSON.stringify(insertError),
      };
      console.error('[API] ❌ ERROR inserting vacante:', errorDetails);
      return NextResponse.json(
        {
          error: 'Error al crear vacante en BD',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint,
          success: false
        },
        { status: 500 }
      );
    }

    console.log('[API] ✅ VACANTE GUARDADA EN BD:', { id: newId, insertedRows: insertedData?.length });

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
