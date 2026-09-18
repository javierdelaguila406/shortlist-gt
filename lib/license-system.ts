/**
 * Sistema de Licencias v2 - Integrado con Supabase
 * Maneja plans (demo/premium) y códigos de licencia
 */

import { supabase } from './supabase';

export interface Plan {
  type: 'demo' | 'premium';
  maxVacantes: number;
  maxCandidatos: number;
  maxEvaluaciones: number;
  features: string[];
}

export const PLANS: Record<string, Plan> = {
  demo: {
    type: 'demo',
    maxVacantes: 1,
    maxCandidatos: 1,
    maxEvaluaciones: 1,
    features: [
      'Ver plantilla de preguntas',
      'Crear 1 vacante máximo',
      'Ver 1 candidato máximo',
    ],
  },
  premium: {
    type: 'premium',
    maxVacantes: 999,
    maxCandidatos: 999,
    maxEvaluaciones: 999,
    features: [
      'Vacantes ilimitadas',
      'Candidatos ilimitados',
      'Evaluaciones ilimitadas',
      'Todas las features',
    ],
  },
};

/**
 * Obtener plan actual del usuario
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('plan')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return PLANS.demo; // Valor por defecto: demo
    }

    return PLANS[data.plan || 'demo'] || PLANS.demo;
  } catch (error) {
    console.error('[LICENSE] Error getting user plan:', error);
    return PLANS.demo;
  }
}

/**
 * Verificar si el usuario puede realizar una acción
 */
export async function checkPermission(
  userId: string,
  action: 'create_vacante' | 'add_candidato' | 'send_whatsapp' | 'generate_report'
): Promise<{ allowed: boolean; reason?: string }> {
  const plan = await getUserPlan(userId);

  // WhatsApp y reportes solo en premium
  if (action === 'send_whatsapp' || action === 'generate_report') {
    if (plan.type === 'demo') {
      return {
        allowed: false,
        reason: 'Esta feature solo está disponible en el plan Premium',
      };
    }
    return { allowed: true };
  }

  // Contar recursos actuales
  try {
    const { count: vacanteCount } = await supabase
      .from('vacantes')
      .select('*', { count: 'exact', head: true });

    const { count: candidatoCount } = await supabase
      .from('candidatos')
      .select('*', { count: 'exact', head: true });

    if (action === 'create_vacante' && vacanteCount) {
      if (vacanteCount >= plan.maxVacantes) {
        return {
          allowed: false,
          reason: `Has alcanzado el límite de ${plan.maxVacantes} vacante(s). Actualiza a Premium para crear más.`,
        };
      }
    }

    if (action === 'add_candidato' && candidatoCount) {
      if (candidatoCount >= plan.maxCandidatos) {
        return {
          allowed: false,
          reason: `Has alcanzado el límite de ${plan.maxCandidatos} candidato(s). Actualiza a Premium para continuar.`,
        };
      }
    }
  } catch (error) {
    console.error('[LICENSE] Error checking resources:', error);
    // Permitir si hay error (seguridad: mejor permitir que bloquear)
  }

  return { allowed: true };
}

/**
 * Usar un código de licencia
 */
export async function useLicenseCode(code: string, userId: string): Promise<{
  success: boolean;
  message: string;
  plan?: string;
}> {
  try {
    const response = await fetch('/api/auth/use-license-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo: code, userId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[LICENSE] Error using license code:', error);
    return {
      success: false,
      message: 'Error al procesar el código de licencia',
    };
  }
}

/**
 * Generar códigos de licencia (solo admin)
 */
export async function generateLicenseCodes(
  cantidad: number,
  adminToken: string
): Promise<{
  success: boolean;
  codes?: string[];
  message: string;
}> {
  try {
    const response = await fetch('/api/admin/generate-license', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken,
      },
      body: JSON.stringify({ cantidad }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[LICENSE] Error generating codes:', error);
    return {
      success: false,
      message: 'Error al generar códigos',
    };
  }
}
