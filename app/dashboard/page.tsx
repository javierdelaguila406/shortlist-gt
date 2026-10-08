'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/hooks/useAuth';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/ui/stat';
import { EmptyState } from '@/components/ui/empty-state';
import { AppHeader } from '@/components/app-header';
import { Reveal } from '@/components/ui/reveal';
import { Plus, LogOut, Briefcase, Users, TrendingUp, ChevronRight } from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface Vacante {
  id: string;
  titulo: string;
  slug: string;
  departamento?: string;
  estado: string;
  created_at: string;
  _candidatos_count?: number;
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

  const fetchVacantes = useCallback(async () => {
    try {
      const response = await fetch('/api/vacantes');

      if (response.status === 401) {
        router.push('/auth/login');
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch vacantes');

      const data = await response.json();
      setVacantes(data.vacantes || []);
      setStats({
        total: data.vacantes?.length || 0,
        activas: data.vacantes?.filter((v: Vacante) => v.estado === 'activa').length || 0,
        candidatos: data.vacantes?.reduce((sum: number, v: Vacante) => sum + (v._candidatos_count || 0), 0) || 0,
      });
    } catch (error) {
      console.error('Error fetching vacantes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchVacantes();
  }, [fetchVacantes]);

  const handleLogout = async () => {
    await signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6" role="status" aria-label="Cargando panel">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border bg-muted" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-2xl border bg-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <AppHeader
        subtitle={user?.nombre ? `Bienvenido, ${user.nombre}` : undefined}
        actions={
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        }
      />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-16 sm:px-6">
        <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard
            label="Vacantes"
            value={stats.total}
            hint={`${stats.activas} activas`}
            icon={<Briefcase />}
          />
          <StatCard label="Candidatos" value={stats.candidatos} hint="En evaluación" icon={<Users />} />
          <StatCard label="Conversión" value="0%" hint="Próximamente" icon={<TrendingUp />} />
        </Reveal>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold tracking-tight">Mis vacantes</h2>
            <Link href="/dashboard/vacantes/new">
              <Button size="sm">
                <Plus className="size-4" />
                Nueva vacante
              </Button>
            </Link>
          </div>

          {vacantes.length === 0 ? (
            <EmptyState
              icon={<Briefcase />}
              title="Aún no tienes vacantes"
              description="Crea tu primera vacante para empezar a recibir candidatos."
              action={
                <Link href="/dashboard/vacantes/new">
                  <Button>Crear primera vacante</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-3">
              {vacantes.map((vacante) => (
                <Link
                  key={vacante.id}
                  href={`/dashboard/vacantes/${vacante.id}`}
                  className="group block rounded-2xl outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <Card className="flex items-center justify-between gap-4 transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-md">
                    <CardContent className="min-w-0 pt-0">
                      <h3 className="truncate text-base font-semibold">{vacante.titulo}</h3>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {vacante.departamento && <span>{vacante.departamento}</span>}
                        <span className="inline-flex items-center gap-1.5 font-medium capitalize">
                          <span
                            aria-hidden="true"
                            className={`size-1.5 rounded-full ${vacante.estado === 'activa' ? 'bg-success' : 'bg-warning'}`}
                          />
                          {vacante.estado}
                        </span>
                      </div>
                    </CardContent>
                    <span className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                      Ver <ChevronRight className="size-4" aria-hidden="true" />
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
