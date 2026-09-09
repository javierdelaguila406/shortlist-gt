import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const titulo = data.get('titulo') as string;
    const descripcion = data.get('descripcion') as string;
    const departamento = data.get('departamento') as string;

    if (!titulo || !titulo.trim()) {
      return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
    }

    const newId = `vacante-${Date.now()}`;
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'shortlist-gt.vercel.app';
    const baseUrl = `${proto}://${host}`;
    const aplicarLink = `${baseUrl}/postular/${newId}`;

    const newVacante = {
      id: newId,
      titulo,
      descripcion,
      departamento,
      aplicarLink,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      vacante: newVacante,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error al crear vacante' }, { status: 500 });
  }
}
