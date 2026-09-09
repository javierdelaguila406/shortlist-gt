import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, departamento } = body;

    if (!titulo?.trim()) {
      return NextResponse.json(
        { error: 'Título requerido' },
        { status: 400 }
      );
    }

    const newId = `vacante-${Date.now()}`;
    const baseUrl = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'shortlist-gt.vercel.app';
    const aplicarLink = `${baseUrl}://${host}/postular/${newId}`;

    const newVacante = {
      id: newId,
      titulo,
      descripcion: descripcion || null,
      departamento: departamento || null,
      aplicarLink,
    };

    // Use server-side Supabase with service role key
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      try {
        await supabase.from('vacantes').insert([newVacante]);
      } catch (e) {
        console.error('Supabase insert failed:', e);
      }
    }

    return NextResponse.json({
      success: true,
      newId,
      aplicarLink,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al crear vacante' },
      { status: 500 }
    );
  }
}
