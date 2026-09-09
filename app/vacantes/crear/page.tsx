'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function CrearVacantePage() {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCrear = async () => {
    if (!titulo.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const newId = `vacante-${Date.now()}`;
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shortlist-gt.vercel.app';
      const aplicarLink = `${baseUrl}/postular/${newId}`;

      // Obtener vacantes del localStorage
      const savedVacantes = localStorage.getItem('vacantes');
      let vacantes = savedVacantes ? JSON.parse(savedVacantes) : [];

      // Agregar nueva vacante
      const newVacante = {
        id: newId,
        titulo,
        descripcion,
        departamento,
        aplicarLink,
      };

      vacantes.push(newVacante);
      localStorage.setItem('vacantes', JSON.stringify(vacantes));

      // Mostrar el link
      alert(`✅ Vacante creada exitosamente!\n\nLink de aplicación:\n${aplicarLink}`);

      // Limpiar formulario
      setTitulo('');
      setDescripcion('');
      setDepartamento('');
    } catch (err) {
      setError('Error al crear la vacante');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 p-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/" className="text-zinc-400 hover:text-white mb-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-2xl">Crear Nueva Vacante</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-950/30 border border-red-800/40 rounded-lg p-4">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Título de la Vacante *
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Desarrollador Senior React"
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Descripción
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe la posición, responsabilidades y requisitos..."
                rows={5}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Departamento
              </label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ej: Tecnología, Ventas, etc."
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleCrear}
                disabled={isCreating}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isCreating ? 'Creando...' : 'Crear Vacante'}
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="secondary" className="w-full">
                  Cancelar
                </Button>
              </Link>
            </div>

            <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/40">
              <p className="text-xs text-zinc-400">
                💡 <strong>Tip:</strong> Después de crear la vacante, recibirás un link que puedes compartir en LinkedIn o WhatsApp para que los candidatos se postulen.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
