'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Users,
  MessageSquare,
  Trophy,
  ExternalLink,
  Clock,
  DollarSign,
  Video,
  Send,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge, MedalBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadialGauge } from '@/components/ui/radial-gauge';

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
    en_whatsapp: candidatos.filter((c) => c.score_video > 0).length,
    top_performers: topCandidatos.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-zinc-400">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{vacante?.titulo}</h1>
          <p className="text-zinc-400">{vacante?.descripcion}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Total Aplicantes</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400">En WhatsApp</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.en_whatsapp}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-indigo-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Top Candidatos</p>
                  <p className="text-3xl font-bold text-white mt-2">{stats.top_performers}</p>
                </div>
                <Trophy className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Top 3 Candidates */}
          <div className="lg:col-span-1">
            <Card noPadding>
              <CardHeader className="border-b border-zinc-800">
                <CardTitle className="text-lg">Top Candidatos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0">
                  {topCandidatos.map((candidato, idx) => (
                    <button
                      key={candidato.id}
                      onClick={() => setSelectedCandidato(candidato)}
                      className={`
                        w-full text-left p-4 border-b border-zinc-800/40 transition-colors
                        ${
                          selectedCandidato?.id === candidato.id
                            ? 'bg-zinc-800/60 border-l-2 border-l-emerald-500'
                            : 'hover:bg-zinc-800/30'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <MedalBadge place={(idx + 1) as 1 | 2 | 3} />
                          </div>
                          <p className="font-semibold text-white">{candidato.nombre}</p>
                          <p className="text-xs text-zinc-500 mt-1">{candidato.telefono}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-400">
                            {Math.round(candidato.score_total)}
                          </div>
                          <p className="text-xs text-zinc-500">Score</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Badge variant="success">
                          {candidato.disponibilidad || 'N/A'}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* All Candidates */}
            <Card noPadding className="mt-6">
              <CardHeader className="border-b border-zinc-800">
                <CardTitle className="text-lg">Todos los Candidatos</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-0 max-h-96 overflow-y-auto">
                  {candidatos.map((candidato) => (
                    <button
                      key={candidato.id}
                      onClick={() => setSelectedCandidato(candidato)}
                      className={`
                        w-full text-left p-3 border-b border-zinc-800/40 transition-colors text-sm
                        ${
                          selectedCandidato?.id === candidato.id
                            ? 'bg-zinc-800/60'
                            : 'hover:bg-zinc-800/30'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-white">{candidato.nombre}</p>
                        <p className="text-emerald-400 font-semibold">
                          {Math.round(candidato.score_total)}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Candidate Details */}
          {selectedCandidato && (
            <div className="lg:col-span-2 space-y-6">
              {/* Candidate Header */}
              <Card>
                <CardHeader className="border-b border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl">{selectedCandidato.nombre}</CardTitle>
                      <CardDescription className="mt-2">
                        {selectedCandidato.telefono}
                      </CardDescription>
                    </div>
                    <Badge variant="info">{selectedCandidato.estado}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Disponibilidad</p>
                        <p className="text-sm font-semibold text-white">
                          {selectedCandidato.disponibilidad}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Expectativa Salarial</p>
                        <p className="text-sm font-semibold text-white">
                          {selectedCandidato.rango_salario}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Score Breakdown */}
              <Card>
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle>Score Total</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-6">
                    <RadialGauge
                      value={selectedCandidato.score_total}
                      max={100}
                      size="lg"
                      label="Score General"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                      <p className="text-xs text-zinc-400 mb-2">CV</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {Math.round(selectedCandidato.score_cv)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                      <p className="text-xs text-zinc-400 mb-2">Video</p>
                      <p className="text-2xl font-bold text-indigo-400">
                        {Math.round(selectedCandidato.score_video)}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-zinc-800/30 rounded-lg">
                      <p className="text-xs text-zinc-400 mb-2">Test</p>
                      <p className="text-2xl font-bold text-amber-400">
                        {Math.round(selectedCandidato.score_test)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Videos */}
              <Card>
                <CardHeader className="border-b border-zinc-800">
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Videos de Evaluación
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="aspect-video bg-zinc-800/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-zinc-800 transition-colors"
                      >
                        <Video className="w-8 h-8 text-zinc-600" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <Button size="lg" className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Agendar Entrevista
                </Button>
                <Button size="lg" variant="secondary" className="flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Hacer Oferta
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Calendar = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
