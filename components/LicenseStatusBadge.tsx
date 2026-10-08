'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentPlan } from '@/lib/license-manager';
import { AlertCircle, CheckCircle } from 'lucide-react';

export function LicenseStatusBadge() {
  const router = useRouter();
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    getCurrentPlan().then(setPlan);
  }, []);

  if (plan !== 'premium') {
    return (
      <button
        onClick={() => router.push('/acceso')}
        className="bg-warning-soft border border-warning/30 rounded-lg px-3 py-2 flex items-center gap-2 text-sm hover:bg-warning-soft/70 transition-colors cursor-pointer"
      >
        <AlertCircle className="w-4 h-4 text-warning" />
        <span className="text-warning">Sin licencia - Click para activar</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push('/acceso')}
      className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-soft px-3 py-2 text-sm text-brand transition-colors hover:bg-success-soft/70"
    >
      <CheckCircle className="w-4 h-4" />
      <div className="flex flex-col gap-0.5">
        <div className="font-medium">⭐ Premium</div>
        <div className="text-xs opacity-75">Ilimitado</div>
      </div>
    </button>
  );
}
