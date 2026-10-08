'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Field, Input, textareaClass } from '@/components/ui/field';
import { Reveal } from '@/components/ui/reveal';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function NewVacantePage() {
  return (
    <ProtectedRoute>
      <NewVacanteContent />
    </ProtectedRoute>
  );
}

function NewVacanteContent() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    slug: '',
    departamento: '',
    salario_minimo: '',
    salario_maximo: '',
    ubicacion: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'titulo' && { slug: value.toLowerCase().replace(/\s+/g, '-') }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!formData.titulo || !formData.slug) {
      setError('El título y slug son requeridos');
      return;
    }

    setIsLoading(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch('/api/vacantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          salario_minimo: formData.salario_minimo ? parseInt(formData.salario_minimo) : null,
          salario_maximo: formData.salario_maximo ? parseInt(formData.salario_maximo) : null,
        }),
      });

      if (!response.ok) throw new Error('Error al crear vacante');

      const data = await response.json();
      setSuccess(true);

      setTimeout(() => {
        router.push(`/dashboard/vacantes/${data.vacante.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Error al crear la vacante');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
        <Reveal className="w-full max-w-sm">
          <Card className="items-center text-center">
            <CheckCircle2 className="mb-2 size-10 text-success" aria-hidden="true" />
            <CardHeader className="border-b-0 pb-0">
              <CardTitle>Vacante creada</CardTitle>
              <CardDescription>Tu nueva vacante se creó correctamente. Redirigiendo…</CardDescription>
            </CardHeader>
          </Card>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Volver al panel
        </Link>

        <Reveal>
          <Card>
            <CardHeader>
              <CardTitle>Crear nueva vacante</CardTitle>
              <CardDescription>Completa el formulario para publicar una nueva posición</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {error && <Alert variant="destructive">{error}</Alert>}

                <Field label="Título de la posición" htmlFor="vac-titulo">
                  <Input
                    id="vac-titulo"
                    type="text"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    placeholder="Senior React Developer"
                    required
                  />
                </Field>

                <Field
                  label="URL slug"
                  htmlFor="vac-slug"
                  hint={`URL pública: /postular/${formData.slug}`}
                >
                  <Input
                    id="vac-slug"
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="senior-react-developer"
                    required
                  />
                </Field>

                <Field label="Descripción" htmlFor="vac-descripcion">
                  <textarea
                    id="vac-descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleChange}
                    placeholder="Describe la posición, responsabilidades y requisitos…"
                    rows={5}
                    className={textareaClass}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Departamento" htmlFor="vac-departamento">
                    <Input
                      id="vac-departamento"
                      type="text"
                      name="departamento"
                      value={formData.departamento}
                      onChange={handleChange}
                      placeholder="Desarrollo"
                    />
                  </Field>
                  <Field label="Ubicación" htmlFor="vac-ubicacion">
                    <Input
                      id="vac-ubicacion"
                      type="text"
                      name="ubicacion"
                      value={formData.ubicacion}
                      onChange={handleChange}
                      placeholder="Guatemala"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Salario mínimo" htmlFor="vac-salario-min">
                    <Input
                      id="vac-salario-min"
                      type="number"
                      name="salario_minimo"
                      value={formData.salario_minimo}
                      onChange={handleChange}
                      placeholder="35000"
                    />
                  </Field>
                  <Field label="Salario máximo" htmlFor="vac-salario-max">
                    <Input
                      id="vac-salario-max"
                      type="number"
                      name="salario_maximo"
                      value={formData.salario_maximo}
                      onChange={handleChange}
                      placeholder="50000"
                    />
                  </Field>
                </div>

                <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
                  <Link href="/dashboard" className="sm:w-auto">
                    <Button variant="secondary" className="w-full sm:w-auto">
                      Cancelar
                    </Button>
                  </Link>
                  <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
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
