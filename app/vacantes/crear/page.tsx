'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input, textareaClass } from '@/components/ui/field';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { ArrowLeft, CheckCircle2, Copy, Plus } from 'lucide-react';

export default function CrearVacantePage() {
  // Force rebuild v2
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const fd = new FormData(e.currentTarget);
      const titulo = fd.get('titulo') as string;
      const descripcion = fd.get('descripcion') as string;
      const departamento = fd.get('departamento') as string;

      if (!titulo.trim()) {
        setError('Título requerido');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/vacantes/crear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descripcion,
          departamento,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError('No estás autenticado. Por favor inicia sesión primero.');
        setLoading(false);
        return;
      }

      if (!response.ok || !data.success) {
        setError(data.error || 'Error al crear vacante');
        setLoading(false);
        return;
      }

      const baseUrl = window.location.origin;
      console.log('[CREAR] data.link from API:', data.link);
      console.log('[CREAR] data.vacante_id from API:', data.vacante_id);
      const aplicarLink = `${baseUrl}${data.link}`;
      console.log('[CREAR] Final aplicarLink:', aplicarLink);

      console.log('[CREAR] Vacante creada en Supabase:', data.vacante_id);
      setLink(aplicarLink);
      e.currentTarget.reset();
    } catch (err) {
      setError('Error: ' + (err instanceof Error ? err.message : 'desconocido'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (link) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10">
        <Reveal className="w-full max-w-xl">
          <Card className="flex flex-col items-center gap-5 p-6 text-center sm:p-8">
            <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Vacante creada</h1>
              <p className="text-sm text-muted-foreground">Comparte este link de aplicación con tus candidatos.</p>
            </div>
            <div className="w-full rounded-lg border bg-muted/50 p-4">
              <code className="block break-all font-mono text-sm">{link}</code>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  toast.success('Link copiado al portapapeles');
                }}
              >
                <Copy className="size-4" />
                Copiar link
              </Button>
              <Link href="/vacantes/crear">
                <Button variant="secondary">
                  <Plus className="size-4" />
                  Crear otra
                </Button>
              </Link>
            </div>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-background px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-xl flex-col gap-6">
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
          <Card>
            <CardHeader>
              <CardTitle>Crear nueva vacante</CardTitle>
              <CardDescription>Completa los datos para generar el link de aplicación</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && <Alert variant="destructive">{error}</Alert>}

                <Field label="Título *" htmlFor="crear-titulo">
                  <Input id="crear-titulo" type="text" name="titulo" placeholder="Ej: Desarrollador senior" required />
                </Field>

                <Field label="Descripción" htmlFor="crear-descripcion">
                  <textarea
                    id="crear-descripcion"
                    name="descripcion"
                    rows={5}
                    placeholder="Describe la posición…"
                    className={textareaClass}
                  />
                </Field>

                <Field label="Departamento" htmlFor="crear-departamento">
                  <Input id="crear-departamento" type="text" name="departamento" placeholder="Ej: Tecnología" />
                </Field>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
                  <Link href="/" className="flex-1">
                    <Button variant="secondary" className="w-full">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" isLoading={loading} className="flex-1">
                    Crear vacante
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
