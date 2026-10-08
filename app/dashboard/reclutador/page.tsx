'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCard } from '@/components/ui/stat';
import { Field, Input, selectClass, textareaClass } from '@/components/ui/field';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { AppHeader } from '@/components/app-header';
import { Reveal } from '@/components/ui/reveal';
import { ProfessionalReportModal } from '@/components/ProfessionalReportModal';
import { LicenseStatusBadge } from '@/components/LicenseStatusBadge';
import { TEMPLATES_PREGUNTAS } from '@/lib/templates-preguntas';
import { cn } from '@/lib/utils';
import { getPostulationPath } from '@/lib/ui';
import { ArrowLeft, Star, TrendingUp, Users, Briefcase, Plus, Download, Link2, Sparkles, FileText, Lock, Loader, Mail, Smartphone, Copy, ClipboardList, CalendarDays, Phone, Send, Share2, MessageSquare, FlaskConical, Video } from 'lucide-react';

interface Candidate {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  score_ia: number;
  score_test?: number | null;
  cv_evaluado?: boolean;
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
  const [selectedVacanteId, setSelectedVacanteId] = useState('');
  const [showCreateVacante, setShowCreateVacante] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [newVacante, setNewVacante] = useState({ titulo: '', descripcion: '', departamento: '', linkedinLink: '' });
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [showLinkedinLink, setShowLinkedinLink] = useState(false);
  const [linkedinData, setLinkedinData] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [userLicense, setUserLicense] = useState<UserLicense | null>(null);
  const [supabaseCandidates, setSupabaseCandidates] = useState<Candidate[]>([]);
  const [deletingVacante, setDeletingVacante] = useState<string | null>(null);
  const [generandoPreguntas, setGenerandoPreguntas] = useState(false);
  const [preguntasGeneradas, setPreguntasGeneradas] = useState<any>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [asignandoTemplate, setAsignandoTemplate] = useState(false);
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<any>(null);
  const [editandoPreguntas, setEditandoPreguntas] = useState<any>(null);
  const [guardandoPreguntas, setGuardandoPreguntas] = useState(false);
  const [vacantesLoading, setVacantesLoading] = useState(true);
  const [vacantesError, setVacantesError] = useState<string | null>(null);
  const [vacantesRetry, setVacantesRetry] = useState(0);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState<string | null>(null);
  const [candidatesRefresh, setCandidatesRefresh] = useState(0);
  const [evaluacionEnviada, setEvaluacionEnviada] = useState<{ link: string; expira_en: string; nombre: string; email: string } | null>(null);
  const [enviandoEvaluacion, setEnviandoEvaluacion] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setShowCreateVacante(false);
      setShowLinkedinLink(false);
      setShowDetailModal(false);
      setShowTemplateModal(false);
      setShowExportModal(false);
      setEvaluacionEnviada(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, []);

  useEffect(() => {
    const loadVacantes = async () => {
      setVacantesLoading(true);
      setVacantesError(null);
      // Only load from Supabase (no mock data)
      let allVacantes: Vacante[] = [];

      try {
        const response = await fetch('/api/vacantes');
        if (!response.ok) throw new Error(`Error ${response.status} al cargar las vacantes`);
        const data = await response.json();
        allVacantes = ((data.vacantes || []) as Array<Vacante & { estado?: string }>)
          .filter(v => v.estado !== 'cerrada')
          .map(v => ({
            id: v.id,
            titulo: v.titulo,
            descripcion: v.descripcion,
            departamento: v.departamento,
          }));
      } catch (e) {
        console.error('[DASHBOARD] Error loading vacantes from Supabase:', e);
        setVacantesError(e instanceof Error ? e.message : 'No se pudieron cargar las vacantes');
      }

      // Remove duplicates by id
      const uniqueVacantes = Array.from(new Map(allVacantes.map(v => [v.id, v])).values());
      setVacantes(uniqueVacantes);
      setSelectedVacanteId(current =>
        uniqueVacantes.some(v => v.id === current) ? current : uniqueVacantes[0]?.id || ''
      );

      try {
        const planResponse = await fetch('/api/auth/check-plan');
        if (planResponse.ok) {
          const company = await planResponse.json();
          if (company?.plan) {
            // Map plan to legacy license format for compatibility
            const planType = company.plan === 'premium' ? 'PREMIUM' : 'DEMO';
            setUserLicense({
              codigo: planType,
              tipo: planType as 'DEMO' | 'TRIAL' | 'PREMIUM',
              maxVacantes: planType === 'PREMIUM' ? 999 : 1,
              vacantesCreadoras: 0,
              activo: true,
            });
            console.log('[DASHBOARD] Plan cargado desde BD:', planType);
          }
        }
      } catch (e) {
        console.error('[DASHBOARD] Error loading user plan:', e);
        // Fallback to DEMO if error
        setUserLicense({
          codigo: 'DEMO',
          tipo: 'DEMO',
          maxVacantes: 1,
          vacantesCreadoras: 0,
          activo: true,
        });
      }

      // Check if coming back from postulation
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const vacanteParam = params.get('vacante');
        if (vacanteParam) {
          setSelectedVacanteId(vacanteParam);
          console.log('[DASHBOARD] Seleccionada vacante desde parámetro:', vacanteParam);
        }
      }
      setVacantesLoading(false);
    };

    loadVacantes();
  }, [vacantesRetry]);

  // Load candidates from Supabase when selectedVacanteId changes
  useEffect(() => {
    const loadCandidates = async () => {
      if (!selectedVacanteId) {
        setSupabaseCandidates([]);
        return;
      }

      setCandidatesLoading(true);
      setCandidatesError(null);

      try {
        // Use API route to load candidates (server-side with service role key)
        const response = await fetch(`/api/candidatos/listar?vacante_id=${selectedVacanteId}`);

        if (!response.ok) {
          const details = `Error ${response.status} al cargar candidatos`;
          console.warn('[DASHBOARD] API error:', response.status);
          setSupabaseCandidates([]);
          setCandidatesError(details);
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
        setCandidatesError(e instanceof Error ? e.message : 'No se pudieron cargar los candidatos');
      } finally {
        setCandidatesLoading(false);
      }
    };

    loadCandidates();
  }, [selectedVacanteId, candidatesRefresh]);

  const handleEnviarEvaluacion = async (candidate: Candidate) => {
    setEnviandoEvaluacion(candidate.id);
    try {
      const response = await fetch('/api/evaluaciones/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidatoId: candidate.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.link) {
        setEvaluacionEnviada({ link: data.link, expira_en: data.expira_en, nombre: candidate.nombre, email: candidate.email });
        setCandidatesRefresh(value => value + 1);
      } else {
        toast.error(data.error || 'No se pudo generar la evaluación');
      }
    } catch {
      toast.error('No se pudo generar la evaluación. Revisa tu conexión.');
    } finally {
      setEnviandoEvaluacion(null);
    }
  };

  const getFilteredCandidates = () => {
    // Use only Supabase candidates (no mock data)
    console.log('[DASHBOARD] Candidatos desde Supabase:', supabaseCandidates.length);
    return supabaseCandidates;
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

    try {
      const createResponse = await fetch('/api/vacantes/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: newVacante.titulo,
          descripcion: newVacante.descripcion,
          departamento: newVacante.departamento,
        }),
      });
      const created = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok || !created.success) {
        toast.error(created.error || 'No se pudo crear la vacante');
        return;
      }
      const newId: string = created.vacante_id;

      const linkResponse = await fetch('/api/vacantes/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacanteId: newId }),
      });
      const data = linkResponse.ok ? await linkResponse.json() : null;

      setVacantesRetry(value => value + 1);
      setSelectedVacanteId(newId);
      setShowCreateVacante(false);
      setNewVacante({ titulo: '', descripcion: '', departamento: '', linkedinLink: '' });
      if (data) {
        setLinkedinData(data);
        setShowLinkedinLink(true);
      } else {
        toast.warning('Vacante creada, pero no se pudo generar el enlace. Inténtalo desde "Ver link".');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error creando vacante');
    }
  };

  const handleDeleteVacante = async (vacanteId: string) => {
    const vacante = vacantes.find(v => v.id === vacanteId);
    if (!window.confirm(`¿Cerrar la plaza "${vacante?.titulo || 'Sin título'}"?\n\n✓ El enlace de aplicación será bloqueado\n✓ Podrás consultarla en el historial\n✗ No podrás recibir más aplicaciones para esta plaza`)) {
      return;
    }

    setDeletingVacante(vacanteId);

    try {
      const response = await fetch(`/api/vacantes/${encodeURIComponent(vacanteId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'cerrada' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Error ${response.status}`);
      }

      const updatedVacantes = vacantes.filter(v => v.id !== vacanteId);
      setVacantes(updatedVacantes);

      if (selectedVacanteId === vacanteId) {
        setSelectedVacanteId(updatedVacantes[0]?.id || '');
      }

      setSelectedCandidate(null);

      // Mostrar éxito con detalles
      toast.success('Plaza cerrada', { description: `${vacante?.titulo || 'Sin título'}: enlace bloqueado, historial conservado` });

      console.log('[CERRAR-VACANTE] Plaza cerrada exitosamente:', {
        vacanteId,
        titulo: vacante?.titulo
      });
    } catch (error) {
      console.error('[CERRAR-VACANTE] Error:', error);
      toast.error('Error cerrando la plaza', { description: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setDeletingVacante(null);
    }
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/evaluaciones/asignar-template');
      const data = await response.json();
      if (data.categorias) {
        setTemplates(data.categorias);
      }
    } catch (error) {
      console.error('[TEMPLATES] Error loading:', error);
    }
  };

  const handlePreviewTemplate = (categoriaId: string) => {
    const template = templates.find(t => t.id === categoriaId);
    if (template) {
      // Obtener el template completo con todas las preguntas
      const fullTemplate = TEMPLATES_PREGUNTAS[categoriaId];
      if (fullTemplate) {
        setSelectedTemplatePreview({
          id: categoriaId,
          nombre: fullTemplate.nombre,
          pre_entrevista: JSON.parse(JSON.stringify(fullTemplate.pre_entrevista)),
          prueba_tecnica: JSON.parse(JSON.stringify(fullTemplate.prueba_tecnica)),
          preguntas_video: JSON.parse(JSON.stringify(fullTemplate.preguntas_video)),
        });
        setEditandoPreguntas({
          pre_entrevista: JSON.parse(JSON.stringify(fullTemplate.pre_entrevista)),
          prueba_tecnica: JSON.parse(JSON.stringify(fullTemplate.prueba_tecnica)),
          preguntas_video: JSON.parse(JSON.stringify(fullTemplate.preguntas_video)),
        });
      }
    }
  };

  const guardarYAsignarTemplate = async () => {
    if (!selectedTemplatePreview) return;

    setGuardandoPreguntas(true);
    try {
      // 1. Asignar template primero
      const assignResponse = await fetch('/api/evaluaciones/asignar-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacante_id: selectedVacanteId,
          categoria_template: selectedTemplatePreview.id,
        }),
      });

      if (!assignResponse.ok) {
        throw new Error('Error asignando template');
      }

      // 2. Si hay cambios, guardar las preguntas personalizadas
      if (editandoPreguntas && JSON.stringify(editandoPreguntas) !== JSON.stringify(selectedTemplatePreview)) {
        const updateResponse = await fetch('/api/evaluaciones/personalizar-preguntas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vacante_id: selectedVacanteId,
            pre_entrevista: editandoPreguntas.pre_entrevista,
            prueba_tecnica: editandoPreguntas.prueba_tecnica,
            preguntas_video: editandoPreguntas.preguntas_video,
          }),
        });

        if (!updateResponse.ok) {
          const data = await updateResponse.json().catch(() => ({}));
          throw new Error(`Template asignado, pero no se guardaron tus cambios: ${data.error || updateResponse.status}`);
        }
      }

      toast.success(`Template "${selectedTemplatePreview.nombre}" asignado y personalizado`);
      setShowTemplateModal(false);
      setSelectedTemplatePreview(null);
      setEditandoPreguntas(null);
    } catch (error) {
      console.error('[GUARDAR-TEMPLATE] Error:', error);
      toast.error('No se pudo asignar el template', { description: error instanceof Error ? error.message : 'Error desconocido' });
    } finally {
      setGuardandoPreguntas(false);
    }
  };

  const handleGenerarPreguntas = async (vacanteId: string) => {
    const vacante = vacantes.find(v => v.id === vacanteId);
    if (!vacante) return;

    setGenerandoPreguntas(true);
    try {
      const response = await fetch('/api/evaluaciones/generar-preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacante_id: vacanteId,
          titulo: vacante.titulo,
          descripcion: vacante.descripcion,
          nivel: vacante.departamento || 'No especificado',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setPreguntasGeneradas(data.data);
        toast.success('Preguntas generadas exitosamente', { description: `Pre-entrevista: ${data.data.pre_entrevista?.length || 0} · Prueba técnica: ${data.data.prueba_tecnica?.length || 0} · Video: ${data.data.preguntas_video?.length || 0}` });
      } else {
        toast.error('Error generando preguntas', { description: data.error || 'Error desconocido' });
      }
    } catch (error) {
      console.error('[GENERAR-PREGUNTAS] Error:', error);
      toast.error('Error generando preguntas');
    } finally {
      setGenerandoPreguntas(false);
    }
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <AppHeader
        subtitle="Panel de reclutador"
        actions={
          <>
            <LicenseStatusBadge />
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="size-4" />
                Volver
              </Button>
            </Link>
          </>
        }
      >
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 border-t px-4 py-3 sm:px-6">
          <Briefcase className="size-4 text-muted-foreground" aria-hidden="true" />
          <select
            aria-label="Seleccionar vacante"
            value={selectedVacanteId}
            onChange={(e) => {
              setSelectedVacanteId(e.target.value);
              setSelectedCandidate(null);
            }}
            className={cn(selectClass, 'min-w-0 max-w-full flex-1 sm:min-w-64 sm:flex-none')}
          >
            {vacantes.map(vacante => (
              <option key={vacante.id} value={vacante.id}>
                {vacante.titulo}
              </option>
            ))}
          </select>
          {vacantesLoading && <span role="status" className="text-sm text-muted-foreground">Cargando vacantes...</span>}
          {!vacantesLoading && vacantesError && (
            <span role="alert" className="text-sm text-destructive">
              Error: {vacantesError}{' '}
              <button
                type="button"
                className="min-h-10 px-2 underline underline-offset-4"
                onClick={() => setVacantesRetry(value => value + 1)}
              >
                Reintentar
              </button>
            </span>
          )}
          {!vacantesLoading && !vacantesError && vacantes.length === 0 && (
            <span className="text-sm text-muted-foreground">No hay vacantes disponibles</span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">({filteredCandidates.length} candidatos)</span>
        </div>
      </AppHeader>

      <section id="acciones" aria-label="Acciones de la vacante" className="scroll-mt-44 border-b bg-muted/40">
        <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <ActionTile icon={<Plus />} label="Crear vacante" onClick={() => setShowCreateVacante(true)} />
            <ActionTile
              icon={<Link2 />}
              label="Ver link"
              onClick={() => {
                if (!selectedVacante) return;
                const postulationLink = `${window.location.origin}${getPostulationPath(selectedVacante.id)}`;
                setLinkedinData({
                  aplicarLink: postulationLink,
                  linkedInText: `Vacante: ${selectedVacante?.titulo}\n\n${selectedVacante?.descripcion || 'Únete a nuestro equipo'}`,
                  linkedinShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postulationLink)}`,
                });
                setShowLinkedinLink(true);
              }}
            />
            <ActionTile
              icon={<ClipboardList />}
              label="Template"
              onClick={() => {
                loadTemplates();
                setShowTemplateModal(true);
              }}
            />
            <ActionTile
              icon={generandoPreguntas ? <Loader className="animate-spin" /> : <Sparkles />}
              label={generandoPreguntas ? 'Generando…' : 'Preguntas'}
              disabled={generandoPreguntas}
              onClick={() => handleGenerarPreguntas(selectedVacanteId)}
            />
            <ActionTile icon={<Download />} label="Reporte" onClick={() => setShowExportModal(true)} />
            <ActionTile
              icon={deletingVacante === selectedVacanteId ? <Loader className="animate-spin" /> : <Lock />}
              label={deletingVacante === selectedVacanteId ? 'Cerrando…' : 'Cerrar plaza'}
              disabled={deletingVacante === selectedVacanteId}
              onClick={() => handleDeleteVacante(selectedVacanteId)}
            />
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 pb-24 sm:px-6 md:pb-16">
        <div id="resumen" className="grid scroll-mt-44 grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Total candidatos"
            value={stats.total}
            hint={`Para ${selectedVacante?.titulo || 'Sin vacante'}`}
            icon={<Users />}
          />
          <StatCard label="Precalificados" value={stats.precalificados} hint="Score 70+" icon={<Star />} />
          <StatCard label="En evaluación" value={stats.en_evaluacion} hint="En proceso" icon={<TrendingUp />} />
          <StatCard label="Promedio score IA" value={stats.promedio} hint="De 100" icon={<Sparkles />} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section id="candidatos" className="flex min-w-0 scroll-mt-44 flex-col gap-3 lg:col-span-2">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Top candidatos</h2>
              <p className="text-sm text-muted-foreground">Clasificados por score IA y fit cultural</p>
            </div>

            {candidatesLoading ? (
              <div role="status" className="flex flex-col gap-3">
                <span className="sr-only">Cargando candidatos…</span>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-40 animate-pulse rounded-2xl border bg-muted" />
                ))}
              </div>
            ) : candidatesError ? (
              <Alert variant="destructive">Error: {candidatesError}</Alert>
            ) : filteredCandidates.length === 0 ? (
              <EmptyState
                icon={<Users />}
                title="No hay candidatos para esta vacante"
                description="Cuando alguien se postule, aparecerá aquí."
              />
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
                    onKeyDown={(event) => {
                      if (event.target !== event.currentTarget) return;
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setSelectedCandidate(candidate);
                      }
                    }}
                    className="cursor-pointer rounded-2xl outline-none transition-transform active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <Card
                      className={cn(
                        'flex flex-col gap-4 transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-md',
                        isSelected && 'ring-1 ring-foreground'
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold">{candidate.nombre}</h3>
                          <p className="truncate text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                        <div className="flex shrink-0 gap-5 text-right">
                          <Metric
                            value={candidate.cv_evaluado === false ? '—' : candidate.score_ia}
                            label={candidate.cv_evaluado === false ? 'CV no evaluado' : 'Score CV'}
                          />
                          {candidate.estado === 'evaluado' && candidate.score_test !== null && candidate.score_test !== undefined && (
                            <Metric value={candidate.score_test} label="Prueba" />
                          )}
                        </div>
                      </div>

                      {candidate.habilidades && candidate.habilidades.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {candidate.habilidades.slice(0, 3).map((skill) => (
                            <Badge key={skill}>{skill}</Badge>
                          ))}
                          {candidate.habilidades.length > 3 && <Badge>+{candidate.habilidades.length - 3}</Badge>}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="size-3.5" aria-hidden="true" />
                          {candidate.telefono}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" aria-hidden="true" />
                          {candidate.experiencia_anos} años exp.
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        <Badge variant={estadoVariant(candidate.estado)}>{candidate.estado}</Badge>
                        <div className="ml-auto flex flex-wrap gap-2">
                          {candidate.estado !== 'evaluado' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={enviandoEvaluacion === candidate.id}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleEnviarEvaluacion(candidate);
                              }}
                            >
                              {enviandoEvaluacion === candidate.id
                                ? 'Generando…'
                                : candidate.estado === 'evaluacion'
                                  ? 'Reenviar evaluación'
                                  : 'Enviar evaluación'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (window.confirm(`¿Eliminar a ${candidate.nombre}? Esta acción es irreversible.`)) {
                                fetch('/api/candidatos/eliminar', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ candidatoId: candidate.id })
                                })
                                  .then(r => r.json())
                                  .then(data => {
                                    if (data.success) {
                                      toast.success('Candidato eliminado');
                                      setSelectedCandidate(current => (current?.id === candidate.id ? null : current));
                                      setCandidatesRefresh(value => value + 1);
                                    } else {
                                      toast.error('No se pudo eliminar el candidato', { description: data.error });
                                    }
                                  })
                                  .catch(e => toast.error('No se pudo eliminar el candidato', { description: e.message }));
                              }
                            }}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                );
              })
            )}
          </section>

          {selectedCandidate && (
            <aside className="min-w-0 lg:col-span-1">
              <Reveal>
                <Card className="flex flex-col gap-6 lg:sticky lg:top-44">
                  <CardHeader className="border-b-0 pb-0">
                    <CardTitle className="text-lg">{selectedCandidate.nombre}</CardTitle>
                    <CardDescription>Análisis detallado</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6 pt-0">
                    <div className="flex flex-col gap-2 rounded-xl bg-muted/50 p-3 text-sm">
                      <a
                        href={`mailto:${selectedCandidate.email}`}
                        className="inline-flex min-w-0 items-center gap-2 underline-offset-4 hover:underline"
                      >
                        <Mail className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{selectedCandidate.email}</span>
                      </a>
                      <span className="inline-flex items-center gap-2">
                        <Smartphone className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {selectedCandidate.telefono}
                      </span>
                      {selectedCandidate.cv_url && (
                        <button
                          type="button"
                          onClick={async () => {
                            const response = await fetch(`/api/candidatos/${encodeURIComponent(selectedCandidate.id)}/cv`);
                            const data = await response.json().catch(() => ({}));
                            if (response.ok && data.url) {
                              window.open(data.url, '_blank', 'noopener,noreferrer');
                            } else {
                              toast.error(data.error || 'No se pudo abrir el CV');
                            }
                          }}
                          className="inline-flex min-h-10 items-center gap-2 pt-1 text-left underline-offset-4 hover:underline"
                        >
                          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          Ver PDF del CV
                        </button>
                      )}
                    </div>

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

                    <Button className="w-full" onClick={() => setShowDetailModal(true)}>
                      Ver perfil completo
                    </Button>
                  </CardContent>
                </Card>
              </Reveal>
            </aside>
          )}
        </div>
      </main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {[
            { href: '#resumen', label: 'Resumen', icon: <TrendingUp /> },
            { href: '#candidatos', label: 'Candidatos', icon: <Users /> },
            { href: '#acciones', label: 'Acciones', icon: <Sparkles /> },
          ].map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground [&>svg]:size-5"
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {showCreateVacante && (
        <Modal labelledBy="create-vacancy-title" className="sm:max-w-md">
          <ModalHeader
            id="create-vacancy-title"
            title="Nueva vacante"
            onClose={() => setShowCreateVacante(false)}
            closeLabel="Cerrar creación de vacante"
          />
          <ModalBody className="flex flex-col gap-4">
            <Field label="Título *" htmlFor="vacancy-title">
              <Input
                id="vacancy-title"
                autoFocus
                type="text"
                placeholder="Ej: Desarrollador senior React"
                value={newVacante.titulo}
                onChange={(e) => setNewVacante({ ...newVacante, titulo: e.target.value })}
              />
            </Field>
            <Field label="Descripción" htmlFor="vacancy-description">
              <textarea
                id="vacancy-description"
                rows={3}
                placeholder="Descripción de la posición…"
                value={newVacante.descripcion}
                onChange={(e) => setNewVacante({ ...newVacante, descripcion: e.target.value })}
                className={textareaClass}
              />
            </Field>
            <Field label="Departamento" htmlFor="vacancy-department">
              <Input
                id="vacancy-department"
                type="text"
                placeholder="Ej: Tecnología"
                value={newVacante.departamento}
                onChange={(e) => setNewVacante({ ...newVacante, departamento: e.target.value })}
              />
            </Field>
            <Field
              label="Link LinkedIn (opcional)"
              htmlFor="vacancy-linkedin"
              hint="Link de la vacante en LinkedIn para compartir"
            >
              <Input
                id="vacancy-linkedin"
                type="url"
                placeholder="Ej: https://linkedin.com/jobs/view/123456"
                value={newVacante.linkedinLink}
                onChange={(e) => setNewVacante({ ...newVacante, linkedinLink: e.target.value })}
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setShowCreateVacante(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateVacante} disabled={!newVacante.titulo.trim()}>
              Crear vacante
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {evaluacionEnviada && (
        <Modal labelledBy="evaluacion-title" className="sm:max-w-xl">
          <ModalHeader
            id="evaluacion-title"
            title={`Evaluación para ${evaluacionEnviada.nombre}`}
            description={`Comparte este enlace con el candidato. Es personal, sirve una sola vez y vence el ${new Date(evaluacionEnviada.expira_en).toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })}. Cuando responda, verás su puntaje en la lista de candidatos.`}
            onClose={() => setEvaluacionEnviada(null)}
          />
          <ModalBody className="flex flex-col gap-4">
            <Field label="Enlace de la evaluación" htmlFor="evaluacion-link">
              <Input
                id="evaluacion-link"
                readOnly
                value={evaluacionEnviada.link}
                onFocus={(event) => event.currentTarget.select()}
                className="font-mono text-sm"
              />
            </Field>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setEvaluacionEnviada(null)}>
              Cerrar
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const asunto = `Evaluación para la vacante ${selectedVacante?.titulo ?? ''}`.trim();
                const cuerpo = `Hola ${evaluacionEnviada.nombre}:\n\nGracias por postularte. Te invitamos a completar esta evaluación:\n${evaluacionEnviada.link}\n\nEl enlace es personal y solo se puede enviar una vez.`;
                window.location.href = `mailto:${encodeURIComponent(evaluacionEnviada.email)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
              }}
            >
              <Send className="size-4" />
              Abrir en correo
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(evaluacionEnviada.link);
                  toast.success('Enlace copiado');
                } catch {
                  toast.error('No se pudo copiar automáticamente', { description: 'Selecciona el enlace y cópialo.' });
                }
              }}
            >
              <Copy className="size-4" />
              Copiar enlace
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {showLinkedinLink && linkedinData && (
        <Modal labelledBy="share-vacancy-title" className="sm:max-w-2xl">
          <ModalHeader
            id="share-vacancy-title"
            title="Link para LinkedIn"
            description="Usa este link para compartir la vacante en LinkedIn"
            onClose={() => setShowLinkedinLink(false)}
          />
          <ModalBody className="flex flex-col gap-6">
            <section className="flex flex-col gap-2 rounded-xl border bg-muted/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Link de aplicación</p>
              <div className="flex items-center gap-2 rounded-lg bg-card p-2 ring-1 ring-border">
                <code className="min-w-0 flex-1 break-all px-1 text-sm">{linkedinData.aplicarLink}</code>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(linkedinData.aplicarLink);
                    toast.success('Link copiado al portapapeles');
                  }}
                >
                  <Copy className="size-4" />
                  Copiar
                </Button>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Texto para LinkedIn</p>
              <textarea value={linkedinData.linkedInText} readOnly rows={6} className={textareaClass} />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  navigator.clipboard.writeText(linkedinData.linkedInText + '\n\n' + linkedinData.aplicarLink);
                  toast.success('Texto copiado al portapapeles');
                }}
              >
                Copiar texto + link
              </Button>
            </section>

            <section className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Compartir</p>
              <a
                href={linkedinData.linkedinShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <Share2 className="size-4" aria-hidden="true" />
                Abrir en LinkedIn
              </a>
            </section>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={() => setShowLinkedinLink(false)}>
              Cerrar
            </Button>
          </ModalFooter>
        </Modal>
      )}

      {showDetailModal && selectedCandidate && (
        <Modal labelledBy="profile-title" className="sm:max-w-2xl">
          <ModalHeader
            id="profile-title"
            title={selectedCandidate.nombre}
            description="Perfil completo del candidato"
            onClose={() => setShowDetailModal(false)}
          />
          <ModalBody className="flex flex-col gap-8">
            <section className="flex flex-col gap-2 text-sm">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información de contacto</h3>
              <p><span className="text-muted-foreground">Email:</span> {selectedCandidate.email}</p>
              <p><span className="text-muted-foreground">Teléfono:</span> {selectedCandidate.telefono}</p>
              <p><span className="text-muted-foreground">Experiencia:</span> {selectedCandidate.experiencia_anos} años</p>
            </section>

            <section className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Score IA detallado</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="text-3xl font-semibold tracking-tight tabular-nums">
                    {selectedCandidate.cv_evaluado === false ? '—' : `${selectedCandidate.score_ia}/100`}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {selectedCandidate.cv_evaluado === false ? 'CV no evaluado: revisar manualmente' : 'Score del CV'}
                  </p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <div className="text-3xl font-semibold tracking-tight tabular-nums">
                    {selectedCandidate.estado === 'evaluado' && selectedCandidate.score_test !== null && selectedCandidate.score_test !== undefined
                      ? `${selectedCandidate.score_test}/100`
                      : '—'}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground text-pretty">
                    {selectedCandidate.estado !== 'evaluado'
                      ? 'Prueba pendiente'
                      : selectedCandidate.score_test === null || selectedCandidate.score_test === undefined
                        ? 'Solo respuestas abiertas: revisar'
                        : 'Prueba técnica'}
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {selectedCandidate.puntuaciones && Object.entries(selectedCandidate.puntuaciones).map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                      <span className="font-medium tabular-nums">{value}/100</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success" style={{ width: `${value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Análisis IA</h3>
              <p className="text-sm leading-relaxed text-pretty">{selectedCandidate.feedback_ia}</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resumen ejecutivo</h3>
              <p className="text-sm leading-relaxed text-pretty">{selectedCandidate.resumen_ejecutivo}</p>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Habilidades</h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedCandidate.habilidades?.map((skill) => (
                  <Badge key={skill} variant="info">{skill}</Badge>
                ))}
              </div>
            </section>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowDetailModal(false)}>Cerrar</Button>
          </ModalFooter>
        </Modal>
      )}

      <ProfessionalReportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        vacanteTitle={selectedVacante?.titulo || 'Reporte'}
        candidates={filteredCandidates}
        company="FORNITURE CITY"
      />

      {showTemplateModal && !selectedTemplatePreview && (
        <Modal labelledBy="template-select-title" className="sm:max-w-2xl">
          <ModalHeader
            id="template-select-title"
            title="Seleccionar template de preguntas"
            description="Elige una categoría para ver y personalizar las preguntas"
            onClose={() => setShowTemplateModal(false)}
          />
          <ModalBody>
            {templates.length === 0 ? (
              <p role="status" className="py-8 text-center text-sm text-muted-foreground">Cargando categorías…</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {templates.map((template) => (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => handlePreviewTemplate(template.id)}
                    className="flex flex-col gap-2 rounded-xl border bg-card p-4 text-left transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-sm active:scale-[0.99] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="font-semibold">{template.nombre}</span>
                    <span className="text-xs text-muted-foreground text-pretty">{template.descripcion}</span>
                    <span className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground tabular-nums">
                      <span className="inline-flex items-center gap-1"><MessageSquare className="size-3.5" aria-hidden="true" />{template.preguntas.pre_entrevista} pre</span>
                      <span className="inline-flex items-center gap-1"><FlaskConical className="size-3.5" aria-hidden="true" />{template.preguntas.prueba_tecnica} técnicas</span>
                      <span className="inline-flex items-center gap-1"><Video className="size-3.5" aria-hidden="true" />{template.preguntas.preguntas_video} videos</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </ModalBody>
        </Modal>
      )}

      {selectedTemplatePreview && editandoPreguntas && (
        <Modal labelledBy="template-edit-title" className="sm:max-w-4xl">
          <ModalHeader
            id="template-edit-title"
            title={selectedTemplatePreview.nombre}
            description="Personaliza las preguntas si lo deseas"
            onClose={() => {
              setSelectedTemplatePreview(null);
              setEditandoPreguntas(null);
            }}
          />
          <ModalBody className="flex flex-col gap-8">
            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <MessageSquare className="size-4 text-muted-foreground" aria-hidden="true" />
                Pre-entrevista
              </h3>
              {editandoPreguntas.pre_entrevista?.map((p: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
                  <Field label={`Pregunta ${p.numero}`} htmlFor={`pre-${idx}`}>
                    <textarea
                      id={`pre-${idx}`}
                      value={p.pregunta}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.pre_entrevista];
                        updated[idx].pregunta = e.target.value;
                        setEditandoPreguntas({...editandoPreguntas, pre_entrevista: updated});
                      }}
                      rows={2}
                      className={textareaClass}
                    />
                  </Field>
                  <Field label="Criterio de evaluación" htmlFor={`pre-c-${idx}`}>
                    <Input
                      id={`pre-c-${idx}`}
                      type="text"
                      value={p.criterio}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.pre_entrevista];
                        updated[idx].criterio = e.target.value;
                        setEditandoPreguntas({...editandoPreguntas, pre_entrevista: updated});
                      }}
                    />
                  </Field>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <FlaskConical className="size-4 text-muted-foreground" aria-hidden="true" />
                Prueba técnica
              </h3>
              {editandoPreguntas.prueba_tecnica?.map((p: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
                  <Field label={`Pregunta ${p.numero}`} htmlFor={`tec-${idx}`}>
                    <textarea
                      id={`tec-${idx}`}
                      value={p.pregunta}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.prueba_tecnica];
                        updated[idx].pregunta = e.target.value;
                        setEditandoPreguntas({...editandoPreguntas, prueba_tecnica: updated});
                      }}
                      rows={2}
                      className={textareaClass}
                    />
                  </Field>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {p.opciones?.map((opt: string, i: number) => (
                      <Field key={i} label={`Opción ${i + 1}`} htmlFor={`tec-${idx}-opt-${i}`}>
                        <Input
                          id={`tec-${idx}-opt-${i}`}
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...editandoPreguntas.prueba_tecnica];
                            updated[idx].opciones[i] = e.target.value;
                            setEditandoPreguntas({...editandoPreguntas, prueba_tecnica: updated});
                          }}
                        />
                      </Field>
                    ))}
                  </div>
                  <Field label="Respuesta correcta (número)" htmlFor={`tec-${idx}-resp`}>
                    <Input
                      id={`tec-${idx}-resp`}
                      type="number"
                      min="0"
                      max="3"
                      value={p.respuesta_correcta}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.prueba_tecnica];
                        updated[idx].respuesta_correcta = parseInt(e.target.value);
                        setEditandoPreguntas({...editandoPreguntas, prueba_tecnica: updated});
                      }}
                    />
                  </Field>
                </div>
              ))}
            </section>

            <section className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <Video className="size-4 text-muted-foreground" aria-hidden="true" />
                Preguntas de video
              </h3>
              {editandoPreguntas.preguntas_video?.map((p: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-3 rounded-xl border bg-muted/40 p-4">
                  <Field label={`Pregunta ${p.numero}`} htmlFor={`vid-${idx}`}>
                    <textarea
                      id={`vid-${idx}`}
                      value={p.pregunta}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.preguntas_video];
                        updated[idx].pregunta = e.target.value;
                        setEditandoPreguntas({...editandoPreguntas, preguntas_video: updated});
                      }}
                      rows={2}
                      className={textareaClass}
                    />
                  </Field>
                  <Field label="Criterio de evaluación" htmlFor={`vid-c-${idx}`}>
                    <Input
                      id={`vid-c-${idx}`}
                      type="text"
                      value={p.criterio}
                      onChange={(e) => {
                        const updated = [...editandoPreguntas.preguntas_video];
                        updated[idx].criterio = e.target.value;
                        setEditandoPreguntas({...editandoPreguntas, preguntas_video: updated});
                      }}
                    />
                  </Field>
                </div>
              ))}
            </section>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedTemplatePreview(null);
                setEditandoPreguntas(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={guardarYAsignarTemplate} isLoading={guardandoPreguntas}>
              Guardar y asignar
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}

function estadoVariant(estado: string): 'success' | 'warning' | 'info' | 'default' {
  if (estado === 'precalificado') return 'success';
  if (estado === 'evaluacion') return 'warning';
  if (estado === 'evaluado') return 'info';
  return 'default';
}

function Metric({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ActionTile({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl border bg-card p-3 text-center text-xs font-medium transition-all hover:-translate-y-px hover:border-foreground/15 hover:shadow-sm active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>svg]:size-5"
    >
      <span className="text-muted-foreground" aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
