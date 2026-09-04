'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Upload, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PostularPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    disponibilidad: '',
    salario: '',
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [consentimiento, setConsentimiento] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') {
      setCvFile(file);
    } else {
      alert('Por favor, sube un archivo PDF');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    if (file?.type === 'application/pdf') {
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cvFile) {
      alert('Por favor, sube tu CV en PDF');
      return;
    }
    if (!consentimiento) {
      alert('Debes aceptar la Política de Privacidad y los términos para continuar');
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('telefono', formData.telefono);
      formDataToSend.append('disponibilidad', formData.disponibilidad);
      formDataToSend.append('salario', formData.salario);
      formDataToSend.append('slug', slug);
      formDataToSend.append('cv', cvFile);

      const response = await fetch('/api/candidatos/postular', {
        method: 'POST',
        body: formDataToSend,
      });

      const data = await response.json();

      // Accept any 2xx or fallback responses
      if (response.ok || data.success) {
        setSubmitted(true);
        setTimeout(() => {
          setFormData({ nombre: '', email: '', telefono: '', disponibilidad: '', salario: '' });
          setCvFile(null);
          setSubmitted(false);
        }, 4000);
      } else {
        throw new Error(data.error || 'Error al enviar la solicitud');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error al procesar tu solicitud. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="text-4xl mb-4">✅</div>
            <CardTitle>¡Solicitud Recibida!</CardTitle>
            <CardDescription>
              Gracias por tu interés. Te enviaremos un mensaje de WhatsApp pronto.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Únete a Nuestro Equipo</h1>
          <p className="text-zinc-400">
            Completa tu perfil y compartir tu CV. Te contactaremos por WhatsApp.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>Ayúdanos a conocerte mejor</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  <Phone className="inline w-4 h-4 mr-2" />
                  Teléfono WhatsApp
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="+502 XXXX XXXX"
                  required
                />
              </div>

              {/* Availability */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Disponibilidad
                </label>
                <select
                  name="disponibilidad"
                  value={formData.disponibilidad}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  required
                >
                  <option value="">Selecciona una opción</option>
                  <option value="inmediata">Inmediata</option>
                  <option value="dos_semanas">2 Semanas</option>
                  <option value="mes">1 Mes</option>
                  <option value="negociable">Negociable</option>
                </select>
              </div>

              {/* Salary */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Expectativa Salarial
                </label>
                <input
                  type="text"
                  name="salario"
                  value={formData.salario}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Q XXX,XXX - Q YYY,YYY"
                />
              </div>

              {/* CV Upload */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-4">
                  <Upload className="inline w-4 h-4 mr-2" />
                  Sube tu CV (PDF)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center
                    transition-colors cursor-pointer
                    ${
                      cvFile
                        ? 'border-emerald-500 bg-emerald-950/20'
                        : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/50'
                    }
                  `}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="w-8 h-8 mx-auto mb-2 text-zinc-500" />
                  <p className="text-sm text-zinc-300">
                    {cvFile ? cvFile.name : 'Arrastra tu CV aquí o haz clic para seleccionar'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">PDF, máximo 5MB</p>
                </div>
              </div>

              {/* Consentimiento */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    className="w-5 h-5 rounded border-zinc-600 text-emerald-500 focus:ring-emerald-500 mt-0.5"
                  />
                  <span className="text-sm text-zinc-300">
                    He leído y acepto la{' '}
                    <a href="/privacidad" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                      Política de Privacidad
                    </a>{' '}
                    y los{' '}
                    <a href="/terminos" target="_blank" className="text-emerald-400 hover:text-emerald-300 underline">
                      Términos de Servicio
                    </a>
                    . Autorizo el contacto vía WhatsApp y el procesamiento de mi CV mediante Inteligencia Artificial para esta vacante.
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={!consentimiento}
                isLoading={isLoading}
                className="w-full mt-8"
                size="lg"
              >
                Enviar Solicitud
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
