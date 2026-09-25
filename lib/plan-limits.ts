// Los límites del plan Demo los aplica la base (trigger enforce_plan_limits); aquí solo se traduce su error.
export function isPlanLimitError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.startsWith('plan_limit:'));
}

export const PLAN_LIMIT_MESSAGES = {
  vacantes: 'El plan Demo permite 1 vacante. Actualiza a Premium para crear más.',
  candidatos: 'Esta vacante no está recibiendo más postulaciones en este momento.',
  evaluaciones: 'El plan Demo permite 1 evaluación. Actualiza a Premium para enviar más.',
} as const;
