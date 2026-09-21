/**
 * Dual Sync - Sincroniza datos entre Supabase y Godaddy
 * Solo para lesters@furniturecity.com.gt
 */

import { createClient } from '@supabase/supabase-js';
import {
  insertGodaddyRecord,
  updateGodaddyRecord,
  getGodaddyRecord,
  deleteGodaddyRecord,
} from './godaddy-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const SYNC_EMAIL = 'lesters@furniturecity.com.gt';

function shouldSync(email: string): boolean {
  return email?.toLowerCase() === SYNC_EMAIL.toLowerCase();
}

/**
 * Crear usuario en ambas bases de datos (solo si es lesters@furniturecity.com.gt)
 */
export async function syncCreateUser(userData: {
  id: string;
  email: string;
  nombre: string;
  plan: 'demo' | 'premium';
}) {
  try {
    // Siempre guardar en Supabase
    const supabaseResult = await supabase
      .from('companies')
      .insert({
        user_id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        plan: userData.plan,
        created_at: new Date().toISOString(),
      })
      .select();

    let godaddyResult = true;

    // Solo sincronizar con Godaddy si es el usuario específico
    if (shouldSync(userData.email)) {
      godaddyResult = await insertGodaddyRecord('companies', {
        id: `cmp_${userData.id.substring(0, 8)}`,
        user_id: userData.id,
        email: userData.email,
        nombre: userData.nombre,
        plan: userData.plan,
        created_at: new Date().toISOString(),
      });
      console.log('[SYNC] User created in Godaddy', { userId: userData.id });
    } else {
      console.log('[SYNC] User skipped Godaddy', { userId: userData.id });
    }

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data,
    };
  } catch (error) {
    console.error('[SYNC] Error creating user:', error);
    return {
      supabase: false,
      godaddy: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Crear vacante en ambas bases de datos (solo si pertenece a lesters@furniturecity.com.gt)
 */
export async function syncCreateVacante(vacanteData: {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
  userEmail?: string;
}) {
  try {
    // Siempre guardar en Supabase
    const supabaseResult = await supabase
      .from('vacantes')
      .upsert({
        id: vacanteData.id,
        usuario_id: vacanteData.usuario_id,
        titulo: vacanteData.titulo,
        descripcion: vacanteData.descripcion,
        departamento: vacanteData.departamento,
        estado: 'activa',
        created_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select();

    let godaddyResult = true;

    // Solo sincronizar con Godaddy si es el usuario específico
    if (vacanteData.userEmail && shouldSync(vacanteData.userEmail)) {
      const correlationId = `vacante:${vacanteData.id}`;
      const existingVacante = await getGodaddyRecord('vacantes', vacanteData.id);
      const godaddyVacante = {
        id: vacanteData.id,
        usuario_id: vacanteData.usuario_id,
        titulo: vacanteData.titulo,
        descripcion: vacanteData.descripcion,
        departamento: vacanteData.departamento,
        estado: 'activa',
        created_at: new Date().toISOString(),
      };

      godaddyResult = existingVacante
        ? await updateGodaddyRecord('vacantes', vacanteData.id, godaddyVacante)
        : await insertGodaddyRecord('vacantes', godaddyVacante);
      console.log('[SYNC] Vacante synchronized in Godaddy:', {
        correlationId,
        operation: existingVacante ? 'update' : 'insert',
      });
    } else {
      console.log('[SYNC] Vacante skipped Godaddy (not target user)');
    }

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data,
    };
  } catch (error) {
    console.error('[SYNC] Error creating vacante:', error);
    return {
      supabase: false,
      godaddy: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function syncDeleteVacante(vacanteId: string): Promise<boolean> {
  const configured = [
    process.env.GODADDY_MYSQL_HOST,
    process.env.GODADDY_MYSQL_USER,
    process.env.GODADDY_MYSQL_PASSWORD,
    process.env.GODADDY_MYSQL_DATABASE,
    process.env.GODADDY_MYSQL_PORT,
  ].every(Boolean);

  if (!configured) {
    console.log('[SYNC] Mirror deletion skipped: integration not configured', {
      correlationId: `vacante:${vacanteId}`,
    });
    return true;
  }

  return deleteGodaddyRecord('vacantes', vacanteId);
}

/**
 * Crear candidato en ambas bases de datos (solo si pertenece a lesters@furniturecity.com.gt)
 */
export async function syncCreateCandidato(candidatoData: {
  id: string;
  vacante_id: string;
  nombre: string;
  email: string;
  telefono: string;
  cv_url?: string;
  score_ia: number;
  experiencia_anos?: number;
  recruiterEmail?: string;
}) {
  try {
    // Siempre guardar en Supabase
    const supabaseResult = await supabase
      .from('candidatos')
      .insert({
        id: candidatoData.id,
        vacante_id: candidatoData.vacante_id,
        nombre: candidatoData.nombre,
        email: candidatoData.email,
        telefono: candidatoData.telefono,
        cv_url: candidatoData.cv_url,
        estado: candidatoData.score_ia >= 70 ? 'precalificado' : 'pendiente',
        score_ia: candidatoData.score_ia,
        experiencia_anos: candidatoData.experiencia_anos,
        created_at: new Date().toISOString(),
      })
      .select();

    let godaddyResult = true;

    // Solo sincronizar con Godaddy si es el usuario específico
    if (candidatoData.recruiterEmail && shouldSync(candidatoData.recruiterEmail)) {
      godaddyResult = await insertGodaddyRecord('candidatos', {
        id: candidatoData.id,
        vacante_id: candidatoData.vacante_id,
        nombre: candidatoData.nombre,
        email: candidatoData.email,
        telefono: candidatoData.telefono,
        cv_url: candidatoData.cv_url,
        estado: candidatoData.score_ia >= 70 ? 'precalificado' : 'pendiente',
        score_ia: candidatoData.score_ia,
        experiencia_anos: candidatoData.experiencia_anos,
        created_at: new Date().toISOString(),
      });
      console.log('[SYNC] Candidato created in Godaddy:', candidatoData.id);
    } else {
      console.log('[SYNC] Candidato skipped Godaddy (not target user)');
    }

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data,
    };
  } catch (error) {
    console.error('[SYNC] Error creating candidato:', error);
    return {
      supabase: false,
      godaddy: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Actualizar plan en ambas bases de datos (solo si es lesters@furniturecity.com.gt)
 */
export async function syncUpdatePlan(
  userId: string,
  userEmail: string,
  plan: 'demo' | 'premium',
  licenseCode?: string
) {
  try {
    // Siempre actualizar en Supabase
    const supabaseResult = await supabase
      .from('companies')
      .update({
        plan: plan,
        license_code_used: licenseCode,
        plan_upgraded_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    let godaddyResult = true;

    // Solo sincronizar con Godaddy si es el usuario específico
    if (shouldSync(userEmail)) {
      const godaddyRecord = await getGodaddyRecord('companies', userId);
      if (godaddyRecord && typeof godaddyRecord.id === 'string') {
        godaddyResult = await updateGodaddyRecord('companies', godaddyRecord.id, {
          plan: plan,
          license_code_used: licenseCode,
          plan_upgraded_at: new Date().toISOString(),
        });
        console.log('[SYNC] Plan updated in Godaddy', { userId });
      }
    } else {
      console.log('[SYNC] Plan update skipped Godaddy', { userId });
    }

    return {
      supabase: !supabaseResult.error,
      godaddy: godaddyResult,
      success: !supabaseResult.error,
    };
  } catch (error) {
    console.error('[SYNC] Error updating plan:', error);
    return {
      supabase: false,
      godaddy: false,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
