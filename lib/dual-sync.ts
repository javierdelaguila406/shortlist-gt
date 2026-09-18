/**
 * Dual Sync - Sincroniza datos entre Supabase y Godaddy
 * Guarda en ambas bases simultáneamente
 */

import { createClient } from '@supabase/supabase-js';
import {
  insertGodaddyRecord,
  updateGodaddyRecord,
  getGodaddyRecord,
} from './godaddy-db';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Crear usuario en ambas bases de datos
 */
export async function syncCreateUser(userData: {
  id: string;
  email: string;
  nombre: string;
  plan: 'demo' | 'premium';
}) {
  try {
    // Supabase
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

    // Godaddy
    const godaddyResult = await insertGodaddyRecord('companies', {
      id: `cmp_${userData.id.substring(0, 8)}`,
      user_id: userData.id,
      email: userData.email,
      nombre: userData.nombre,
      plan: userData.plan,
      created_at: new Date().toISOString(),
    });

    console.log('[SYNC] User created in both databases:', {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
    });

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data && godaddyResult,
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
 * Crear vacante en ambas bases de datos
 */
export async function syncCreateVacante(vacanteData: {
  id: string;
  user_id: string;
  titulo: string;
  descripcion?: string;
  departamento?: string;
}) {
  try {
    // Supabase
    const supabaseResult = await supabase
      .from('vacantes')
      .insert({
        id: vacanteData.id,
        user_id: vacanteData.user_id,
        titulo: vacanteData.titulo,
        descripcion: vacanteData.descripcion,
        departamento: vacanteData.departamento,
        estado: 'abierta',
        created_at: new Date().toISOString(),
      })
      .select();

    // Godaddy
    const godaddyResult = await insertGodaddyRecord('vacantes', {
      id: vacanteData.id,
      user_id: vacanteData.user_id,
      titulo: vacanteData.titulo,
      descripcion: vacanteData.descripcion,
      departamento: vacanteData.departamento,
      estado: 'abierta',
      created_at: new Date().toISOString(),
    });

    console.log('[SYNC] Vacante created in both databases:', {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
    });

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data && godaddyResult,
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

/**
 * Crear candidato en ambas bases de datos
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
}) {
  try {
    // Supabase
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

    // Godaddy
    const godaddyResult = await insertGodaddyRecord('candidatos', {
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

    console.log('[SYNC] Candidato created in both databases:', {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
    });

    return {
      supabase: !!supabaseResult.data,
      godaddy: godaddyResult,
      success: !!supabaseResult.data && godaddyResult,
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
 * Actualizar plan en ambas bases de datos
 */
export async function syncUpdatePlan(
  userId: string,
  plan: 'demo' | 'premium',
  licenseCode?: string
) {
  try {
    // Supabase
    const supabaseResult = await supabase
      .from('companies')
      .update({
        plan: plan,
        license_code_used: licenseCode,
        plan_upgraded_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    // Godaddy - buscar por user_id
    const godaddyRecord = await getGodaddyRecord('companies', userId);

    let godaddyResult = true;
    if (godaddyRecord) {
      godaddyResult = await updateGodaddyRecord('companies', godaddyRecord.id, {
        plan: plan,
        license_code_used: licenseCode,
        plan_upgraded_at: new Date().toISOString(),
      });
    }

    console.log('[SYNC] Plan updated in both databases:', {
      supabase: !supabaseResult.error,
      godaddy: godaddyResult,
    });

    return {
      supabase: !supabaseResult.error,
      godaddy: godaddyResult,
      success: !supabaseResult.error && godaddyResult,
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
