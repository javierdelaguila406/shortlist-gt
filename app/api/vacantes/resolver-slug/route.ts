import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug requerido', success: false },
        { status: 400 }
      );
    }

    // 1. Buscar por ID exacto (para IDs tipo "vacante-1234567890")
    if (slug.startsWith('vacante-')) {
      const { data, error } = await supabase
        .from('vacantes')
        .select('id')
        .eq('id', slug)
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          vacante_id: data.id,
        });
      }
    }

    // 2. Si no es un ID, buscar por título (para slugs como "contador")
    // Limpiamos el slug para comparar con título
    const { data, error } = await supabase
      .from('vacantes')
      .select('id, titulo')
      .ilike('titulo', `%${slug}%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        success: true,
        vacante_id: data[0].id,
      });
    }

    // 3. Si no encontramos nada, retornar el slug tal cual
    // (podría ser un ID que aún no existe, pero el usuario intentará postularse)
    return NextResponse.json({
      success: true,
      vacante_id: slug,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
