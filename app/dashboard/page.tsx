'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, Briefcase, Users, TrendingUp } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Vacante {
  id: string;
  titulo: string;
  slug: string;
  departamento?: string;
  estado: string;
  created_at: string;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    activas: 0,
    candidatos: 0,
  });

  useEffect(() => {
    fetchVacantes();
  }, []);

  const fetchVacantes = async () => {
    try {
      const { data: sessionData } = await (
        await import('@/lib/supabase').then((m) => m.supabase.auth.getSession())
      );

      if (!sessionData.session) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/vacantes', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch vacantes');

      const data = await response.json();
      setVacantes(data.vacantes || []);
      setStats({
        total: data.vacantes?.length || 0,
        activas: data.vacantes?.filter((v: any) => v.estado === 'activa').length || 0,
        candidatos: data.vacantes?.reduce((sum: number, v: any) => sum + (v._candidatos_count || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching vacantes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-zinc-400">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              SHORTLIST<span className="text-emerald-500">.GT</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Bienvenido, {user?.nombre}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Vacantes</span>
                <Briefcase className="w-5 h-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-zinc-500 mt-1">{stats.activas} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Candidatos</span>
                <Users className="w-5 h-5 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{stats.candidatos}</p>
              <p className="text-sm text-zinc-500 mt-1">En evaluación</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Conversión</span>
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">0%</p>
              <p className="text-sm text-zinc-500 mt-1">Próximamente</p>
            </CardContent>
          </Card>
        </div>

        {/* Vacantes Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Mis Vacantes</h2>
            <Link href="/dashboard/vacantes/new">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Vacante
              </Button>
            </Link>
          </div>

          {vacantes.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-4">No tienes vacantes creadas aún</p>
                <Link href="/dashboard/vacantes/new">
                  <Button>Crear Primera Vacante</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {vacantes.map((vacante) => (
                <Card key={vacante.id} className="hover:bg-zinc-800/50 transition-colors">
                  <CardContent className="pt-6">
                    <Link
                      href={`/dashboard/vacantes/${vacante.id}`}
                      className="flex items-start justify-between hover:opacity-75 transition"
                    >
                      <div>
                        <h3 className="font-semibold text-white text-lg">{vacante.titulo}</h3>
                        <div className="flex gap-3 mt-2">
                          {vacante.departamento && (
                            <span className="text-xs text-zinc-500">{vacante.departamento}</span>
                          )}
                          <span
                            className={`text-xs font-medium ${
                              vacante.estado === 'activa'
                                ? 'text-emerald-400'
                                : 'text-amber-400'
                            }`}
                          >
                            {vacante.estado}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Ver →
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
