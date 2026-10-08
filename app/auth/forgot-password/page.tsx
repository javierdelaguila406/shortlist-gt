'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { Mail, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al procesar la solicitud');
        return;
      }

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError('Error de conexión. Intenta más tarde.');
      console.error('Reset password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Reveal>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="text-xl" />
          <p className="text-sm text-muted-foreground">Recupera tu acceso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restablecer contraseña</CardTitle>
            <CardDescription>Ingresa tu email para recibir un enlace de recuperación</CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center gap-4 py-4 text-center">
                <CheckCircle2 className="size-10 text-success" aria-hidden="true" />
                <div>
                  <h3 className="mb-2 font-semibold">Solicitud enviada</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Si el email existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.
                  </p>
                </div>
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full">Volver al inicio de sesión</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <Alert variant="destructive">{error}</Alert>}

                <Field label="Email" htmlFor="forgot-email" icon={<Mail />}>
                  <Input
                    id="forgot-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </Field>

                <Button type="submit" isLoading={isLoading} className="w-full">
                  {isLoading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  ¿Recordaste tu contraseña?{' '}
                  <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
                    Inicia sesión
                  </Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
