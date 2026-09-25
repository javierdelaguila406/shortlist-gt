import { describe, expect, test } from 'vitest';
import {
  hashEvaluationToken,
  isWellFormedToken,
  newEvaluationToken,
  publicQuestions,
  respuestasSchema,
  scoreAnswers,
} from '@/lib/evaluaciones';
import { UMBRAL_PRECALIFICADO, evaluarCV } from '@/lib/cv-score';
import { isPdf } from '@/lib/pdf';

const preguntas = {
  pre_entrevista: [{ pregunta: '¿Por qué te interesa el puesto?', criterio: 'motivación' }],
  prueba_tecnica: [
    { pregunta: '¿2 + 2?', opciones: ['3', '4'], respuesta_correcta: 1, criterio: 'aritmética' },
    { pregunta: '¿Capital de Guatemala?', opciones: ['Guatemala', 'Quetzaltenango', 'Antigua'], respuesta_correcta: 0 },
  ],
  preguntas_video: [{ pregunta: 'Cuéntanos un reto que resolviste' }],
};

describe('enlace de evaluación', () => {
  test('genera tokens de 256 bits y guarda solo su hash', () => {
    const { token, hash } = newEvaluationToken();
    expect(isWellFormedToken(token)).toBe(true);
    expect(hash).toBe(hashEvaluationToken(token));
    expect(hash).not.toContain(token);
    expect(newEvaluationToken().token).not.toBe(token);
  });

  test('rechaza tokens mal formados', () => {
    expect(isWellFormedToken('abc')).toBe(false);
    expect(isWellFormedToken('../../etc/passwd'.padEnd(43, 'a'))).toBe(false);
  });
});

describe('preguntas que ve el candidato', () => {
  test('nunca incluyen respuestas correctas ni criterios', () => {
    const publicas = publicQuestions(preguntas);
    const json = JSON.stringify(publicas);
    expect(json).not.toContain('respuesta_correcta');
    expect(json).not.toContain('criterio');
    expect(json).not.toContain('aritmética');
    expect(publicas.opcion_multiple).toHaveLength(2);
    expect(publicas.abiertas.map((p) => p.pregunta)).toEqual([
      '¿Por qué te interesa el puesto?',
      'Cuéntanos un reto que resolviste',
    ]);
  });
});

describe('calificación de respuestas', () => {
  test('calcula el puntaje sobre las preguntas de opción múltiple', () => {
    expect(scoreAnswers(preguntas, { abiertas: ['a', 'b'], opcion_multiple: [1, 0] }).score).toBe(100);
    expect(scoreAnswers(preguntas, { abiertas: ['a', 'b'], opcion_multiple: [1, 2] }).score).toBe(50);
    expect(scoreAnswers(preguntas, { abiertas: ['a', 'b'], opcion_multiple: [0, 2] }).score).toBe(0);
  });

  test('sin preguntas calificables devuelve null (revisión humana)', () => {
    expect(scoreAnswers({ pre_entrevista: preguntas.pre_entrevista }, { abiertas: ['a'], opcion_multiple: [] }).score).toBeNull();
  });

  test('valida la forma de las respuestas', () => {
    const schema = respuestasSchema(preguntas);
    expect(schema.safeParse({ abiertas: ['a', 'b'], opcion_multiple: [1, 0] }).success).toBe(true);
    expect(schema.safeParse({ abiertas: ['a'], opcion_multiple: [1, 0] }).success).toBe(false);
    expect(schema.safeParse({ abiertas: ['a', 'b'], opcion_multiple: [1, 5] }).success).toBe(false);
    expect(schema.safeParse({ abiertas: ['a', 'x'.repeat(2001)], opcion_multiple: [1, 0] }).success).toBe(false);
  });
});

describe('puntaje del CV', () => {
  test('usa el umbral de 70 para precalificar', () => {
    expect(UMBRAL_PRECALIFICADO).toBe(70);
    const fuerte = evaluarCV(
      'Licenciatura en sistemas. 6 años de experiencia como analista de datos con SQL y Python. Liderazgo de equipo y proyectos. email',
      'Analista de datos',
      'Analista con SQL y Python'
    );
    expect(fuerte).toMatchObject({ evaluado: true, estado: 'precalificado' });
    expect(fuerte.score).toBeGreaterThanOrEqual(70);
  });

  test('un CV sin texto legible queda como no evaluado, sin puntaje inventado', () => {
    expect(evaluarCV('   ', 'Analista', 'SQL')).toEqual({ evaluado: false, score: 0, estado: 'pendiente' });
  });

  test('reconoce la firma de un PDF', () => {
    expect(isPdf(Buffer.from('%PDF-1.4\n...'))).toBe(true);
    expect(isPdf(Buffer.from('<html>'))).toBe(false);
  });
});
