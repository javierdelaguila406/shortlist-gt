import { NextRequest, NextResponse } from 'next/server';

interface License {
  tipo: 'DEMO' | 'TRIAL' | 'PREMIUM';
  empresa: string;
  activo: boolean;
  maxVacantes: number;
  maxUsers: number;
  fechaExpiracion?: string;
}

const VALID_LICENSES: Record<string, License> = {
  'DEMO-2024': {
    tipo: 'DEMO',
    empresa: 'Demo SHORTLIST',
    activo: true,
    maxVacantes: 999,
    maxUsers: 999,
  },
  'FORNITURE-CITY-2024': {
    tipo: 'PREMIUM',
    empresa: 'Forniture City',
    activo: true,
    maxVacantes: 999,
    maxUsers: 10,
    fechaExpiracion: '2025-09-08',
  },
  'TRIAL-2024': {
    tipo: 'TRIAL',
    empresa: 'Trial User',
    activo: true,
    maxVacantes: 1,
    maxUsers: 1,
    fechaExpiracion: '2026-09-15',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { codigo } = await request.json();

    if (!codigo) {
      return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
    }

    const license = VALID_LICENSES[codigo.trim().toUpperCase()];

    if (!license) {
      return NextResponse.json({
        error: 'Código de licencia inválido',
        valid: false
      }, { status: 401 });
    }

    if (!license.activo) {
      return NextResponse.json({
        error: 'Licencia desactivada',
        valid: false
      }, { status: 401 });
    }

    if (license.fechaExpiracion) {
      const hoy = new Date();
      const expira = new Date(license.fechaExpiracion);
      if (hoy > expira) {
        return NextResponse.json({
          error: 'Licencia expirada',
          valid: false
        }, { status: 401 });
      }
    }

    return NextResponse.json({
      valid: true,
      tipo: license.tipo,
      empresa: license.empresa,
      maxVacantes: license.maxVacantes,
      maxUsers: license.maxUsers,
      fechaExpiracion: license.fechaExpiracion,
    });
  } catch (error) {
    console.error('Error validando licencia:', error);
    return NextResponse.json({ error: 'Error validando licencia' }, { status: 500 });
  }
}
