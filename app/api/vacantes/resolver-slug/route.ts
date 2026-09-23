import { NextRequest, NextResponse } from 'next/server';
import { createAnonClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const slug = request.nextUrl.searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'slug requerido', success: false },
        { status: 400 }
      );
    }

    const { data, error } = await createAnonClient()
      .rpc('get_vacante_publica', { p_id: slug })
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        success: false,
        error: 'Vacante no encontrada',
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      vacante_id: (data as { id: string }).id,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: 'Error del servidor', success: false },
      { status: 500 }
    );
  }
}
