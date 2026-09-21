-- Políticas para las tablas de cuenta y licencias usadas por la aplicación.
-- Las tablas candidatos, vacantes y vacante_preguntas se cubren en la
-- migración RLS aplicada durante FASE 0.
BEGIN;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "Users can insert their own company" ON public.companies;
DROP POLICY IF EXISTS "select_own_company" ON public.companies;
DROP POLICY IF EXISTS "insert_own_company" ON public.companies;
DROP POLICY IF EXISTS "update_own_company" ON public.companies;

CREATE POLICY "select_own_company"
ON public.companies FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "insert_own_company"
ON public.companies FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_company"
ON public.companies FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admin can view all license codes" ON public.license_codes;
DROP POLICY IF EXISTS "Users can view their own used codes" ON public.license_codes;
DROP POLICY IF EXISTS "select_own_used_license" ON public.license_codes;

CREATE POLICY "select_own_used_license"
ON public.license_codes FOR SELECT
USING (used_by_user_id = auth.uid());

COMMIT;
