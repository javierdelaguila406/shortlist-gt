const PESO_CV = 0.6;
const PESO_PRUEBA = 0.4;

export function ajusteAPlaza(scoreCv: number | null | undefined, scorePrueba: number | null | undefined): number | null {
  if (scoreCv == null) return null;
  if (scorePrueba == null) return Math.round(scoreCv);
  return Math.round(PESO_CV * scoreCv + PESO_PRUEBA * scorePrueba);
}
