import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { cvObjectPath } from './authz';

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
    await deleteCandidates(supabase, vacancy.id);
  }

  const { data: expiredVacancies, error: vacancyLookupError } = await supabase
    .from('vacantes')
    .select('id')
    .eq('estado', 'cerrada')
    .lt('updated_at', ninetyDaysAgo);
  if (vacancyLookupError) throw vacancyLookupError;

  // Las claves foráneas de estas tablas no borran en cascada.
  for (const vacancy of expiredVacancies || []) {
    await deleteCandidates(supabase, vacancy.id);
    for (const table of ['evaluaciones_whatsapp', 'vacante_preguntas']) {
      const { error } = await supabase.from(table).delete().eq('vacante_id', vacancy.id);
      if (error) throw error;
    }
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

async function deleteCandidates(supabase: SupabaseClient, vacancyId: string) {
  const { data: rows } = await supabase.from('candidatos').select('cv_url').eq('vacante_id', vacancyId);
  const paths = ((rows || []) as { cv_url: string | null }[])
    .map((row) => cvObjectPath(row.cv_url))
    .filter((path): path is string => Boolean(path));

  const { error: evaluationsError } = await supabase.from('evaluaciones_whatsapp').delete().eq('vacante_id', vacancyId);
  if (evaluationsError) throw evaluationsError;
  const { error } = await supabase.from('candidatos').delete().eq('vacante_id', vacancyId);
  if (error) throw error;
  if (paths.length > 0) await supabase.storage.from('cvs').remove(paths);
}
