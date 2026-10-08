'use client';

import { useState, useEffect } from 'react';
import { ExportReportModal } from '@/components/ExportReportModal';
import { useParams } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Trophy,
  Clock,
  DollarSign,
  Video,
  Send,
  CalendarDays,
  Loader,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, MedalBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadialGauge } from '@/components/ui/radial-gauge';
import { StatCard } from '@/components/ui/stat';
import { AppHeader } from '@/components/app-header';
import { Reveal } from '@/components/ui/reveal';
import { cn } from '@/lib/utils';

interface Candidato {
  id: string;
  nombre: string;
  telefono: string;
  score_total: number;
  score_cv: number;
  score_video: number;
  score_test: number;
  disponibilidad?: string;
  rango_salario?: string;
  estado: string;
}

interface Vacante {
  id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
  salario_minimo?: number;
  salario_maximo?: number;
}

export default function VacantePage() {
  const params = useParams();
  const vacantId = params.id as string;

  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [selectedCandidato, setSelectedCandidato] = useState<Candidato | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch vacancy and candidates
    const fetchData = async () => {
      try {
        // Mock data for now
        const mockVacante: Vacante = {
          id: vacantId,
          titulo: 'Senior React Developer',
          descripcion: 'Buscamos un desarrollador React con experiencia en Next.js',
          departamento: 'Desarrollo',
          salario_minimo: 35000,
          salario_maximo: 50000,
        };

        const mockCandidatos: Candidato[] = [
          {
            id: '1',
            nombre: 'Juan Pérez',
            telefono: '+502 7123 4567',
            score_total: 95,
            score_cv: 92,
            score_video: 98,
            score_test: 95,
            disponibilidad: 'Inmediata',
            rango_salario: 'Q 45,000 - Q 50,000',
            estado: 'en_revision',
          },
          {
            id: '2',
            nombre: 'María García',
            telefono: '+502 7234 5678',
            score_total: 87,
            score_cv: 89,
            score_video: 85,
            score_test: 87,
            disponibilidad: '2 Semanas',
            rango_salario: 'Q 40,000 - Q 48,000',
            estado: 'en_revision',
          },
          {
            id: '3',
            nombre: 'Carlos López',
            telefono: '+502 7345 6789',
            score_total: 78,
            score_cv: 80,
            score_video: 75,
            score_test: 79,
            disponibilidad: '1 Mes',
            rango_salario: 'Q 35,000 - Q 42,000',
            estado: 'pendiente',
          },
        ];

        setVacante(mockVacante);
        setCandidatos(mockCandidatos.sort((a, b) => b.score_total - a.score_total));
        setSelectedCandidato(mockCandidatos[0]);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [vacantId]);

  const topCandidatos = candidatos.slice(0, 3);
  const stats = {
    total: candidatos.length,
    evaluados: candidatos.filter((c) => c.estado === 'evaluado').length,
    top_performers: topCandidatos.length,
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader className="size-6 animate-spin" aria-hidden="true" />
          <p className="text-sm">Cargando datos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <AppHeader subtitle="Detalle de vacante" />

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-16 sm:px-6">
        <Reveal className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{vacante?.titulo}</h1>
          <p className="text-muted-foreground text-pretty">{vacante?.descripcion}</p>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total aplicantes" value={stats.total} icon={<Users />} />
          <StatCard label="Con prueba completada" value={stats.evaluados} icon={<MessageSquare />} />
          <StatCard label="Top candidatos" value={stats.top_performers} icon={<Trophy />} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:col-span-1">
            <Card noPadding>
              <CardHeader className="border-b px-4 py-4 sm:px-5">
                <CardTitle className="text-base">Top candidatos</CardTitle>
              </CardHeader>
              <div className="flex flex-col">
                {topCandidatos.map((candidato, idx) => {
                  const isSelected = selectedCandidato?.id === candidato.id;
                  return (
                    <button
                      type="button"
                      key={candidato.id}
                      onClick={() => setSelectedCandidato(candidato)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex flex-col gap-3 border-b p-4 text-left transition-colors outline-none last:border-b-0 focus-visible:bg-muted',
                        isSelected ? 'bg-muted' : 'hover:bg-muted/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-2">
                          <MedalBadge place={(idx + 1) as 1 | 2 | 3} />
                          <p className="truncate font-semibold">{candidato.nombre}</p>
                          <p className="text-xs text-muted-foreground tabular-nums">{candidato.telefono}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-semibold tabular-nums">{Math.round(candidato.score_total)}</div>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                      <div>
                        <Badge variant="success">{candidato.disponibilidad || 'N/A'}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card noPadding>
              <CardHeader className="border-b px-4 py-4 sm:px-5">
                <CardTitle className="text-base">Todos los candidatos</CardTitle>
              </CardHeader>
              <div className="flex max-h-96 flex-col overflow-y-auto">
                {candidatos.map((candidato) => {
                  const isSelected = selectedCandidato?.id === candidato.id;
                  return (
                    <button
                      type="button"
                      key={candidato.id}
                      onClick={() => setSelectedCandidato(candidato)}
                      aria-pressed={isSelected}
                      className={cn(
                        'flex items-center justify-between gap-3 border-b px-4 py-3 text-left text-sm transition-colors outline-none last:border-b-0 focus-visible:bg-muted',
                        isSelected ? 'bg-muted' : 'hover:bg-muted/60'
                      )}
                    >
                      <span className="truncate font-medium">{candidato.nombre}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{Math.round(candidato.score_total)}</span>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {selectedCandidato && (
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-2xl">{selectedCandidato.nombre}</CardTitle>
                      <CardDescription className="mt-1">{selectedCandidato.telefono}</CardDescription>
                    </div>
                    <Badge variant="info">{selectedCandidato.estado}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-center gap-3">
                      <Clock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-muted-foreground">Disponibilidad</p>
                        <p className="text-sm font-medium">{selectedCandidato.disponibilidad}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div>
                        <p className="text-xs text-muted-foreground">Expectativa salarial</p>
                        <p className="text-sm font-medium tabular-nums">{selectedCandidato.rango_salario}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="text-lg">Score total</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-6">
                  <div className="flex justify-center">
                    <RadialGauge value={selectedCandidato.score_total} max={100} size="lg" label="Score general" />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-muted/50 p-4 text-center">
                      <p className="mb-2 text-xs text-muted-foreground">CV</p>
                      <p className="text-2xl font-semibold tabular-nums">{Math.round(selectedCandidato.score_cv)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4 text-center">
                      <p className="mb-2 text-xs text-muted-foreground">Video</p>
                      <p className="text-2xl font-semibold tabular-nums">{Math.round(selectedCandidato.score_video)}</p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-4 text-center">
                      <p className="mb-2 text-xs text-muted-foreground">Test</p>
                      <p className="text-2xl font-semibold tabular-nums">{Math.round(selectedCandidato.score_test)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="size-5 text-muted-foreground" aria-hidden="true" />
                    Videos de evaluación
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-5">
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex aspect-video items-center justify-center rounded-xl border border-dashed bg-muted/40"
                      >
                        <Video className="size-8 text-muted-foreground" aria-hidden="true" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button size="lg" className="w-full">
                  <CalendarDays className="size-4" />
                  Agendar entrevista
                </Button>
                <Button size="lg" variant="secondary" className="w-full">
                  <Send className="size-4" />
                  Hacer oferta
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
