import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug requerido', success: false },
        { status: 400 }
      );
    }

    // Usar service role key para no estar limitado por RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

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

    // 2. Si no es un ID, buscar por título
    const { data, error } = await supabase
      .from('vacantes')
      .select('id')
      .ilike('titulo', `%${slug}%`)
      .limit(1);

    if (!error && data && data.length > 0) {
      return NextResponse.json({
        success: true,
        vacante_id: data[0].id,
      });
    }

    // 3. No encontramos la vacante
    return NextResponse.json({
      success: false,
      error: 'Vacante no encontrada',
    }, { status: 404 });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
