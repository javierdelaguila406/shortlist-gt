import { NextRequest, NextResponse } from 'next/server';

const VALID_LICENSES = {
  'FORNITURE-CITY-2024': { empresa: 'Forniture City', activo: true, maxUsers: 10 },
  'DEMO-2024': { empresa: 'Demo', activo: true, maxUsers: 5 },
  'TRIAL-2024': { empresa: 'Trial', activo: true, maxUsers: 3 },
};

export async function POST(request: NextRequest) {
  try {
    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const license = VALID_LICENSES[codigo as keyof typeof VALID_LICENSES];

    if (!license || !license.activo) {
      return NextResponse.json({ error: 'Código inválido o expirado' }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      empresa: license.empresa,
      maxUsers: license.maxUsers,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error validando licencia' }, { status: 500 });
  }
}
