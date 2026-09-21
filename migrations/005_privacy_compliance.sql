BEGIN;

CREATE TABLE IF NOT EXISTS public.consent_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), usuario_id text NOT NULL,
  vacante_id text REFERENCES public.vacantes(id) ON DELETE CASCADE,
  tipo text NOT NULL, aceptado boolean NOT NULL DEFAULT true,
  ip_address text, user_agent text, timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_consent_usuario ON public.consent_log(usuario_id);
CREATE INDEX IF NOT EXISTS idx_consent_vacante ON public.consent_log(vacante_id);
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_consent_read" ON public.consent_log;
CREATE POLICY "own_consent_read" ON public.consent_log FOR SELECT TO authenticated USING (auth.uid()::text = usuario_id);

CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), key text NOT NULL, timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_key_timestamp ON public.rate_limit_log(key, timestamp);
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), action text NOT NULL,
  usuario_id text NOT NULL, recurso_id text, recurso_tipo text NOT NULL,
  cambios jsonb NOT NULL DEFAULT '{}'::jsonb, timestamp timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_usuario_timestamp ON public.audit_log(usuario_id, timestamp DESC);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_read_own" ON public.audit_log;
CREATE POLICY "audit_read_own" ON public.audit_log FOR SELECT TO authenticated USING (auth.uid()::text = usuario_id);

COMMIT;
