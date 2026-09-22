import { createClient } from '@supabase/supabase-js';

/**
 * Audit Logger for production logging
 * Logs critical events to Supabase for compliance and debugging
 * Only active in production to minimize database writes
 */

const isProduction = process.env.NODE_ENV === 'production';

type AuditEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'ADMIN_ACTION'
  | 'DATA_ACCESS'
  | 'SECURITY_ALERT'
  | 'API_ERROR';

interface AuditLogEntry {
  event_type: AuditEventType;
  user_id?: string;
  action: string;
  resource?: string;
  status: 'success' | 'failure';
  ip_address?: string;
  user_agent?: string;
  details?: Record<string, any>;
}

async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  // Only log in production
  if (!isProduction) {
    console.log('[AUDIT-DEV]', entry);
    return;
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[AUDIT-ERROR] Supabase not configured');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Log to audit_logs table in Supabase
    const { error } = await supabase.from('audit_logs').insert({
      event_type: entry.event_type,
      user_id: entry.user_id,
      action: entry.action,
      resource: entry.resource,
      status: entry.status,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
      details: entry.details,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('[AUDIT-ERROR] Failed to log event:', error);
    }
  } catch (error) {
    console.error('[AUDIT-ERROR] Exception during logging:', error);
    // Don't throw - logging failures shouldn't crash the app
  }
}

export { logAuditEvent, type AuditEventType, type AuditLogEntry };
