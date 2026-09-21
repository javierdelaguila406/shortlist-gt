import { createClient } from '@supabase/supabase-js';

export type AuditEvent = {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  userId: string;
  resourceId?: string | null;
  resourceType: 'vacante' | 'candidato' | 'reporte';
  changes?: Record<string, string | number | boolean | null>;
};

const forbiddenKeys = /email|nombre|telefono|phone|cv|text|token|password|address|ip/i;

export async function logAuditEvent(event: AuditEvent): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) return false;
  const cambios = Object.fromEntries(Object.entries(event.changes || {}).filter(([key]) => !forbiddenKeys.test(key)));
  try {
    const client = createClient(url, serviceRole);
    const { error } = await client.from('audit_log').insert({
      action: event.action, usuario_id: event.userId, recurso_id: event.resourceId || null,
      recurso_tipo: event.resourceType, cambios, timestamp: new Date().toISOString(),
    });
    if (error) throw error;
    return true;
  } catch {
    console.error('[Audit] Persistent event failed', { action: event.action, userId: event.userId });
    return false;
  }
}
