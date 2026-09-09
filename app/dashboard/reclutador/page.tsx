'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidates, mockVacantes, mockDashboardData } from '@/lib/mock-data';
import { ProfessionalReportModal } from '@/components/ProfessionalReportModal';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { getUserLicenseFromStorage, canCreateVacante } from '@/lib/license-manager';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Star, TrendingUp, Users, Briefcase, Plus, Download, X, Copy, Link2 } from 'lucide-react';

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

interface Vacante {
  id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
  linkedinLink?: string;
  aplicarLink?: string;
}

interface UserLicense {
  codigo: string;
  tipo: 'DEMO' | 'TRIAL' | 'PREMIUM';
  maxVacantes: number;
  vacantesCreadoras: number;
  activo: boolean;
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [supabaseCandidates, setSupabaseCandidates] = useState<Candidate[]>([]);
  const [deletingVacante, setDeletingVacante] = useState<string | null>(null);

  useEffect(() => {
    const loadVacantes = async () => {
      // 1. Load mock vacantes
      let allVacantes: Vacante[] = mockVacantes as Vacante[];

      // 2. Load from localStorage
      const savedVacantes = localStorage.getItem('vacantes');
      if (savedVacantes) {
        const parsed = JSON.parse(savedVacantes);
        allVacantes = [...allVacantes, ...parsed];
      }

      // 3. Load from Supabase
      try {
        const { data, error } = await supabase
          .from('vacantes')
          .select('id, titulo, descripcion, departamento');

        if (!error && data) {
          const supabaseVacantes: Vacante[] = data.map(v => ({
            id: v.id,
            titulo: v.titulo,
            descripcion: v.descripcion,
            departamento: v.departamento,
          }));
          allVacantes = [...allVacantes, ...supabaseVacantes];
        }
      } catch (e) {
        console.error('[DASHBOARD] Error loading vacantes from Supabase:', e);
      }

      // Remove duplicates by id
      const uniqueVacantes = Array.from(new Map(allVacantes.map(v => [v.id, v])).values());
      setVacantes(uniqueVacantes);

      const license = getUserLicenseFromStorage();
      setUserLicense(license);

      // Check if coming back from postulation
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const vacanteParam = params.get('vacante');
        if (vacanteParam) {
          setSelectedVacanteId(vacanteParam);
          console.log('[DASHBOARD] Seleccionada vacante desde parámetro:', vacanteParam);
        }
      }
    };

    loadVacantes();
  }, []);

  useEffect(() => {
    const vacanteJson = JSON.stringify(vacantes);
    localStorage.setItem('vacantes', vacanteJson);
    sessionStorage.setItem('vacantes', vacanteJson);
    console.log('[Dashboard] Vacantes guardadas:', { count: vacantes.length, ids: vacantes.map(v => v.id) });
  }, [vacantes]);

  // Load candidates from Supabase when selectedVacanteId changes
  useEffect(() => {
    const loadCandidates = async () => {
      if (!selectedVacanteId) {
        setSupabaseCandidates([]);
        return;
      }

      try {
        // Use API route to load candidates (server-side with service role key)
        const response = await fetch(`/api/candidatos/listar?vacante_id=${selectedVacanteId}`);

        if (!response.ok) {
          console.warn('[DASHBOARD] API error:', response.status);
          setSupabaseCandidates([]);
          return;
        }

        const data = await response.json();
        console.log('[DASHBOARD] Candidatos desde API:', data);
        if (data.candidatos) {
          setSupabaseCandidates(data.candidatos as Candidate[]);
        }
      } catch (e) {
        console.error('[DASHBOARD] Error loading candidates:', e);
        setSupabaseCandidates([]);
      }
    };

    loadCandidates();
  }, [selectedVacanteId]);

  const getFilteredCandidates = () => {
    // Use candidates from Supabase + mock candidates
    const allCandidates = [...mockCandidates, ...supabaseCandidates];
    console.log('[DASHBOARD] Candidatos totales (mock + supabase):', allCandidates);
    return allCandidates;
  };

  const selectedVacante = useMemo(
    () => vacantes.find(v => v.id === selectedVacanteId) || vacantes[0],
    [vacantes, selectedVacanteId]
  );

  const filteredCandidates = useMemo(
    () => getFilteredCandidates(),
    [selectedVacanteId, supabaseCandidates]
  );

  const stats = useMemo(
    () => ({
      total: filteredCandidates.length,
      precalificados: filteredCandidates.filter(c => c.estado === 'precalificado').length,
      en_evaluacion: filteredCandidates.filter(c => c.estado === 'evaluacion').length,
      promedio: Math.round(filteredCandidates.reduce((sum, c) => sum + c.score_ia, 0) / filteredCandidates.length || 0),
    }),
    [filteredCandidates]
  );

  const handleCreateVacante = async () => {
    if (!newVacante.titulo.trim()) return;

    // Verificar licencia
    const license = getUserLicenseFromStorage();
    const { canCreate, reason } = canCreateVacante(license);

    if (!canCreate) {
      alert(`No puedes crear vacantes: ${reason}`);
      setShowCreateVacante(false);
      return;
    }

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

      const newVacanteData = {
        id: newId,
        titulo: newVacante.titulo,
        descripcion: newVacante.descripcion,
        departamento: newVacante.departamento,
        linkedinLink: data.linkedinShareUrl,
        aplicarLink: aplicarLink
      };

      const updatedVacantes = [...vacantes, newVacanteData];

      // Save immediately to localStorage
      localStorage.setItem('vacantes', JSON.stringify(updatedVacantes));
      sessionStorage.setItem('vacantes', JSON.stringify(updatedVacantes));

      // Also save to Supabase for cross-session access
      try {
        await supabase.from('vacantes').insert({
          id: newId,
          usuario_id: 'demo-user',
          titulo: newVacante.titulo,
          descripcion: newVacante.descripcion,
          slug: newId,
          departamento: newVacante.departamento,
          estado: 'activa'
        });
        console.log('[DASHBOARD] Vacante guardada en Supabase:', newId);
      } catch (e) {
        console.warn('[DASHBOARD] No se pudo guardar en Supabase:', e);
      }

      setVacantes(updatedVacantes);

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

  const handleDeleteVacante = async (vacanteId: string) => {
    setDeletingVacante(vacanteId);
    try {
      const response = await fetch('/api/vacantes/eliminar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacante_id: vacanteId }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error('[DELETE] Error:', data.error);
        return;
      }

      const updatedVacantes = vacantes.filter(v => v.id !== vacanteId);
      setVacantes(updatedVacantes);
      localStorage.setItem('vacantes', JSON.stringify(updatedVacantes));

      if (selectedVacanteId === vacanteId) {
        setSelectedVacanteId(updatedVacantes[0]?.id || 'demo-1');
      }

      setSelectedCandidate(null);
    } catch (error) {
      console.error('[DELETE] Error:', error);
    } finally {
      setDeletingVacante(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-800/40 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                SHORTLIST<span className="text-emerald-500">.GT</span>
              </h1>
              <p className="text-sm text-zinc-400 mt-1">Dashboard Reclutador</p>
            </div>
            <div className="flex items-center gap-4">
              <LicenseStatusBadge />
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>
              </Link>
            </div>
          </div>

          {/* Vacancy Selector & Actions */}
          <div className="flex items-center gap-3">
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

            <button
              onClick={() => setShowCreateVacante(true)}
              className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-white text-sm flex items-center gap-2 ml-2"
            >
              <Plus className="w-4 h-4" /> Crear Vacante
            </button>

            {selectedVacante?.aplicarLink && (
              <button
                onClick={() => {
                  setLinkedinData({
                    aplicarLink: selectedVacante.aplicarLink,
                    linkedInText: `Vacante: ${selectedVacante.titulo}\n\n${selectedVacante.descripcion || 'Únete a nuestro equipo'}`,
                    linkedinShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(selectedVacante.aplicarLink || '')}`,
                  });
                  setShowLinkedinLink(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded text-white text-sm flex items-center gap-2"
              >
                <Link2 className="w-4 h-4" />
                Ver Link
              </button>
            )}

            <button
              onClick={() => handleDeleteVacante(selectedVacanteId)}
              disabled={deletingVacante === selectedVacanteId}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-900 px-3 py-2 rounded text-white text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              {deletingVacante === selectedVacanteId ? 'Eliminando...' : 'Eliminar'}
            </button>

            {/* Action Buttons */}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowExportModal(true)}
                style={{
                  backgroundColor: '#16a34a',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Download className="w-4 h-4" /> Exportar Reporte
              </button>
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
                      {candidate.habilidades && candidate.habilidades.slice(0, 3).map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded">
                          {skill}
                        </span>
                      ))}
                      {candidate.habilidades && candidate.habilidades.length > 3 && (
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
                      {selectedCandidate.puntuaciones && Object.entries(selectedCandidate.puntuaciones).map(([key, value]) => (
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
                      {selectedCandidate.habilidades && selectedCandidate.habilidades.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-zinc-800 text-xs text-zinc-300 rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    className="w-full mt-4"
                    onClick={() => setShowDetailModal(true)}
                  >
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

      {/* Full Profile Modal */}
      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <div>
                <CardTitle className="text-2xl">{selectedCandidate.nombre}</CardTitle>
                <CardDescription>Perfil Completo del Candidato</CardDescription>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Contact Info */}
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Información de Contacto</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-zinc-400">Email:</span> <span className="text-white">{selectedCandidate.email}</span></p>
                  <p><span className="text-zinc-400">Teléfono:</span> <span className="text-white">{selectedCandidate.telefono}</span></p>
                  <p><span className="text-zinc-400">Experiencia:</span> <span className="text-white">{selectedCandidate.experiencia_anos} años</span></p>
                </div>
              </div>

              {/* Score Overview */}
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Score IA Detallado</h3>
                <div className="bg-zinc-800/40 rounded-lg p-4 mb-4">
                  <div className="text-4xl font-bold text-emerald-500">{selectedCandidate.score_ia}/100</div>
                  <p className="text-sm text-zinc-400 mt-1">Puntuación General</p>
                </div>
                <div className="space-y-3">
                  {selectedCandidate.puntuaciones && Object.entries(selectedCandidate.puntuaciones).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-emerald-400 font-medium">{value}/100</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Feedback */}
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Análisis IA</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {selectedCandidate.feedback_ia}
                </p>
              </div>

              {/* Executive Summary */}
              <div className="border-b border-zinc-800 pb-4">
                <h3 className="text-lg font-semibold text-white mb-3">Resumen Ejecutivo</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {selectedCandidate.resumen_ejecutivo}
                </p>
              </div>

              {/* Skills */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Habilidades</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.habilidades && selectedCandidate.habilidades.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-sm rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <Button
                onClick={() => setShowDetailModal(false)}
                className="w-full mt-6"
              >
                Cerrar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      <ProfessionalReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        vacanteTitle={selectedVacante?.titulo || 'Reporte'}
        candidates={filteredCandidates}
        company="FORNITURE CITY"
      />
    </div>
  );
}
