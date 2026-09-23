import type { SupabaseClient } from '@supabase/supabase-js';

export type OwnerRelation = { usuario_id: string } | { usuario_id: string }[] | null | undefined;

export type VacanteRow = {
  id: string;
  usuario_id: string;
  titulo: string;
  descripcion: string | null;
  departamento: string | null;
  estado: string;
  [column: string]: unknown;
};

export type CandidatoRow = {
  id: string;
  vacante_id: string;
  nombre: string;
  telefono: string | null;
  cv_url: string | null;
  [column: string]: unknown;
};

export type Owned<T> = { ok: true; data: T } | { ok: false; status: 403 | 404 };

export function ownerOf(relation: OwnerRelation): string | undefined {
  return Array.isArray(relation) ? relation[0]?.usuario_id : relation?.usuario_id;
}

// 403 solo es posible si la RLS deja ver filas ajenas; con RLS estricta lo ajeno llega como 404.
export async function getOwnedVacante(
  supabase: SupabaseClient,
  userId: string,
  vacanteId: string
): Promise<Owned<VacanteRow>> {
  const { data, error } = await supabase.from('vacantes').select('*').eq('id', vacanteId).maybeSingle();
  if (error || !data) return { ok: false, status: 404 };
  const vacante = data as VacanteRow;
  if (String(vacante.usuario_id) !== userId) return { ok: false, status: 403 };
  return { ok: true, data: vacante };
}

export async function getOwnedCandidato(
  supabase: SupabaseClient,
  userId: string,
  candidatoId: string
): Promise<Owned<CandidatoRow>> {
  const { data, error } = await supabase
    .from('candidatos')
    .select('*, vacantes:vacante_id(usuario_id)')
    .eq('id', candidatoId)
    .maybeSingle();
  if (error || !data) return { ok: false, status: 404 };
  const candidato = { ...data } as CandidatoRow;
  if (String(ownerOf(candidato.vacantes as OwnerRelation)) !== userId) return { ok: false, status: 403 };
  delete candidato.vacantes;
  return { ok: true, data: candidato };
}

export function ownershipError(result: { ok: false; status: 403 | 404 }) {
  return {
    body: { error: result.status === 403 ? 'Forbidden' : 'No encontrado', success: false },
    init: { status: result.status },
  };
}

// cv_url guarda la ruta del objeto; los registros antiguos guardan la URL pública completa.
export function cvObjectPath(cvUrl: string | null | undefined): string | null {
  if (!cvUrl) return null;
  const marker = '/object/public/cvs/';
  const path = cvUrl.includes(marker) ? cvUrl.slice(cvUrl.indexOf(marker) + marker.length) : cvUrl;
  if (!path || path.startsWith('http') || path.includes('..') || !/^[\w./-]+$/.test(path)) return null;
  return path;
}
