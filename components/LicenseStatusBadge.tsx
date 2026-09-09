'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserLicenseFromStorage, canCreateVacante } from '@/lib/license-manager';
import { AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface UserLicense {
  codigo: string;
  tipo: 'DEMO' | 'TRIAL' | 'PREMIUM';
  empresa: string;
  maxVacantes: number;
  vacantesCreadoras: number;
  fechaActivacion: string;
  activo: boolean;
}

export function LicenseStatusBadge() {
  const router = useRouter();
  const [license, setLicense] = useState<UserLicense | null>(null);

  useEffect(() => {
    const license = getUserLicenseFromStorage();
    setLicense(license);
  }, []);

  if (!license) {
    return (
      <button
        onClick={() => router.push('/acceso')}
        className="bg-amber-950/30 border border-amber-800/40 rounded-lg px-3 py-2 flex items-center gap-2 text-sm hover:bg-amber-950/50 transition-colors cursor-pointer"
      >
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <span className="text-amber-300">Sin licencia - Click para activar</span>
      </button>
    );
  }

  const { canCreate, remaining } = canCreateVacante(license);

  const typeColors = {
    DEMO: 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30 cursor-pointer',
    TRIAL: 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30 cursor-pointer',
    PREMIUM: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 cursor-pointer',
  };

  return (
    <button
      onClick={() => router.push('/acceso')}
      className={`border rounded-lg px-3 py-2 flex items-center gap-2 text-sm transition-colors ${typeColors[license.tipo]}`}
    >
      {canCreate ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Lock className="w-4 h-4" />
      )}
      <div className="flex flex-col gap-0.5">
        <div className="font-medium">
          {license.tipo === 'DEMO' && '🚀 Demo - Acceso Completo'}
          {license.tipo === 'TRIAL' && '⏱️ Prueba'}
          {license.tipo === 'PREMIUM' && '⭐ Premium'}
        </div>
        <div className="text-xs opacity-75">
          {license.tipo === 'TRIAL' &&
            `${remaining || 0} vacante${(remaining || 0) !== 1 ? 's' : ''} disponible${(remaining || 0) !== 1 ? 's' : ''}`}
          {license.tipo === 'PREMIUM' && `${license.empresa} - Ilimitado`}
          {license.tipo === 'DEMO' && 'Ilimitado - Sin restricciones'}
        </div>
      </div>
    </button>
  );
}
