'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { AlertCircle, CheckCircle } from 'lucide-react';
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <CardTitle>¡Vacante Creada!</CardTitle>
            <CardDescription>
              Tu nueva vacante ha sido creada exitosamente. Redirigiendo...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard" className="text-emerald-500 hover:text-emerald-400 mb-6 inline-flex">
          ← Volver al Dashboard
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Crear Nueva Vacante</CardTitle>
            <CardDescription>
              Completa el formulario para crear una nueva posición
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex gap-3 p-4 bg-rose-950/30 border border-rose-800/40 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-rose-300">{error}</p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Título de la Posición
                </label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Senior React Developer"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="senior-react-developer"
                  required
                />
                <p className="text-xs text-zinc-500 mt-2">
                  URL pública: /postular/{formData.slug}
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 h-32"
                  placeholder="Describe la posición, responsabilidades y requisitos..."
                />
              </div>

              {/* Department and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Departamento
                  </label>
                  <input
                    type="text"
                    name="departamento"
                    value={formData.departamento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Desarrollo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Ubicación
                  </label>
                  <input
                    type="text"
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="Guatemala"
                  />
                </div>
              </div>

              {/* Salary Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Salario Mínimo
                  </label>
                  <input
                    type="number"
                    name="salario_minimo"
                    value={formData.salario_minimo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="35000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Salario Máximo
                  </label>
                  <input
                    type="number"
                    name="salario_maximo"
                    value={formData.salario_maximo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-6">
                <Button type="submit" isLoading={isLoading} className="flex-1">
                  Crear Vacante
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button variant="secondary" className="w-full">
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
