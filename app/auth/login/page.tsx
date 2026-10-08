'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Usar la ruta API (con rate limiting en servidor)
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError('Demasiados intentos. Por favor, intenta más tarde.');
        } else {
          setError(data.error || 'Error al iniciar sesión.');
        }
        return;
      }

      // Guardar email en localStorage para el dashboard
      localStorage.setItem('reclutador_email', data.user.email);

      // El servidor ya estableció el cookie, redirigir directamente
      router.push('/dashboard/reclutador');
    } catch (err) {
      setError('Error de conexión. Intenta más tarde.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        aria-label="Volver al inicio"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Inicio
      </Link>

      <Reveal>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="text-xl" />
          <p className="text-sm text-muted-foreground">Accede a tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar sesión</CardTitle>
            <CardDescription>Ingresa con tu email y contraseña para acceder al panel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <Alert variant="destructive">{error}</Alert>}

              <Field label="Email" htmlFor="login-email" icon={<Mail />}>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                />
              </Field>

              <Field label="Contraseña" htmlFor="login-password" icon={<Lock />}>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </Field>

              <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
                Acceder
              </Button>

              <Link
                href="/auth/forgot-password"
                className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </form>

            <div className="mt-6 border-t pt-6">
              <p className="text-center text-sm text-muted-foreground">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/signup" className="font-medium text-foreground underline underline-offset-4">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 border-t pt-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">O accede sin crear cuenta</p>
              <Link href="/dashboard/demo" className="block">
                <Button variant="secondary" className="w-full">
                  Acceso rápido demo
                </Button>
              </Link>
            </div>

            <div className="mt-6 rounded-lg bg-muted p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Credenciales de prueba</p>
              <p className="text-xs text-muted-foreground tabular-nums">Email: demo@shortlist.gt</p>
              <p className="text-xs text-muted-foreground tabular-nums">Contraseña: Demo123!</p>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
