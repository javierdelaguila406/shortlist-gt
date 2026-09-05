'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signUp } from '@/lib/auth';
import { User, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';

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

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp(formData.email, formData.password, formData.nombre);

      // Intentar login automático después del signup
      if (result.success) {
        setSuccess(true);
        setTimeout(async () => {
          try {
            await fetch('/api/auth/signin', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: formData.email,
                password: formData.password,
              }),
            });
            router.push('/dashboard/reclutador');
          } catch {
            router.push('/auth/login');
          }
        }, 1500);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Error al registrar. Intenta de nuevo.';

      if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        setError('Demasiados intentos. Por favor, usa "Acceso Rápido Demo" o intenta en unos minutos.');
      } else if (errorMsg.includes('already registered')) {
        setError('Este email ya está registrado. Usa "Acceso Rápido Demo" o inicia sesión.');
      } else {
        setError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <CardTitle>¡Registro Exitoso!</CardTitle>
            <CardDescription>
              Tu cuenta ha sido creada. Te redirigiremos a login en unos segundos.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            SHORTLIST<span className="text-emerald-500">.GT</span>
          </h1>
          <p className="text-zinc-400">Crea tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registrarse</CardTitle>
            <CardDescription>
              Completa el formulario para crear tu cuenta como reclutador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex gap-3 p-4 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <User className="inline w-4 h-4 mr-2" />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Contraseña
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Lock className="inline w-4 h-4 mr-2" />
                  Confirmar Contraseña
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Repite tu contraseña"
                  required
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full mt-6"
                size="lg"
              >
                Crear Cuenta
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-400">
                ¿Ya tienes cuenta?{' '}
                <Link href="/auth/login" className="text-emerald-500 hover:text-emerald-400">
                  Inicia sesión
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-xs text-zinc-500 mb-3">O prueba el demo sin registrarte</p>
              <Link href="/dashboard/demo" className="block">
                <Button variant="secondary" className="w-full">
                  🚀 Acceso Rápido Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
