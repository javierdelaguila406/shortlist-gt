'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            SHORTLIST<span className="text-emerald-500">.GT</span>
          </h1>
          <p className="text-zinc-400">Acceso Reclutadores</p>
        </div>

        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle>Ingresa a tu cuenta</CardTitle>
            <CardDescription>Accede al dashboard de reclutamiento</CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="bg-red-950/50 border border-red-800 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700"
              >
                Ingresar
              </Button>
            </form>

            {/* Demo credentials */}
            <div className="mt-6 p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
              <p className="text-xs text-emerald-200 mb-2">
                <strong>🔓 Credenciales Demo:</strong>
              </p>
              <p className="text-xs text-emerald-300 font-mono">
                Email: reclutador@demo.com
              </p>
              <p className="text-xs text-emerald-300 font-mono">
                Contraseña: demo123
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/" className="text-sm text-zinc-400 hover:text-white transition">
                ← Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
