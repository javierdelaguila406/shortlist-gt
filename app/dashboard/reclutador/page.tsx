'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidates, mockVacantes, mockDashboardData } from '@/lib/mock-data';
import { ExportReportModal } from '@/components/ExportReportModal';
import { ArrowLeft, Star, TrendingUp, Users, Briefcase, Plus, Download, X, Copy, LinkIcon } from 'lucide-react';

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

interface Vacante {
  id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
  linkedinLink?: string;
}

export default function DemoDashboard() {
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedVacanteId, setSelectedVacanteId] = useState('demo-1');
  const [showCreateVacante, setShowCreateVacante] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newVacante, setNewVacante] = useState({ titulo: '', descripcion: '', departamento: '', linkedinLink: '' });
  const [vacantes, setVacantes] = useState<Vacante[]>(mockVacantes);
  const [showLinkedinLink, setShowLinkedinLink] = useState(false);
  const [linkedinData, setLinkedinData] = useState<any>(null);

  const selectedVacante = vacantes.find(v => v.id === selectedVacanteId) || vacantes[0];
  const filteredCandidates = mockCandidates.filter(c => c.vacante_id === selectedVacanteId);

  const stats = {
    total: filteredCandidates.length,
    precalificados: filteredCandidates.filter(c => c.estado === 'precalificado').length,
    en_evaluacion: filteredCandidates.filter(c => c.estado === 'evaluacion').length,
    promedio: Math.round(filteredCandidates.reduce((sum, c) => sum + c.score_ia, 0) / filteredCandidates.length || 0),
  };

  const handleCreateVacante = async () => {
    if (!newVacante.titulo.trim()) return;
    const newId = `vacante-${Date.now()}`;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shortlist-gt.vercel.app';
    const aplicarLink = `${baseUrl}/postular/${newId}`;

    try {
      const response = await fetch('/api/vacantes/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacanteId: newId,
          titulo: newVacante.titulo,
          descripcion: newVacante.descripcion,
          departamento: newVacante.departamento,
        }),
      });

      const data = await response.json();

      setVacantes([...vacantes, {
        id: newId,
        titulo: newVacante.titulo,
        descripcion: newVacante.descripcion,
        departamento: newVacante.departamento,
        linkedinLink: data.linkedinShareUrl || aplicarLink
      }]);

      setLinkedinData(data);
      setShowLinkedinLink(true);
      setShowCreateVacante(false);
      setSelectedVacanteId(newId);
      setNewVacante({ titulo: '', descripcion: '', departamento: '', linkedinLink: '' });
    } catch (error) {
      console.error('Error:', error);
      alert('Error creando vacante');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                SHORTLIST<span className="text-emerald-500">.GT</span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Dashboard Reclutador</p>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
            </Link>
          </div>

          {/* Vacancy Selector & Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Briefcase className="w-4 h-4 text-zinc-400" />
            <select
              value={selectedVacanteId}
              onChange={(e) => {
                setSelectedVacanteId(e.target.value);
                setSelectedCandidate(null);
              }}
              className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm hover:border-emerald-500 focus:outline-none focus:border-emerald-500"
            >
              {vacantes.map(vacante => (
                <option key={vacante.id} value={vacante.id}>
                  {vacante.titulo}
                </option>
              ))}
            </select>
            <span className="text-xs text-zinc-500">({filteredCandidates.length} candidatos)</span>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCreateVacante(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" /> Nueva Vacante
              </Button>
              <Button
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="w-4 h-4" /> Exportar Reporte
              </Button>
            </div>
          </div>
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
              <p className="text-3xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-zinc-500 mt-1">Para {selectedVacante.titulo}</p>
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
              <p className="text-3xl font-bold text-white">{stats.precalificados}</p>
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
              <p className="text-3xl font-bold text-white">{stats.en_evaluacion}</p>
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
              <p className="text-3xl font-bold text-white">{stats.promedio}</p>
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
                {filteredCandidates.length === 0 ? (
                  <p className="text-zinc-400 text-sm">No hay candidatos para esta plaza</p>
                ) : (
                  filteredCandidates.map((candidate) => (
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
                  ))
                )}
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

      {/* Create Vacante Modal */}
      {showCreateVacante && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Nueva Vacante</CardTitle>
              <button onClick={() => setShowCreateVacante(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Título *</label>
                <input
                  type="text"
                  placeholder="Ej: Desarrollador Senior React"
                  value={newVacante.titulo}
                  onChange={(e) => setNewVacante({ ...newVacante, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Descripción</label>
                <textarea
                  placeholder="Descripción de la posición..."
                  value={newVacante.descripcion}
                  onChange={(e) => setNewVacante({ ...newVacante, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 h-20 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Departamento</label>
                <input
                  type="text"
                  placeholder="Ej: Tecnología"
                  value={newVacante.departamento}
                  onChange={(e) => setNewVacante({ ...newVacante, departamento: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Link LinkedIn (Opcional)</label>
                <input
                  type="url"
                  placeholder="Ej: https://linkedin.com/jobs/view/123456"
                  value={newVacante.linkedinLink}
                  onChange={(e) => setNewVacante({ ...newVacante, linkedinLink: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 text-xs"
                />
                <p className="text-xs text-zinc-400 mt-1">Link de la vacante en LinkedIn para compartir</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateVacante}
                  disabled={!newVacante.titulo.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  Crear Vacante
                </Button>
                <Button onClick={() => setShowCreateVacante(false)} variant="secondary" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LinkedIn Link Modal */}
      {showLinkedinLink && linkedinData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl bg-zinc-900 border-zinc-800">
            <CardHeader className="border-b border-zinc-800">
              <CardTitle className="text-2xl">🔗 Link para LinkedIn</CardTitle>
              <CardDescription>Usa este link para compartir la vacante en LinkedIn</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-6">
                <p className="text-sm text-zinc-400 mb-3">LINK DE APLICACIÓN:</p>
                <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-3">
                  <code className="text-emerald-400 text-sm break-all flex-1">{linkedinData.aplicarLink}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(linkedinData.aplicarLink);
                      alert('Link copiado al portapapeles');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-white text-sm flex-shrink-0"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-3">TEXTO PARA LINKEDIN:</p>
                <textarea
                  value={linkedinData.linkedInText}
                  readOnly
                  rows={6}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded text-white text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(linkedinData.linkedInText + '\n\n' + linkedinData.aplicarLink);
                    alert('Texto copiado al portapapeles');
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white text-sm w-full"
                >
                  Copiar Texto + Link
                </button>
              </div>

              <div>
                <p className="text-sm text-zinc-400 mb-3">LINK DE COMPARTIR:</p>
                <a
                  href={linkedinData.linkedinShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded text-white font-medium"
                >
                  Abrir en LinkedIn
                </a>
              </div>

              <button
                onClick={() => setShowLinkedinLink(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded text-white"
              >
                Cerrar
              </button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      <ExportReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        vacanteTitle={selectedVacante?.titulo || 'Reporte'}
        candidates={filteredCandidates}
      />
    </div>
  );
}
