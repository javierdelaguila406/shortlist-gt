'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidates, mockVacante, mockDashboardData } from '@/lib/mock-data';
import { ArrowLeft, Star, TrendingUp, Users } from 'lucide-react';

interface Candidate {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  score_ia: number;
  estado: string;
  habilidades: string[];
  experiencia_anos: number;
  feedback_ia: string;
  resumen_ejecutivo: string;
  puntuaciones: Record<string, number>;
}

export default function DemoDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              SHORTLIST<span className="text-emerald-500">.GT</span>
            </h1>
            <p className="text-sm text-zinc-400 mt-1">Demo: {mockVacante.titulo}</p>
          </div>
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Total Candidatos</span>
                <Users className="w-5 h-5 text-emerald-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{mockDashboardData.estadisticas.total_candidatos}</p>
              <p className="text-sm text-zinc-500 mt-1">Recibidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Precalificados</span>
                <Star className="w-5 h-5 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{mockDashboardData.estadisticas.precalificados}</p>
              <p className="text-sm text-zinc-500 mt-1">Score 80+</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>En Evaluación</span>
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{mockDashboardData.estadisticas.en_evaluacion}</p>
              <p className="text-sm text-zinc-500 mt-1">En proceso</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Promedio Score IA</span>
                <Star className="w-5 h-5 text-rose-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">{mockDashboardData.estadisticas.promedio_score}</p>
              <p className="text-sm text-zinc-500 mt-1">De 100</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Candidates List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 3 Candidatos</CardTitle>
                <CardDescription>Clasificados por Score IA y Fit Cultural</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidate(candidate)}
                    className="p-4 border border-zinc-700 rounded-lg hover:bg-zinc-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{candidate.nombre}</h3>
                        <p className="text-sm text-zinc-400 mt-1">{candidate.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-500">{candidate.score_ia}</div>
                        <div className="text-xs text-zinc-500">Score IA</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {candidate.habilidades.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded">
                          {skill}
                        </span>
                      ))}
                      {candidate.habilidades.length > 3 && (
                        <span className="px-2 py-1 bg-zinc-800 text-xs text-zinc-400">
                          +{candidate.habilidades.length - 3}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-zinc-400">
                      <div>📞 {candidate.telefono}</div>
                      <div>📅 {candidate.experiencia_anos} años exp.</div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-700 flex gap-2">
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        candidate.estado === 'precalificado'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {candidate.estado}
                      </span>
                      {candidate.estado === 'precalificado' && (
                        <Button size="sm" variant="secondary" className="ml-auto">
                          Contactar por WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Candidate Details */}
          {selectedCandidate && (
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle className="text-lg">{selectedCandidate.nombre}</CardTitle>
                  <CardDescription>Análisis Detallado</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Score Breakdown */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Puntuaciones por Competencia</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedCandidate.puntuaciones).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-zinc-400 capitalize">{key.replace(/_/g, ' ')}</span>
                            <span className="text-white font-medium">{value}/100</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded">
                            <div
                              className="h-full bg-emerald-500 rounded"
                              style={{ width: `${value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feedback */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Feedback IA</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedCandidate.feedback_ia}
                    </p>
                  </div>

                  {/* Resume */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Resumen Ejecutivo</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {selectedCandidate.resumen_ejecutivo}
                    </p>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-2">Habilidades Técnicas</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedCandidate.habilidades.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button className="w-full mt-4">
                    Ver Perfil Completo
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
