export function getPostulationPath(vacancyId: string): string {
  if (!vacancyId.trim()) throw new Error('Vacancy ID is required');
  return `/postular/${encodeURIComponent(vacancyId)}`;
}
