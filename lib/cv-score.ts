export const UMBRAL_PRECALIFICADO = 70;
export const MIN_TEXTO_EVALUABLE = 20;

const PALABRAS_ALTO_VALOR = [
  'liderazgo', 'leadership', 'gestión', 'management',
  'análisis', 'analysis', 'diseño', 'design',
  'implementación', 'implementation', 'éxito', 'success',
  'proyecto', 'project', 'equipo', 'team', 'cliente', 'client',
];

// Compara el CV con el título y la descripción de la vacante. Devuelve 25–100.
export function calculateCVScore(cvText: string, plazaTitulo: string, plazaDesc: string): number {
  const cv = cvText.toLowerCase();
  const plaza = `${plazaTitulo} ${plazaDesc}`.toLowerCase();
  let score = 30;

  const expMatch = cv.match(/(\d+)\s*(?:años|years|experience|años de experiencia)/i);
  if (expMatch) {
    const years = Number.parseInt(expMatch[1], 10) || 0;
    if (years >= 5) score += 20;
    else if (years >= 3) score += 15;
    else if (years >= 1) score += 10;
    else score += 5;
  } else if (/\b(experiencia|experience|trabajé|worked|desarrollé|developed)\b/i.test(cv)) {
    score += 8;
  }

  if (/\b(licenciatura|licenciado|degree|bachelor|ingeniero|engineer|máster|master)\b/i.test(cv)) {
    score += 15;
  } else if (/\b(técnico|técnica|diploma|certificado|certified)\b/i.test(cv)) {
    score += 8;
  }

  const keywords = new Set(plaza.match(/\b\w{4,}\b/g) || []);
  if (keywords.size > 0) {
    let matches = 0;
    for (const keyword of keywords) if (cv.includes(keyword)) matches += 1;
    score += Math.min(35, (matches / keywords.size) * 35);
  }

  const highValue = PALABRAS_ALTO_VALOR.filter((keyword) => cv.includes(keyword)).length;
  score += Math.min(10, highValue * 2);

  if (/email|linkedin|teléfono|phone/.test(cv)) score += 5;

  return Math.min(100, Math.max(25, Math.round(score)));
}

export function evaluarCV(cvText: string, plazaTitulo: string, plazaDesc: string) {
  const evaluado = cvText.trim().length >= MIN_TEXTO_EVALUABLE;
  const score = evaluado ? calculateCVScore(cvText, plazaTitulo, plazaDesc) : 0;
  const estado = evaluado && score >= UMBRAL_PRECALIFICADO ? 'precalificado' : 'pendiente';
  return { evaluado, score, estado };
}
