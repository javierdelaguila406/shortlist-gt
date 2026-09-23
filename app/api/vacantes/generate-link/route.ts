import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/supabase-server';
import { getOwnedVacante } from '@/lib/authz';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser(request);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { vacanteId } = await request.json();
    if (!vacanteId || typeof vacanteId !== 'string') {
      return NextResponse.json({ error: 'vacanteId requerido' }, { status: 400 });
    }

    const owned = await getOwnedVacante(auth.supabase, auth.user.id, vacanteId);
    if (!owned.ok) {
      return NextResponse.json(
        { error: 'Vacante no encontrada o sin permisos' },
        { status: 404 }
      );
    }
    const { titulo, descripcion, departamento } = owned.data;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://shortlist-gt.vercel.app';
    const aplicarLink = `${baseUrl}/postular/${vacanteId}`;

    const linkedInText = `
🎯 OPORTUNIDAD LABORAL

📌 ${titulo}
🏢 Departamento: ${departamento || 'Forniture City'}

${descripcion || 'Únete a nuestro equipo'}

📋 Aplica aquí: ${aplicarLink}

Comparte tu CV y datos de contacto. ¡Esperamos tu candidatura!

#Empleo #RecruitmentTech #FornitureCity
    `.trim();

    const linkedinShareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(aplicarLink)}`;

    return NextResponse.json({
      success: true,
      aplicarLink,
      linkedinShareUrl,
      linkedInText,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(aplicarLink)}`,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error generando link' }, { status: 500 });
  }
}
