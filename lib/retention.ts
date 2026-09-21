import { createClient } from '@supabase/supabase-js';
import { syncDeleteVacante } from './dual-sync';

const DAY_MS = 24 * 60 * 60 * 1000;

export async function runRetentionJobs(now = new Date()) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error('Retention configuration is incomplete');
  }

  const supabase = createClient(url, serviceRole);
  const oneYearAgo = new Date(now.getTime() - 365 * DAY_MS).toISOString();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * DAY_MS).toISOString();

  const { data: oneYearVacancies, error: candidateLookupError } = await supabase
    .from('vacantes')
    .select('id')
    .eq('estado', 'cerrada')
    .lt('updated_at', oneYearAgo);
  if (candidateLookupError) throw candidateLookupError;

  for (const vacancy of oneYearVacancies || []) {
    const { error } = await supabase.from('candidatos').delete().eq('vacante_id', vacancy.id);
    if (error) throw error;
  }

  const { data: expiredVacancies, error: vacancyLookupError } = await supabase
    .from('vacantes')
    .select('id')
    .eq('estado', 'cerrada')
    .lt('updated_at', ninetyDaysAgo);
  if (vacancyLookupError) throw vacancyLookupError;

  for (const vacancy of expiredVacancies || []) {
    const mirrorDeleted = await syncDeleteVacante(vacancy.id);
    if (!mirrorDeleted) throw new Error(`Mirror deletion failed for vacancy ${vacancy.id}`);
  }

  const { error: vacancyDeleteError } = await supabase
    .from('vacantes')
    .delete()
    .eq('estado', 'cerrada')
    .lt('updated_at', ninetyDaysAgo);
  if (vacancyDeleteError) throw vacancyDeleteError;

  console.log('[Retention] Jobs completed', {
    candidateVacancies: oneYearVacancies?.length || 0,
    vacancies: expiredVacancies?.length || 0,
  });

  return {
    candidateVacanciesProcessed: oneYearVacancies?.length || 0,
    vacanciesProcessed: expiredVacancies?.length || 0,
  };
}
