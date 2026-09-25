import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';

export const EVALUACION_VIGENCIA_DIAS = 7;
export const MAX_RESPUESTA_ABIERTA = 2000;

type Pregunta = {
  pregunta?: unknown;
  opciones?: unknown;
  respuesta_correcta?: unknown;
};

export type PreguntasEvaluacion = {
  pre_entrevista?: Pregunta[] | null;
  prueba_tecnica?: Pregunta[] | null;
  preguntas_video?: Pregunta[] | null;
};

export type PreguntasPublicas = {
  abiertas: { pregunta: string }[];
  opcion_multiple: { pregunta: string; opciones: string[] }[];
};

export function newEvaluationToken() {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashEvaluationToken(token) };
}

export function hashEvaluationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function isWellFormedToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}

const texto = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const lista = (value: unknown): Pregunta[] => (Array.isArray(value) ? value : []);

function preguntasOpcionMultiple(preguntas: PreguntasEvaluacion) {
  return lista(preguntas.prueba_tecnica)
    .map((p) => ({
      pregunta: texto(p.pregunta),
      opciones: Array.isArray(p.opciones) ? p.opciones.map(texto).filter(Boolean) : [],
      correcta: typeof p.respuesta_correcta === 'number' ? p.respuesta_correcta : null,
    }))
    .filter((p) => p.pregunta && p.opciones.length >= 2);
}

function preguntasAbiertas(preguntas: PreguntasEvaluacion) {
  return [...lista(preguntas.pre_entrevista), ...lista(preguntas.preguntas_video)]
    .map((p) => ({ pregunta: texto(p.pregunta) }))
    .filter((p) => p.pregunta);
}

// Lo único que llega al navegador del candidato: nunca respuestas correctas ni criterios.
export function publicQuestions(preguntas: PreguntasEvaluacion): PreguntasPublicas {
  return {
    abiertas: preguntasAbiertas(preguntas),
    opcion_multiple: preguntasOpcionMultiple(preguntas).map(({ pregunta, opciones }) => ({ pregunta, opciones })),
  };
}

export function hasQuestions(preguntas: PreguntasEvaluacion): boolean {
  const publicas = publicQuestions(preguntas);
  return publicas.abiertas.length + publicas.opcion_multiple.length > 0;
}

export function respuestasSchema(preguntas: PreguntasEvaluacion) {
  const publicas = publicQuestions(preguntas);
  return z.object({
    abiertas: z.array(z.string().trim().max(MAX_RESPUESTA_ABIERTA)).length(publicas.abiertas.length),
    opcion_multiple: z.array(z.number().int().min(-1)).length(publicas.opcion_multiple.length)
      .refine(
        (valores) => valores.every((v, i) => v < publicas.opcion_multiple[i].opciones.length),
        { message: 'opción fuera de rango' }
      ),
  });
}

export type Respuestas = { abiertas: string[]; opcion_multiple: number[] };

// Puntaje 0–100 sobre las preguntas de opción múltiple con respuesta correcta definida.
// Sin preguntas calificables devuelve null: solo hay respuestas abiertas para revisión humana.
export function scoreAnswers(preguntas: PreguntasEvaluacion, respuestas: Respuestas) {
  const calificables = preguntasOpcionMultiple(preguntas)
    .map((p, i) => ({ correcta: p.correcta, elegida: respuestas.opcion_multiple[i] }))
    .filter((p) => p.correcta !== null);
  if (calificables.length === 0) return { score: null, correctas: 0, total: 0 };
  const correctas = calificables.filter((p) => p.elegida === p.correcta).length;
  return { score: Math.round((correctas / calificables.length) * 100), correctas, total: calificables.length };
}
