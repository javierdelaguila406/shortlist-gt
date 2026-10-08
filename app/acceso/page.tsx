'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { getDemoLicense, validateLicenseCode, saveUserLicense } from '@/lib/license-manager';
import { ArrowLeft, Check, CheckCircle2, KeyRound, Zap } from 'lucide-react';

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
    <div className="min-h-screen w-full bg-background px-4 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver
        </button>

        {step === 'choose' && (
          <Reveal className="flex flex-col gap-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <Logo className="text-xl" />
              <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Elige cómo deseas acceder</h1>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Card className="flex flex-col gap-4">
                <CardHeader className="border-b-0 pb-0">
                  <Zap className="mb-2 size-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="text-lg">Acceso demo</CardTitle>
                  <CardDescription>Prueba gratuita limitada</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <ul className="flex flex-col gap-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Ver plantilla de preguntas</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Crear 1 vacante máximo</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Ver 1 candidato máximo</li>
                    <li className="flex items-center gap-2 text-muted-foreground"><Check className="size-4" aria-hidden="true" />1 evaluación máximo</li>
                  </ul>
                  <Button onClick={handleDemoAccess} variant="secondary" className="mt-auto w-full">
                    Acceso demo gratuito
                  </Button>
                </CardContent>
              </Card>

              <Card className="flex flex-col gap-4">
                <CardHeader className="border-b-0 pb-0">
                  <KeyRound className="mb-2 size-5 text-muted-foreground" aria-hidden="true" />
                  <CardTitle className="text-lg">Código de licencia</CardTitle>
                  <CardDescription>Acceso premium sin límites</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pt-0">
                  <ul className="flex flex-col gap-2 text-sm">
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Vacantes ilimitadas</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Candidatos ilimitados</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Evaluaciones ilimitadas</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-success" aria-hidden="true" />Todas las funciones</li>
                  </ul>
                  <Button onClick={() => setStep('license')} className="mt-auto w-full">
                    Ingresar código
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="rounded-2xl border bg-card p-5 text-center text-sm text-muted-foreground">
              ¿No tienes código de licencia?{' '}
              <a href="mailto:nuvoratalentgt@outlook.com" className="font-medium text-foreground underline underline-offset-4">
                Contacta a ventas
              </a>
            </p>
          </Reveal>
        )}

        {step === 'license' && (
          <Reveal>
            <Card>
              <CardHeader>
                <button
                  type="button"
                  onClick={() => setStep('choose')}
                  className="mb-2 inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Volver
                </button>
                <CardTitle>Ingresar código de licencia</CardTitle>
                <CardDescription>
                  {success ? 'Licencia validada correctamente' : 'Ingresa tu código de licencia para acceder'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {success ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
                    <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
                    <h2 className="text-xl font-semibold">Acceso confirmado</h2>
                    <p className="text-sm text-muted-foreground">Redirigiendo al panel…</p>
                  </div>
                ) : (
                  <form onSubmit={handleLicenseSubmit} className="flex flex-col gap-4">
                    <Field label="Código de licencia" htmlFor="license-code">
                      <Input
                        id="license-code"
                        type="text"
                        value={codigoLicencia}
                        onChange={(e) => {
                          setCodigoLicencia(e.target.value.toUpperCase());
                          setError('');
                        }}
                        placeholder="Ej: FORNITURE-CITY-2024"
                        disabled={isValidating}
                        required
                      />
                    </Field>

                    {error && <Alert variant="destructive">{error}</Alert>}

                    <Button type="submit" isLoading={isValidating} disabled={!codigoLicencia.trim()} className="w-full">
                      Validar licencia
                    </Button>

                    <div className="flex flex-col items-center gap-3 border-t pt-5 text-center">
                      <p className="text-sm text-muted-foreground">¿No tienes un código de licencia?</p>
                      <Button type="button" variant="secondary" onClick={handleDemoAccess} className="w-full">
                        Usar acceso demo
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>
    </div>
  );
}
