'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockVacantes } from '@/lib/mock-data';
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  nombre: string;
  telefono: string;
  cv: File | null;
  consentimiento: boolean;
}

interface Vacante {
  id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
}

export default function PostularPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = use(paramsPromise);
  const [vacante, setVacante] = useState<Vacante | null>(null);

  useEffect(() => {
    const fetchVacante = async () => {
      // 1. Try API route (backend Supabase call) first
      try {
        const response = await fetch(`/api/vacantes/buscar?id=${params.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.vacante) {
            setVacante(data.vacante);
            return;
          }
        }
      } catch (e) {
        console.log('API search failed, trying fallback:', e);
      }

      // 2. Construir lista de vacantes desde TODAS las fuentes
      const allVacantes: Vacante[] = [];

      // 2a. Agregar mockVacantes primero
      mockVacantes.forEach(v => {
        allVacantes.push({
          id: v.id,
          titulo: v.titulo,
          descripcion: v.descripcion,
          departamento: undefined,
        });
      });

      // 2b. Intentar agregar desde localStorage o cookie
      try {
        let savedVacantes = localStorage.getItem('vacantes');
        if (!savedVacantes) {
          const cookies = document.cookie.split(';');
          const vacCookie = cookies.find(c => c.trim().startsWith('vacantes='));
          if (vacCookie) {
            savedVacantes = decodeURIComponent(vacCookie.split('=')[1]);
          }
        }
        if (savedVacantes) {
          const parsed = JSON.parse(savedVacantes);
          if (Array.isArray(parsed)) {
            parsed.forEach(v => {
              if (v && v.id && !allVacantes.find(av => av.id === v.id)) {
                allVacantes.push({
                  id: v.id,
                  titulo: v.titulo,
                  descripcion: v.descripcion,
                  departamento: v.departamento,
                });
              }
            });
          }
        }
      } catch (e) {
        console.error('Error parsing localStorage vacantes:', e);
      }

      // 3. Fallback: sessionStorage
      try {
        const savedVacantes = localStorage.getItem('vacantes');
        if (!savedVacantes) {
          const sessionVacantes = sessionStorage.getItem('vacantes');
          if (sessionVacantes) {
            const parsed = JSON.parse(sessionVacantes);
            if (Array.isArray(parsed)) {
              parsed.forEach(v => {
                if (v && v.id && !allVacantes.find(av => av.id === v.id)) {
                  allVacantes.push({
                    id: v.id,
                    titulo: v.titulo,
                    descripcion: v.descripcion,
                    departamento: v.departamento,
                  });
                }
              });
            }
          }
        }
      } catch (e) {
        console.error('Error parsing sessionStorage vacantes:', e);
      }

      const found = allVacantes.find(v => v.id === params.slug);
      setVacante(found || null);
    };

    fetchVacante();
  }, [params.slug]);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    telefono: '',
    cv: null,
    consentimiento: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFileName, setCvFileName] = useState('');
  const [submitError, setSubmitError] = useState('');

  if (vacante === undefined) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <p className="text-zinc-400">Cargando...</p>
      </div>
    );
  }

  if (!vacante) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-zinc-400">Vacante no encontrada</p>
            <Link href="/" className="mt-4 inline-block">
              <Button>Volver al inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('CV debe ser menor a 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, cv: file }));
      setCvFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.nombre || !formData.telefono || !formData.cv || !formData.consentimiento) {
      setSubmitError('Completa todos los campos y acepta el consentimiento');
      return;
    }

    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('vacante_id', params.slug);
      if (formData.cv) formDataToSend.append('cv', formData.cv);

      const response = await fetch('/api/candidatos/postular', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Save to localStorage for dashboard
        try {
          const candidatoData = {
            id: data.candidatoId,
            vacante_id: params.slug,
            nombre: formData.nombre,
            email: data.candidato.email,
            telefono: formData.telefono,
            cv_url: '',
            estado: 'pendiente',
            score_ia: 0,
          };
          const saved = localStorage.getItem('candidatos_postulantes') || '[]';
          const list = JSON.parse(saved);
          list.push(candidatoData);
          localStorage.setItem('candidatos_postulantes', JSON.stringify(list));
          console.log('[POSTULAR] Candidato guardado en localStorage:', candidatoData);
          console.log('[POSTULAR] Lista completa en localStorage:', list);
          console.log('[POSTULAR] Vacante ID para filtrar:', params.slug);
        } catch (e) {
          console.error('[POSTULAR] Error al guardar en localStorage:', e);
        }
        setSubmitted(true);
      } else {
        setSubmitError(data.error || 'Error al enviar la solicitud. Intenta de nuevo.');
      }
    } catch (err) {
      setSubmitError('Error de conexión. Verifica tu internet e intenta de nuevo.');
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">¡Solicitud Enviada!</h2>
            <p className="text-zinc-400 mb-6">Tu CV fue compartido con Forniture City</p>
            <Link href="/">
              <Button>Volver</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-6 inline-block">
          ← Volver
        </Link>

        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">SHORTLIST<span className="text-emerald-500">.GT</span></CardTitle>
            <CardDescription>Vacante: {vacante.titulo}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300 text-sm">{vacante.descripcion}</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle>Formulario de Aplicación</CardTitle>
          </CardHeader>
          <CardContent>
            {submitError && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4 mb-5">
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Nombre Completo *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Juan Pérez" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Teléfono *</label>
                <input type="tel" name="telefono" value={formData.telefono} onChange={handleInputChange} placeholder="+502 XXXX XXXX" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Currículum (PDF) * - Máx 5MB</label>
                <label className="flex flex-col items-center justify-center px-4 py-6 rounded-lg border-2 border-dashed border-zinc-700 hover:border-emerald-500 cursor-pointer transition-colors">
                  <input type="file" onChange={handleFileChange} accept=".pdf" className="hidden" required />
                  <Upload className="w-8 h-8 text-zinc-400 mb-2" />
                  <p className="text-sm text-white">{cvFileName || 'Selecciona tu CV (PDF)'}</p>
                </label>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="consentimiento" 
                        checked={formData.consentimiento} 
                        onChange={handleInputChange} 
                        className="mt-1 w-4 h-4"
                        required
                      />
                      <span className="text-sm text-zinc-300">
                        Autorizo compartir mi nombre, teléfono y CV con <strong>Forniture City</strong> para evaluar mi candidatura a esta posición.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting || !formData.consentimiento} className="w-full bg-emerald-600 hover:bg-emerald-700 py-2">
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
