export const REPORT_HEADERS = ['email', 'nombre', 'estado', 'score_total', 'fecha_postulacion'] as const;
const MAX_RANGE_MS = 730 * 24 * 60 * 60 * 1000;

export function validateReportRange(desde?: string, hasta?: string): string | null {
  if (!desde || !hasta) return 'Selecciona fecha inicial y final';
  const start = new Date(`${desde}T00:00:00.000Z`);
  const end = new Date(`${hasta}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 'Selecciona fecha inicial y final';
  }
  if (start > end) return 'Fecha inicial debe ser anterior a final';
  if (end.getTime() - start.getTime() > MAX_RANGE_MS) return 'Máximo 2 años';
  return null;
}

type CandidateRecord = {
  email?: string | null;
  nombre?: string | null;
  estado?: string | null;
  score_total?: number | null;
  score_ia?: number | null;
  created_at?: string | null;
};

export function buildReportRows(candidates: CandidateRecord[]) {
  const seen = new Set<string>();
  return candidates.flatMap((candidate) => {
    const key = `${candidate.email || ''}|${candidate.created_at || ''}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      email: candidate.email || '',
      nombre: candidate.nombre || '',
      estado: candidate.estado || '',
      score_total: candidate.score_total ?? candidate.score_ia ?? 'No evaluado',
      fecha_postulacion: candidate.created_at || '',
    }];
  });
}
