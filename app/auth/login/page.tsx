'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, AlertCircle } from 'lucide-react';

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
      localStorage.setItem('reclutador_token', data.session.access_token);

      // El servidor ya estableció el cookie, redirigir directamente
      router.push('/dashboard/reclutador');
    } catch (err: any) {
      setError('Error de conexión. Intenta más tarde.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            SHORTLIST<span className="text-emerald-500">.GT</span>
          </h1>
          <p className="text-zinc-400">Accede a tu cuenta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa con tu email y contraseña para acceder al dashboard
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
                  <Mail className="inline w-4 h-4 mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full mt-6"
                size="lg"
              >
                Acceder
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-sm text-zinc-400">
                ¿No tienes cuenta?{' '}
                <Link href="/auth/signup" className="text-emerald-500 hover:text-emerald-400">
                  Regístrate aquí
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-center text-xs text-zinc-500 mb-3">O accede sin crear cuenta</p>
              <Link href="/dashboard/demo" className="block">
                <Button variant="secondary" className="w-full">
                  🚀 Acceso Rápido Demo
                </Button>
              </Link>
            </div>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/40">
              <p className="text-xs text-zinc-500 mb-2">Credenciales de prueba:</p>
              <p className="text-xs text-zinc-400">Email: demo@shortlist.gt</p>
              <p className="text-xs text-zinc-400">Contraseña: Demo123!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
