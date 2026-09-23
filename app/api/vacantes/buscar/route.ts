import { NextRequest, NextResponse } from 'next/server';
import { isValidUUID } from '@/lib/security-utils';
import { createAnonClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id || !(isValidUUID(id) || /^vacante-\d+$/.test(id))) {
      return NextResponse.json({ found: false }, { status: 400 });
    }

    const { data, error } = await createAnonClient()
      .rpc('get_vacante_publica', { p_id: id })
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    return NextResponse.json({ found: true, vacante: data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
