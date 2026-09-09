'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDemoLicense, validateLicenseCode, saveUserLicense } from '@/lib/license-manager';
import { ArrowLeft, Zap, Lock, CheckCircle, Plus } from 'lucide-react';

export default function AccesoPage() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'license'>('choose');
  const [codigoLicencia, setCodigoLicencia] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDemoAccess = () => {
    const demoLicense = getDemoLicense();
    saveUserLicense(demoLicense);
    router.push('/dashboard/reclutador');
  };

  const handleLicenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsValidating(true);

    const { valid, license, error: validationError } = await validateLicenseCode(codigoLicencia);

    if (!valid) {
      setError(validationError || 'Código inválido');
      setIsValidating(false);
      return;
    }

    if (license) {
      const userLicense = {
        codigo: codigoLicencia.trim().toUpperCase(),
        tipo: license.tipo,
        empresa: license.empresa,
        maxVacantes: license.maxVacantes,
        vacantesCreadoras: 0,
        fechaActivacion: new Date().toISOString(),
        activo: true,
      };

      saveUserLicense(userLicense);
      setSuccess(true);

      setTimeout(() => {
        router.push('/dashboard/reclutador');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-8 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        {step === 'choose' && (
          <div className="space-y-6">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white mb-2">
                SHORTLIST<span className="text-emerald-500">.GT</span>
              </h1>
              <p className="text-zinc-400">Elige cómo deseas acceder</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Demo Card */}
              <Card className="bg-blue-950/20 border-blue-800/40 cursor-pointer hover:border-blue-800/60 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-6 h-6 text-blue-400" />
                    <CardTitle>Acceso Demo</CardTitle>
                  </div>
                  <CardDescription>Gratuito y sin restricciones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">✓ Acceso completo a todas las features</p>
                    <p className="text-sm text-zinc-300">✓ Vacantes ilimitadas</p>
                    <p className="text-sm text-zinc-300">✓ Análisis IA completo</p>
                    <p className="text-sm text-zinc-300">✓ Reportes profesionales</p>
                  </div>
                  <Button onClick={handleDemoAccess} className="w-full bg-blue-600 hover:bg-blue-700">
                    Acceso Demo Gratuito
                  </Button>
                </CardContent>
              </Card>

              {/* License Card */}
              <Card className="bg-emerald-950/20 border-emerald-800/40 cursor-pointer hover:border-emerald-800/60 transition-all">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-6 h-6 text-emerald-400" />
                    <CardTitle>Código de Licencia</CardTitle>
                  </div>
                  <CardDescription>Premium o Trial</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-300">✓ Acceso Premium ilimitado</p>
                    <p className="text-sm text-zinc-300">✓ Soporte dedicado</p>
                    <p className="text-sm text-zinc-300">✓ Planes empresariales</p>
                    <p className="text-sm text-zinc-300">✓ Integración personalizada</p>
                  </div>
                  <Button
                    onClick={() => setStep('license')}
                    variant="secondary"
                    className="w-full border-emerald-800 hover:bg-emerald-800/20"
                  >
                    Ingresar Código
                  </Button>
                </CardContent>
              </Card>

              {/* Create Vacancy Card */}
              <Link href="/vacantes/crear">
                <Card className="bg-amber-950/20 border-amber-800/40 cursor-pointer hover:border-amber-800/60 transition-all h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-6 h-6 text-amber-400" />
                      <CardTitle>Crear Vacante</CardTitle>
                    </div>
                    <CardDescription>Crea una nueva posición</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-zinc-300">✓ Completa el formulario</p>
                      <p className="text-sm text-zinc-300">✓ Genera link automático</p>
                      <p className="text-sm text-zinc-300">✓ Compartir en redes</p>
                      <p className="text-sm text-zinc-300">✓ Gestionar candidatos</p>
                    </div>
                    <Button variant="secondary" className="w-full border-amber-800 hover:bg-amber-800/20">
                      Crear Nueva Vacante
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/40 rounded-lg p-6 text-center">
              <p className="text-sm text-zinc-400">
                ¿No tienes código de licencia?{' '}
                <a href="mailto:soporte@shortlist.gt" className="text-emerald-500 hover:text-emerald-400">
                  Contacta a ventas
                </a>
              </p>
            </div>
          </div>
        )}

        {step === 'license' && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <button
                onClick={() => setStep('choose')}
                className="text-zinc-400 hover:text-white mb-4"
              >
                ← Volver
              </button>
              <CardTitle>Ingresar Código de Licencia</CardTitle>
              <CardDescription>
                {success ? '¡Licencia validada correctamente!' : 'Ingresa tu código de licencia para acceder'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-white mb-2">¡Acceso Confirmado!</h3>
                  <p className="text-zinc-400 mb-6">Redirigiendo al dashboard...</p>
                </div>
              ) : (
                <form onSubmit={handleLicenseSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Código de Licencia
                    </label>
                    <input
                      type="text"
                      value={codigoLicencia}
                      onChange={(e) => {
                        setCodigoLicencia(e.target.value.toUpperCase());
                        setError('');
                      }}
                      placeholder="Ej: FORNITURE-CITY-2024"
                      className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                      disabled={isValidating}
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isValidating || !codigoLicencia.trim()}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isValidating ? 'Validando...' : 'Validar Licencia'}
                  </Button>

                  <div className="text-center pt-4 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400 mb-3">¿No tienes un código de licencia?</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleDemoAccess}
                      className="w-full"
                    >
                      Usar Acceso Demo
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
