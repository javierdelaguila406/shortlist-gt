'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

export default function ReclutadorLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Para demo: usar credenciales simples
      if (email === 'reclutador@demo.com' && password === 'demo123') {
        // Guardar token en localStorage
        localStorage.setItem('reclutador_token', 'demo-token-' + Date.now());
        localStorage.setItem('reclutador_email', email);

        // Redirigir al dashboard
        router.push('/dashboard/reclutador');
        return;
      }

      setError('Email o contraseña incorrectos. Usa: reclutador@demo.com / demo123');
    } catch (err) {
      console.error('Login error:', err);
      setError('Error en el login. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Inicio
        </Link>

        <Reveal>
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Logo className="text-xl" />
            <p className="text-sm text-muted-foreground">Acceso reclutadores</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ingresa a tu cuenta</CardTitle>
              <CardDescription>Accede al panel de reclutamiento</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {error && <Alert variant="destructive">{error}</Alert>}

                <Field label="Email" htmlFor="rec-email" icon={<Mail />}>
                  <Input
                    id="rec-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </Field>

                <Field label="Contraseña" htmlFor="rec-password" icon={<Lock />}>
                  <Input
                    id="rec-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                </Field>

                <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
                  Ingresar
                </Button>
              </form>

              <div className="mt-6 rounded-lg bg-muted p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Credenciales demo</p>
                <p className="font-mono text-xs text-muted-foreground">Email: reclutador@demo.com</p>
                <p className="font-mono text-xs text-muted-foreground">Contraseña: demo123</p>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
