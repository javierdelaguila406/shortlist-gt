'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Eye, Star } from 'lucide-react';

interface Candidato {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  score_cv: number | null;
  score_video: number | null;
  score_test: number | null;
  score_total: number | null;
  estado_evaluacion: string;
}

export default function ReclutadorDashboard() {
  const [candidatos, setCandidatos] = useState<Candidato[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setCandidatos([
        {
          id: 'c1',
          nombre: 'Víctor Barillas',
          email: 'victor.barillas@gmail.com',
          telefono: '+502 7123 4567',
          score_cv: 93,
          score_video: null,
          score_test: null,
          score_total: null,
          estado_evaluacion: 'pendiente',
        },
        {
          id: 'c2',
          nombre: 'Sofía Morales',
          email: 'sofia.morales@gmail.com',
          telefono: '+502 7234 5678',
          score_cv: 87,
          score_video: null,
          score_test: null,
          score_total: null,
          estado_evaluacion: 'pendiente',
        },
      ]);
      setIsLoading(false);
    }, 500);
  }, []);

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

  const handleWhatsApp = async (candidatoId: string) => {
    const response = await fetch('/api/evaluaciones/iniciar-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidatoId }),
    });

    const data = await response.json();
    alert(response.ok ? `✅ ${data.message}` : `❌ Error: ${data.message}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard Reclutador</h1>
          <p className="text-zinc-400">Gestiona candidatos y envía evaluaciones</p>
        </div>

        <Card className="bg-emerald-950/30 border-emerald-800/50 mb-8">
          <CardContent className="pt-6">
            <p className="text-emerald-200">
              💡 <strong>Flujo:</strong> Haz clic en "WhatsApp" para enviar pre-entrevista. El candidato responde con videos + preguntas, y recibirás puntuación automática.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-zinc-400">Cargando candidatos...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sortedCandidatos.map((candidato) => (
              <Card key={candidato.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <h3 className="font-semibold text-white text-lg">{candidato.nombre}</h3>
                      <p className="text-sm text-zinc-400">{candidato.email}</p>
                      <p className="text-sm text-zinc-500 mt-1">📱 {candidato.telefono}</p>
                    </div>

                    <div className="md:col-span-5 grid grid-cols-4 gap-2">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">CV</p>
                        <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_cv)} ${getScoreColor(candidato.score_cv)}`}>
                          {candidato.score_cv ? Math.round(candidato.score_cv) : '-'}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Video</p>
                        <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_video)} ${getScoreColor(candidato.score_video)}`}>
                          {candidato.score_video ? Math.round(candidato.score_video) : '-'}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Test</p>
                        <div className={`p-2 rounded text-center font-bold ${getScoreBgColor(candidato.score_test)} ${getScoreColor(candidato.score_test)}`}>
                          {candidato.score_test ? Math.round(candidato.score_test) : '-'}
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1">
                          <Star className="w-3 h-3" /> Total
                        </p>
                        <div className={`p-2 rounded text-center font-bold text-lg ${getScoreBgColor(candidato.score_total || candidato.score_cv)} ${getScoreColor(candidato.score_total || candidato.score_cv)}`}>
                          {candidato.score_total ? Math.round(candidato.score_total) : (candidato.score_cv ? Math.round(candidato.score_cv) : '-')}
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-3 flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="gap-2 text-zinc-400 hover:text-white">
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      <Button
                        size="sm"
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleWhatsApp(candidato.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
