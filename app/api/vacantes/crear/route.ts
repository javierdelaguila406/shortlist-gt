import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { titulo, descripcion, departamento } = body;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json(
        { error: 'Título requerido' },
        { status: 400 }
      );
    }

    const newId = `vacante-${Date.now()}`;
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'shortlist-gt.vercel.app';
    const aplicarLink = `${proto}://${host}/postular/${newId}`;

    return NextResponse.json({
      success: true,
      newId,
      aplicarLink,
    });
  } catch (error) {
    console.error('POST /api/vacantes/crear error:', error);
    return NextResponse.json(
      { error: 'Error al crear vacante', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
