// Sistema de gestión de licencias para SHORTLIST.GT

interface UserLicense {
  codigo: string;
  tipo: 'DEMO' | 'TRIAL' | 'PREMIUM';
  empresa: string;
  maxVacantes: number;
  vacantesCreadoras: number;
  fechaActivacion: string;
  activo: boolean;
}

export const LICENSE_TYPES = {
  DEMO: {
    maxVacantes: 999,
    descripcion: 'Acceso Demo - Ilimitado',
    requiresCodigo: false,
  },
  TRIAL: {
    maxVacantes: 1,
    descripcion: 'Prueba - 1 Vacante',
    requiresCodigo: true,
  },
  PREMIUM: {
    maxVacantes: 999,
    descripcion: 'Premium - Ilimitado',
    requiresCodigo: true,
  },
};

export function getUserLicenseFromStorage(): UserLicense | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem('userLicense');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch (e) {
    console.error('Error reading user license:', e);
    return null;
  }
}

export function saveUserLicense(license: UserLicense): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem('userLicense', JSON.stringify(license));
  } catch (e) {
    console.error('Error saving user license:', e);
  }
}

export function getDemoLicense(): UserLicense {
  return {
    codigo: 'DEMO-2024',
    tipo: 'DEMO',
    empresa: 'Demo SHORTLIST',
    maxVacantes: 999,
    vacantesCreadoras: 0,
    fechaActivacion: new Date().toISOString(),
    activo: true,
  };
}

export function canCreateVacante(license: UserLicense | null): {
  canCreate: boolean;
  reason?: string;
  remaining?: number;
} {
  if (!license) {
    return {
      canCreate: false,
      reason: 'Se requiere licencia válida',
    };
  }

  if (!license.activo) {
    return {
      canCreate: false,
      reason: 'Licencia inactiva',
    };
  }

  const remaining = license.maxVacantes - license.vacantesCreadoras;

  if (remaining <= 0) {
    return {
      canCreate: false,
      reason:
        license.tipo === 'TRIAL'
          ? 'Ha alcanzado el límite de 1 vacante. Contacte a ventas para actualizar.'
          : 'Ha alcanzado el límite de vacantes.',
      remaining: 0,
    };
  }

  return {
    canCreate: true,
    remaining,
  };
}

export function incrementVacanteCount(license: UserLicense): UserLicense {
  return {
    ...license,
    vacantesCreadoras: license.vacantesCreadoras + 1,
  };
}

export async function validateLicenseCode(codigo: string): Promise<{
  valid: boolean;
  license?: any;
  error?: string;
}> {
  try {
    const response = await fetch('/api/auth/validate-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: codigo.trim().toUpperCase() }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        valid: false,
        error: data.error || 'Código inválido',
      };
    }

    return {
      valid: true,
      license: data,
    };
  } catch (error) {
    console.error('Error validating license:', error);
    return {
      valid: false,
      error: 'Error al validar licencia',
    };
  }
}
