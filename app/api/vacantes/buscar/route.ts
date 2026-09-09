import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID requerido' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('vacantes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.log('Vacancy not found in DB:', id);
      return NextResponse.json(
        { found: false },
        { status: 404 }
      );
    }

    return NextResponse.json({
      found: true,
      vacante: data,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { found: false },
      { status: 500 }
    );
  }
}
