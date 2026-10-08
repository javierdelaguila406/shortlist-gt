'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat';
import { EmptyState } from '@/components/ui/empty-state';
import { AppHeader } from '@/components/app-header';
import { Reveal } from '@/components/ui/reveal';
import { mockCandidates, mockVacantes } from '@/lib/mock-data';
import { ArrowLeft, Star, TrendingUp, Users, Briefcase, Mail, Phone, Clock3 } from 'lucide-react';

interface Candidate {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  score_ia: number;
  estado: string;
  vacante_id?: string;
  cv_url?: string;
  habilidades?: string[];
  experiencia_anos?: number;
  feedback_ia?: string;
  resumen_ejecutivo?: string;
  puntuaciones?: Record<string, number>;
}

export default function DemoDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedVacanteId, setSelectedVacanteId] = useState('demo-1');
  const [showCreateVacante, setShowCreateVacante] = useState(false);

  const getFilteredCandidates = () => {
    const allCandidates = [...mockCandidates];
    try {
      const savedPostulantes = localStorage.getItem('candidatos_postulantes') || '[]';
      const postulantes = JSON.parse(savedPostulantes);
      allCandidates.push(...postulantes);
    } catch (e) {
      console.warn('Could not load postulantes from localStorage');
    }
    return allCandidates.filter(c => c.vacante_id === selectedVacanteId);
  };

  const selectedVacante = mockVacantes.find(v => v.id === selectedVacanteId) || mockVacantes[0];
  const filteredCandidates = getFilteredCandidates();

  const stats = {
    total: filteredCandidates.length,
    precalificados: filteredCandidates.filter(c => c.estado === 'precalificado').length,
    en_evaluacion: filteredCandidates.filter(c => c.estado === 'evaluacion').length,
    promedio: Math.round(filteredCandidates.reduce((sum, c) => sum + c.score_ia, 0) / filteredCandidates.length || 0),
  };

  return (
    <div className="min-h-screen w-full">
      <AppHeader
        subtitle="Panel de reclutador · Demo"
        actions={
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="size-4" />
              Volver
            </Button>
          </Link>
        }
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 border-t px-4 py-3 sm:px-6">
          <label htmlFor="demo-vacante" className="flex items-center gap-2 text-sm font-medium">
            <Briefcase className="size-4 text-muted-foreground" aria-hidden="true" />
            Vacante
          </label>
          <select
            id="demo-vacante"
            value={selectedVacanteId}
            onChange={(e) => {
              setSelectedVacanteId(e.target.value);
              setSelectedCandidate(null);
            }}
            className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          >
            {mockVacantes.map(vacante => (
              <option key={vacante.id} value={vacante.id}>
                {vacante.titulo}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground tabular-nums">({filteredCandidates.length} candidatos)</span>
        </div>
      </AppHeader>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-16 sm:px-6">
        <Reveal className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total candidatos"
            value={stats.total}
            hint={`Para ${selectedVacante.titulo}`}
            icon={<Users />}
          />
          <StatCard label="Precalificados" value={stats.precalificados} hint="Score 80+" icon={<Star />} />
          <StatCard label="En evaluación" value={stats.en_evaluacion} hint="En proceso" icon={<TrendingUp />} />
          <StatCard label="Promedio score IA" value={stats.promedio} hint="De 100" icon={<Star />} />
        </Reveal>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="flex flex-col gap-3 lg:col-span-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Top candidatos</h2>
              <p className="text-sm text-muted-foreground">Clasificados por score IA y fit cultural</p>
            </div>

            {filteredCandidates.length === 0 ? (
              <EmptyState title="No hay candidatos para esta plaza" />
            ) : (
              filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                return (
                  <div
                    key={candidate.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    onClick={() => setSelectedCandidate(candidate)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCandidate(candidate);
                      }
                    }}
                    className="cursor-pointer rounded-2xl outline-none transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Card
                      className={`flex flex-col gap-4 transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-md ${
                        isSelected ? 'ring-1 ring-foreground' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">{candidate.nombre}</h3>
                          <p className="truncate text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-2xl font-semibold tabular-nums">{candidate.score_ia}</div>
                          <div className="text-xs text-muted-foreground">Score IA</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {candidate.habilidades?.slice(0, 3).map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))}
                        {candidate.habilidades && candidate.habilidades.length > 3 && (
                          <Badge>+{candidate.habilidades.length - 3}</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {candidate.telefono}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 className="size-3.5" aria-hidden="true" />
                          {candidate.experiencia_anos} años exp.
                        </span>
                      </div>

                      <div className="flex items-center gap-2 border-t pt-3">
                        <Badge variant={candidate.estado === 'precalificado' ? 'success' : 'warning'}>
                          {candidate.estado}
                        </Badge>
                        {candidate.estado === 'precalificado' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="ml-auto"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Enviar evaluación
                          </Button>
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </section>

          {selectedCandidate && (
            <aside className="lg:col-span-1">
              <Reveal>
                <Card className="flex flex-col gap-6 lg:sticky lg:top-40">
                  <CardHeader className="border-b-0 pb-0">
                    <CardTitle className="text-lg">{selectedCandidate.nombre}</CardTitle>
                    <CardDescription>Análisis detallado</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6 pt-0">
                    <section>
                      <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Puntuaciones por competencia
                      </h4>
                      <div className="flex flex-col gap-3">
                        {selectedCandidate.puntuaciones && Object.entries(selectedCandidate.puntuaciones).map(([key, value]) => (
                          <div key={key} className="flex flex-col gap-1.5">
                            <div className="flex justify-between text-xs">
                              <span className="capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                              <span className="font-medium tabular-nums">{value}/100</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-success" style={{ width: `${value}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Feedback IA</h4>
                      <p className="text-sm leading-relaxed text-pretty">{selectedCandidate.feedback_ia}</p>
                    </section>

                    <section>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumen ejecutivo</h4>
                      <p className="text-sm leading-relaxed text-pretty">{selectedCandidate.resumen_ejecutivo}</p>
                    </section>

                    <section>
                      <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Habilidades técnicas</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCandidate.habilidades?.map((skill) => (
                          <Badge key={skill}>{skill}</Badge>
                        ))}
                      </div>
                    </section>

                    <Button className="w-full">Ver perfil completo</Button>
                  </CardContent>
                </Card>
              </Reveal>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
