'use client';

import { FormEvent, use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type Preguntas = {
  abiertas: { pregunta: string }[];
  opcion_multiple: { pregunta: string; opciones: string[] }[];
};
type Datos = { vacante: string; empresa: string; expira_en: string; preguntas: Preguntas };
type Estado = 'cargando' | 'lista' | 'enviando' | 'enviada' | 'no_disponible' | 'error';

const MOTIVOS: Record<string, string> = {
  completada: 'Ya enviaste esta evaluación. ¡Gracias por participar!',
  expirada: 'Este enlace venció. Pide a la empresa que te envíe uno nuevo.',
  anulada: 'Este enlace fue reemplazado por uno más reciente. Revisa el último enlace que recibiste.',
  invalida: 'El enlace no es válido. Revisa que lo hayas copiado completo.',
};

export default function EvaluacionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [motivo, setMotivo] = useState('invalida');
  const [datos, setDatos] = useState<Datos | null>(null);
  const [abiertas, setAbiertas] = useState<string[]>([]);
  const [opciones, setOpciones] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/evaluacion/${encodeURIComponent(token)}`)
      .then(async (res) => ({ res, data: await res.json().catch(() => ({})) }))
      .then(({ res, data }) => {
        if (cancelado) return;
        if (res.ok) {
          setDatos(data as Datos);
          setAbiertas((data as Datos).preguntas.abiertas.map(() => ''));
          setOpciones((data as Datos).preguntas.opcion_multiple.map(() => -1));
          setEstado('lista');
        } else if (res.status === 404 || res.status === 410) {
          setMotivo(data.estado ?? 'invalida');
          setEstado('no_disponible');
        } else {
          setEstado('error');
        }
      })
      .catch(() => { if (!cancelado) setEstado('error'); });
    return () => { cancelado = true; };
  }, [token]);

  const enviar = async (event: FormEvent) => {
    event.preventDefault();
    if (abiertas.some((respuesta) => !respuesta.trim()) || opciones.some((opcion) => opcion < 0)) {
      setError('Responde todas las preguntas antes de enviar.');
      return;
    }
    if (!window.confirm('¿Enviar tus respuestas? No podrás cambiarlas después.')) return;

    setError('');
    setEstado('enviando');
    try {
      const res = await fetch(`/api/evaluacion/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abiertas, opcion_multiple: opciones }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setEstado('enviada');
      } else if (res.status === 410) {
        setMotivo(data.estado ?? 'completada');
        setEstado('no_disponible');
      } else {
        setError(data.error || 'No se pudieron enviar tus respuestas. Intenta de nuevo.');
        setEstado('lista');
      }
    } catch {
      setError('No hay conexión. Revisa tu internet e intenta de nuevo.');
      setEstado('lista');
    }
  };

  return (
    <main className="min-h-full bg-zinc-950 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="mb-6 text-center text-2xl font-bold text-white">
          SHORTLIST<span className="text-emerald-500">.GT</span>
        </p>

        {estado === 'cargando' && <p role="status" className="text-center text-zinc-400">Cargando evaluación…</p>}

        {estado === 'error' && (
          <p role="alert" className="text-center text-red-400">
            No se pudo cargar la evaluación. Recarga la página en unos minutos.
          </p>
        )}

        {estado === 'no_disponible' && (
          <Card>
            <CardContent className="py-8 text-center text-zinc-300">{MOTIVOS[motivo] ?? MOTIVOS.invalida}</CardContent>
          </Card>
        )}

        {estado === 'enviada' && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-lg font-semibold text-white">¡Respuestas enviadas!</p>
              <p className="mt-2 text-zinc-400">La empresa revisará tu evaluación y se pondrá en contacto contigo.</p>
            </CardContent>
          </Card>
        )}

        {(estado === 'lista' || estado === 'enviando') && datos && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluación: {datos.vacante}</CardTitle>
              <CardDescription>
                {datos.empresa ? `${datos.empresa} · ` : ''}
                Disponible hasta el {new Date(datos.expira_en).toLocaleDateString('es-GT', { day: 'numeric', month: 'long' })}.
                Solo puedes enviarla una vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={enviar} className="space-y-8">
                {datos.preguntas.opcion_multiple.map((p, i) => (
                  <fieldset key={`om-${i}`} className="space-y-3">
                    <legend className="font-medium text-white">
                      {i + 1}. {p.pregunta}
                    </legend>
                    {p.opciones.map((opcion, j) => (
                      <label key={j} className="flex min-h-11 cursor-pointer items-center gap-3 rounded border border-zinc-700 px-3 py-2 text-zinc-200 hover:bg-zinc-800">
                        <input
                          type="radio"
                          name={`om-${i}`}
                          value={j}
                          checked={opciones[i] === j}
                          onChange={() => setOpciones((prev) => prev.map((v, k) => (k === i ? j : v)))}
                          disabled={estado === 'enviando'}
                        />
                        {opcion}
                      </label>
                    ))}
                  </fieldset>
                ))}

                {datos.preguntas.abiertas.map((p, i) => {
                  const numero = datos.preguntas.opcion_multiple.length + i + 1;
                  return (
                    <div key={`ab-${i}`} className="space-y-2">
                      <label htmlFor={`ab-${i}`} className="block font-medium text-white">
                        {numero}. {p.pregunta}
                      </label>
                      <textarea
                        id={`ab-${i}`}
                        value={abiertas[i]}
                        onChange={(e) => setAbiertas((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))}
                        maxLength={2000}
                        rows={4}
                        required
                        disabled={estado === 'enviando'}
                        className="w-full rounded border border-zinc-700 bg-zinc-900 p-3 text-zinc-100"
                      />
                    </div>
                  );
                })}

                {error && <p role="alert" className="text-sm text-red-400">{error}</p>}

                <Button type="submit" disabled={estado === 'enviando'} className="min-h-11 w-full bg-emerald-600 hover:bg-emerald-700">
                  {estado === 'enviando' ? 'Enviando…' : 'Enviar respuestas'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
