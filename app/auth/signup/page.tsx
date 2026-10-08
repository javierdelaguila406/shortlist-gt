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
import { User, Mail, Lock, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Force rebuild v2

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      // Usar la ruta API (con validación y rate limiting en servidor)
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError('Demasiados intentos. Por favor, intenta más tarde.');
        } else if (Array.isArray(data.details)) {
          setError(data.details[0] || data.error || 'Error al registrar.');
        } else {
          setError(data.error || 'Error al registrar.');
        }
        return;
      }

      setSuccess(true);

      // Intentar auto-login después del signup
      setTimeout(async () => {
        try {
          const loginResponse = await fetch('/api/auth/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
            }),
          });

          if (loginResponse.ok) {
            // Guardar email en localStorage para el dashboard
            localStorage.setItem('reclutador_email', formData.email);
            // El servidor ya estableció el cookie, redirigir directamente
            router.push('/dashboard/reclutador');
          } else {
            router.push('/auth/login');
          }
        } catch (err) {
          console.error('Auto-login failed:', err);
          router.push('/auth/login');
        }
      }, 1500);
    } catch (err) {
      setError('Error de conexión. Intenta más tarde.');
      console.error('Signup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Reveal className="w-full max-w-sm">
        <Card>
          <CardHeader className="items-center border-b-0 text-center">
            <CheckCircle2 className="mb-2 size-10 text-success" aria-hidden="true" />
            <CardTitle>Registro exitoso</CardTitle>
            <CardDescription>
              Tu cuenta ha sido creada. Te redirigiremos al panel en unos segundos.
            </CardDescription>
          </CardHeader>
        </Card>
      </Reveal>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <Reveal>
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="text-xl" />
          <p className="text-sm text-muted-foreground">Crea tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>Completa el formulario para crear tu cuenta como reclutador</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && <Alert variant="destructive">{error}</Alert>}

              <Field label="Nombre completo" htmlFor="signup-nombre" icon={<User />}>
                <Input
                  id="signup-nombre"
                  type="text"
                  name="nombre"
                  autoComplete="name"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  required
                />
              </Field>

              <Field label="Email" htmlFor="signup-email" icon={<Mail />}>
                <Input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </Field>

              <Field label="Contraseña" htmlFor="signup-password" icon={<Lock />} hint="Mínimo 8 caracteres">
                <Input
                  id="signup-password"
                  type="password"
                  name="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </Field>

              <Field label="Confirmar contraseña" htmlFor="signup-confirm" icon={<Lock />}>
                <Input
                  id="signup-confirm"
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repite tu contraseña"
                  required
                />
              </Field>

              <Button type="submit" isLoading={isLoading} className="mt-2 w-full">
                Crear cuenta
              </Button>
            </form>

            <div className="mt-6 border-t pt-6">
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="font-medium text-foreground underline underline-offset-4">
                  Inicia sesión
                </Link>
              </p>
            </div>

            <div className="mt-6 border-t pt-6">
              <p className="mb-3 text-center text-xs text-muted-foreground">O prueba el demo sin registrarte</p>
              <Link href="/dashboard/demo" className="block">
                <Button variant="secondary" className="w-full">
                  Acceso rápido demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
