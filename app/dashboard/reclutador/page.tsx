'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUp, MessageCircle, Eye, Download, Star } from 'lucide-react';
import Link from 'next/link';

interface Vacante {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string;
  estado: string;
  candidatos_count: number;
  created_at: string;
}

interface Candidato {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  vacante_id: string;
  vacante_titulo: string;
  score_cv: number | null;
  score_video: number | null;
  score_test: number | null;
  score_total: number | null;
  estado: string;
  estado_evaluacion: string;
  created_at: string;
}

export default function ReclutadorDashboard() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [selectedVacante, setSelectedVacante] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Nota: En producción, necesitarás implementar autenticación real
      // Por ahora, asumimos que el usuario está logueado

      // Fetch vacantes
      const vacantesRes = await fetch('/api/vacantes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`,
        },
      });

      if (vacantesRes.ok) {
        const data = await vacantesRes.json();
        setVacantes(data.vacantes || []);
        if (data.vacantes?.[0]) {
          setSelectedVacante(data.vacantes[0].id);
        }
      }

      // Fetch candidatos para vacante seleccionada
      if (selectedVacante) {
        const candidatosRes = await fetch(`/api/vacantes/${selectedVacante}/candidatos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('supabase_token') || ''}`,
          },
        });

        if (candidatosRes.ok) {
          const data = await candidatosRes.json();
          setCandidatos(data.candidatos || []);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error cargando datos. Verifica que estés logueado.');
    } finally {
      setIsLoading(false);
    }
  };

  const sortedCandidatos = [...candidatos].sort((a, b) => {
    const scoreA = a.score_total || a.score_cv || 0;
    const scoreB = b.score_total || b.score_cv || 0;
    return scoreB - scoreA;
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-zinc-400';
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBgColor = (score: number | null) => {
    if (!score) return 'bg-zinc-900';
    if (score >= 80) return 'bg-emerald-950';
    if (score >= 60) return 'bg-amber-950';
    return 'bg-red-950';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Reclutador</h1>
          <p className="text-zinc-400">Gestiona tus vacantes y candidatos</p>
        </div>

        {error && (
          <Card className="bg-red-950/50 border-red-800 mb-6">
            <CardContent className="pt-6">
              <p className="text-red-200">{error}</p>
              <p className="text-sm text-red-400 mt-2">
                💡 Nota: Actualmente el dashboard está en modo demo. En producción necesitarás autenticación Supabase.
              </p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400">Cargando datos...</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="candidatos" className="space-y-6">
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="candidatos">Candidatos</TabsTrigger>
              <TabsTrigger value="vacantes">Vacantes</TabsTrigger>
              <TabsTrigger value="estadisticas">Estadísticas</TabsTrigger>
            </TabsList>

            {/* TAB: CANDIDATOS */}
            <TabsContent value="candidatos" className="space-y-6">
              {vacantes.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-zinc-300 block mb-2">
                    Filtrar por vacante:
                  </label>
                  <select
                    value={selectedVacante || ''}
                    onChange={(e) => setSelectedVacante(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500"
                  >
                    {vacantes.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.titulo}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sortedCandidatos.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-zinc-400">No hay candidatos aún. Comparte el link de postulación.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {sortedCandidatos.map((candidato) => (
                    <Card key={candidato.id} className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-800/50 transition">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Nombre y Email */}
                          <div className="md:col-span-4">
                            <h3 className="font-semibold text-white text-lg">{candidato.nombre}</h3>
                            <p className="text-sm text-zinc-400">{candidato.email}</p>
                            <p className="text-sm text-zinc-500 mt-1">📱 {candidato.telefono}</p>
                          </div>

                          {/* Scores */}
                          <div className="md:col-span-5 grid grid-cols-4 gap-2">
                            {/* CV Score */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">CV</p>
                              <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_cv)} ${getScoreColor(candidato.score_cv)}`}>
                                {candidato.score_cv ? Math.round(candidato.score_cv) : '-'}
                              </div>
                            </div>

                            {/* Video Score */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Video</p>
                              <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_video)} ${getScoreColor(candidato.score_video)}`}>
                                {candidato.score_video ? Math.round(candidato.score_video) : '-'}
                              </div>
                            </div>

                            {/* Test Score */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1">Test</p>
                              <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_test)} ${getScoreColor(candidato.score_test)}`}>
                                {candidato.score_test ? Math.round(candidato.score_test) : '-'}
                              </div>
                            </div>

                            {/* Total Score */}
                            <div>
                              <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                                <Star className="w-3 h-3" /> Total
                              </p>
                              <div className={`p-2 rounded text-center font-bold text-lg ${getScoreBgColor(candidato.score_total || candidato.score_cv)} ${getScoreColor(candidato.score_total || candidato.score_cv)}`}>
                                {candidato.score_total ? Math.round(candidato.score_total) : (candidato.score_cv ? Math.round(candidato.score_cv) : '-')}
                              </div>
                            </div>
                          </div>

                          {/* Acciones */}
                          <div className="md:col-span-3 flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              title="Ver detalles del candidato"
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">Ver</span>
                            </Button>

                            <Button
                              size="sm"
                              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                              title="Enviar WhatsApp de pre-entrevista"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </Button>
                          </div>
                        </div>

                        {/* Estado de evaluación */}
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <p className="text-xs text-zinc-500">
                            Estado: <span className="text-zinc-300 font-medium">{candidato.estado_evaluacion || candidato.estado}</span>
                            {candidato.score_total && candidato.score_total >= 80 && (
                              <span className="ml-3 text-emerald-400">✓ Recomendado para entrevista</span>
                            )}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: VACANTES */}
            <TabsContent value="vacantes" className="space-y-6">
              {vacantes.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-zinc-400 mb-4">No tienes vacantes creadas.</p>
                    <Link href="/dashboard/nueva-vacante">
                      <Button className="bg-emerald-600 hover:bg-emerald-700">
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Crear Nueva Vacante
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {vacantes.map((vacante) => (
                    <Card key={vacante.id} className="bg-zinc-900/50 border-zinc-800">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <h3 className="font-semibold text-white text-lg">{vacante.titulo}</h3>
                            <p className="text-sm text-zinc-400 line-clamp-2">{vacante.descripcion}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Candidatos</p>
                            <p className="text-2xl font-bold text-emerald-400">{vacante.candidatos_count || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-500">Estado</p>
                            <p className="text-sm text-zinc-300 font-medium capitalize">{vacante.estado}</p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/postular/${vacante.slug}`;
                                navigator.clipboard.writeText(url);
                                alert('Link copiado: ' + url);
                              }}
                              title="Copiar link de postulación"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* TAB: ESTADÍSTICAS */}
            <TabsContent value="estadisticas">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Total Vacantes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-emerald-400">{vacantes.length}</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Total Candidatos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-400">{candidatos.length}</p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Score Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-amber-400">
                      {candidatos.length > 0
                        ? Math.round(
                            candidatos.reduce((sum, c) => sum + (c.score_total || c.score_cv || 0), 0) /
                              candidatos.length
                          )
                        : '-'}
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-sm">Evaluados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-violet-400">
                      {candidatos.filter((c) => c.estado_evaluacion === 'completado').length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
