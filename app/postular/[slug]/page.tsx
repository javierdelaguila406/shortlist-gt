'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { ArrowLeft, Upload, CheckCircle2, Loader, TriangleAlert } from 'lucide-react';
import { MAX_CV_BYTES, MAX_CV_LABEL } from '@/lib/cv-limits';

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  experiencia_anos: string;
  cv: File | null;
  consentimiento: boolean;
}

interface Vacante {
  id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
  estado?: string;
  empresa?: string | null;
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
      <Reveal className="w-full max-w-md">{children}</Reveal>
    </div>
  );
}

export default function PostularPage({ params: paramsPromise }: { params: Promise<{ slug: string }> }) {
  const params = use(paramsPromise);
  const [vacante, setVacante] = useState<Vacante | null>(null);
  const [vacanteLoading, setVacanteLoading] = useState(true);
  const [vacanteError, setVacanteError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchVacante = async () => {
      setVacanteLoading(true);
      setVacanteError(null);
      // 1. Try API route (backend Supabase call) first
      try {
        const response = await fetch(`/api/vacantes/buscar?id=${params.slug}`);
        if (response.ok) {
          const data = await response.json();
          if (data.found && data.vacante) {
            setVacante(data.vacante);
            setVacanteLoading(false);
            return;
          }
        } else if (response.status >= 500) {
          throw new Error(`Error ${response.status} al cargar la vacante`);
        }
      } catch (e) {
        console.error('API search failed:', e);
        setVacanteError(e instanceof Error ? e.message : 'No se pudo cargar la vacante');
      }

      setVacante(null);
      setVacanteLoading(false);
    };

    fetchVacante();
  }, [params.slug, retryCount]);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    experiencia_anos: '',
    cv: null,
    consentimiento: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFileName, setCvFileName] = useState('');
  const [submitError, setSubmitError] = useState('');

  if (vacanteLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="size-4 animate-spin" aria-hidden="true" />
          Cargando vacante...
        </div>
      </div>
    );
  }

  if (vacanteError) {
    return (
      <CenteredCard>
        <Card className="flex flex-col items-center gap-4 text-center">
          <Alert variant="destructive" className="w-full text-left">Error: {vacanteError}</Alert>
          <Button onClick={() => setRetryCount(value => value + 1)}>Reintentar</Button>
        </Card>
      </CenteredCard>
    );
  }

  if (!vacante) {
    return (
      <CenteredCard>
        <Card className="flex flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground">Vacante no encontrada</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </Card>
      </CenteredCard>
    );
  }

  if (vacante.estado === 'cerrada') {
    return (
      <CenteredCard>
        <Card className="flex flex-col items-center gap-4 text-center">
          <p>Esta vacante cerró, no puedes postularte</p>
          <Link href="/">
            <Button>Volver al inicio</Button>
          </Link>
        </Card>
      </CenteredCard>
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
    if (!file) return;
    if (file.type && file.type !== 'application/pdf') {
      setSubmitError('El CV debe estar en formato PDF');
      return;
    }
    if (file.size > MAX_CV_BYTES) {
      setSubmitError(`El CV debe pesar menos de ${MAX_CV_LABEL}`);
      return;
    }
    setSubmitError('');
    setFormData(prev => ({ ...prev, cv: file }));
    setCvFileName(file.name);
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
      // Resolver el slug al ID correcto de la vacante
      const resolverResponse = await fetch(`/api/vacantes/resolver-slug?slug=${params.slug}`);
      const resolverData = await resolverResponse.json();

      if (!resolverData.success) {
        setSubmitError('Vacante no encontrada');
        setIsSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('experiencia_anos', formData.experiencia_anos);
      formDataToSend.append('vacante_id', resolverData.vacante_id);
      formDataToSend.append('consentimiento', String(formData.consentimiento));
      if (formData.cv) formDataToSend.append('cv', formData.cv);

      const response = await fetch('/api/candidatos/postular', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
      <CenteredCard>
        <Card className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
          <h2 className="text-xl font-semibold tracking-tight">¡Gracias por aplicar!</h2>
          <p className="text-sm text-muted-foreground">Nos estaremos contactando contigo pronto.</p>
        </Card>
      </CenteredCard>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background px-4 py-8 sm:py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Inicio
          </Link>
          <Logo className="text-base" />
        </div>

        <Reveal>
          <Card className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {vacante.empresa || 'Vacante'}
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance">{vacante.titulo}</h1>
            </div>
            {vacante.descripcion && (
              <p className="text-sm text-muted-foreground text-pretty">{vacante.descripcion}</p>
            )}
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Formulario de aplicación</CardTitle>
              <CardDescription>Los campos marcados con * son obligatorios</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {submitError && <Alert variant="destructive">{submitError}</Alert>}

                <Field label="Nombre completo *" htmlFor="candidate-name">
                  <Input id="candidate-name" type="text" name="nombre" autoComplete="name" value={formData.nombre} onChange={handleInputChange} placeholder="Juan Pérez" required />
                </Field>

                <Field label="Email *" htmlFor="candidate-email">
                  <Input id="candidate-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleInputChange} placeholder="tu@email.com" required />
                </Field>

                <Field label="Teléfono *" htmlFor="candidate-phone">
                  <Input id="candidate-phone" type="tel" name="telefono" autoComplete="tel" value={formData.telefono} onChange={handleInputChange} placeholder="+502 XXXX XXXX" required />
                </Field>

                <Field label="Años de experiencia *" htmlFor="candidate-experience">
                  <Input id="candidate-experience" type="number" name="experiencia_anos" value={formData.experiencia_anos} onChange={handleInputChange} placeholder="Ej: 5" min="0" max="70" required />
                </Field>

                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium">Currículum (PDF) * · Máx {MAX_CV_LABEL}</p>
                  <label
                    htmlFor="candidate-document"
                    className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed bg-muted/40 px-4 py-8 text-center transition-colors hover:border-foreground/30 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30"
                  >
                    <input id="candidate-document" type="file" onChange={handleFileChange} accept=".pdf" className="sr-only" required />
                    <Upload className="size-6 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium">{cvFileName || 'Selecciona tu CV (PDF)'}</span>
                    {cvFileName && <span className="text-xs text-muted-foreground">Toca para cambiarlo</span>}
                  </label>
                </div>

                <div className="flex gap-3 rounded-xl bg-warning-soft p-4 ring-1 ring-inset ring-warning/25">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      id="candidate-consent"
                      type="checkbox"
                      name="consentimiento"
                      checked={formData.consentimiento}
                      onChange={handleInputChange}
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      required
                    />
                    <span>
                      Autorizo compartir mi nombre, teléfono y CV con <strong>{vacante.empresa || 'la empresa que publicó esta vacante'}</strong> para evaluar mi candidatura a esta posición.
                    </span>
                  </label>
                </div>

                <Button type="submit" isLoading={isSubmitting} disabled={!formData.consentimiento} className="w-full">
                  Enviar solicitud
                </Button>
              </form>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
