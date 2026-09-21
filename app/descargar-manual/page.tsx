'use client';

import { useState, useEffect } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DescargarManualPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const descargarPDF = async () => {
    setLoading(true);
    setError('');

    try {
      // Descargar el HTML del manual
      const response = await fetch('/api/descargar/manual');
      const data = await response.json();

      if (!response.ok || !data.html) {
        throw new Error('Error descargando el manual');
      }

      // Crear un iframe temporal para renderizar el HTML
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(data.html);
        doc.close();

        // Esperar a que cargue el contenido
        setTimeout(() => {
          // Usar html2pdf para convertir a PDF
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';

          script.onload = () => {
            const element = doc.body;
            const opt = {
              margin: 10,
              filename: 'MANUAL_DE_USUARIO.pdf',
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
            };

            // @ts-expect-error - html2pdf no tiene tipos definidos
            html2pdf().set(opt).from(element).save();

            // Limpiar iframe
            setTimeout(() => {
              document.body.removeChild(iframe);
              setLoading(false);
            }, 1000);
          };

          document.head.appendChild(script);
        }, 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-white">
              SHORTLIST<span className="text-emerald-500">.GT</span>
            </h1>
            <p className="text-zinc-400">Manual de Usuario</p>
          </div>

          <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <span className="text-2xl">📖</span>
              <div>
                <p className="font-semibold">Manual Completo</p>
                <p className="text-sm text-zinc-500">Guía de uso de la plataforma</p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-3 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={descargarPDF}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-900 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            {loading ? 'Generando PDF...' : 'Descargar PDF'}
          </button>

          <Link
            href="/"
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al inicio
          </Link>

          <p className="text-xs text-zinc-500 text-center">
            ✨ PDF completo con guías, tutoriales y funcionalidades
          </p>
        </div>
      </div>
    </div>
  );
}
