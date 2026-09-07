'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockVacantes } from '@/lib/mock-data';
import { ArrowLeft, Upload, CheckCircle } from 'lucide-react';

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  experiencia: string;
  habilidades: string;
  cv: File | null;
  carta_presentacion: string;
}

export default function PostularPage({ params }: { params: { slug: string } }) {
  const vacante = mockVacantes.find(v => v.id === params.slug);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    email: '',
    telefono: '',
    experiencia: '',
    habilidades: '',
    cv: null,
    carta_presentacion: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFileName, setCvFileName] = useState('');

  if (!vacante) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
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
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, cv: file }));
      setCvFileName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('experiencia', formData.experiencia);
      formDataToSend.append('habilidades', formData.habilidades);
      formDataToSend.append('carta_presentacion', formData.carta_presentacion);
      formDataToSend.append('vacante_id', params.slug);
      if (formData.cv) formDataToSend.append('cv', formData.cv);

      const response = await fetch('/api/candidatos/postular', {
        method: 'POST',
        body: formDataToSend,
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => { window.location.href = '/'; }, 2000);
      }
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
            <p className="text-zinc-400">Redirigiendo...</p>
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
            <CardDescription>Postúlate a: {vacante.titulo}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="text" name="nombre" placeholder="Nombre" value={formData.nombre} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
              <input type="tel" name="telefono" placeholder="Teléfono" value={formData.telefono} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
              <input type="text" name="experiencia" placeholder="Años de experiencia" value={formData.experiencia} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" />
              <textarea name="habilidades" placeholder="Habilidades" value={formData.habilidades} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white h-24 resize-none" />
              <textarea name="carta_presentacion" placeholder="Carta de presentación" value={formData.carta_presentacion} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white h-24 resize-none" />
              <label className="block">
                <span className="text-white text-sm mb-2 block">Currículum (PDF/DOC)</span>
                <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white" required />
                {cvFileName && <p className="text-xs text-emerald-400 mt-1">{cvFileName}</p>}
              </label>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
