'use client';

import { FormEvent, use, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { Logo } from '@/components/brand';
import { Reveal } from '@/components/ui/reveal';
import { textareaClass } from '@/components/ui/field';
import { CheckCircle2, Loader } from 'lucide-react';

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
    <main className="min-h-full w-full bg-background px-4 py-10 sm:py-14">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div className="flex justify-center">
          <Logo className="text-base" />
        </div>

        {estado === 'cargando' && (
          <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader className="size-4 animate-spin" aria-hidden="true" />
            Cargando evaluación…
          </div>
        )}

        {estado === 'error' && (
          <Alert variant="destructive">No se pudo cargar la evaluación. Recarga la página en unos minutos.</Alert>
        )}

        {estado === 'no_disponible' && (
          <Reveal>
            <Card className="py-6 text-center">
              <p className="text-pretty">{MOTIVOS[motivo] ?? MOTIVOS.invalida}</p>
            </Card>
          </Reveal>
        )}

        {estado === 'enviada' && (
          <Reveal>
            <Card className="flex flex-col items-center gap-3 py-8 text-center">
              <CheckCircle2 className="size-12 text-success" aria-hidden="true" />
              <p className="text-lg font-semibold">¡Respuestas enviadas!</p>
              <p className="text-sm text-muted-foreground text-pretty">
                La empresa revisará tu evaluación y se pondrá en contacto contigo.
              </p>
            </Card>
          </Reveal>
        )}

        {(estado === 'lista' || estado === 'enviando') && datos && (
          <Reveal>
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
                <form onSubmit={enviar} className="flex flex-col gap-8">
                  {datos.preguntas.opcion_multiple.map((p, i) => (
                    <fieldset key={`om-${i}`} className="flex flex-col gap-3">
                      <legend className="mb-1 font-medium text-pretty">
                        {i + 1}. {p.pregunta}
                      </legend>
                      {p.opciones.map((opcion, j) => (
                        <label
                          key={j}
                          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-muted has-checked:border-foreground has-checked:ring-1 has-checked:ring-foreground has-disabled:cursor-not-allowed has-disabled:opacity-60"
                        >
                          <input
                            type="radio"
                            name={`om-${i}`}
                            value={j}
                            checked={opciones[i] === j}
                            onChange={() => setOpciones((prev) => prev.map((v, k) => (k === i ? j : v)))}
                            disabled={estado === 'enviando'}
                            className="size-4 accent-primary"
                          />
                          {opcion}
                        </label>
                      ))}
                    </fieldset>
                  ))}

                  {datos.preguntas.abiertas.map((p, i) => {
                    const numero = datos.preguntas.opcion_multiple.length + i + 1;
                    return (
                      <div key={`ab-${i}`} className="flex flex-col gap-2">
                        <label htmlFor={`ab-${i}`} className="font-medium text-pretty">
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
                          className={textareaClass}
                        />
                      </div>
                    );
                  })}

                  {error && <Alert variant="destructive">{error}</Alert>}

                  <Button type="submit" isLoading={estado === 'enviando'} className="w-full">
                    Enviar respuestas
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Reveal>
        )}
      </div>
    </main>
  );
}
