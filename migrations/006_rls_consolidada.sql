-- Etapa 1 (R-03). Aplicar SOLO en staging y SOLO junto con el código de la rama remediacion/etapa-1.
-- Antes: guardar `SELECT * FROM pg_policies WHERE schemaname IN ('public','storage')` para poder revertir,
-- y quitar las líneas de tablas que no existan en la base efectiva (DROP POLICY ... ON tabla falla si la tabla no existe).
BEGIN;

DROP POLICY IF EXISTS "vacantes_public_read"   ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_public_insert" ON public.vacantes;
DROP POLICY IF EXISTS "Users can view their own vacancies" ON public.vacantes;
DROP POLICY IF EXISTS "candidatos_public_read"   ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_public_insert" ON public.candidatos;
DROP POLICY IF EXISTS "Users can view candidates for their vacancies" ON public.candidatos;
DROP POLICY IF EXISTS "Allow all" ON public.vacante_preguntas;
DROP POLICY IF EXISTS "audit_logs_service_insert"     ON public.audit_logs;
DROP POLICY IF EXISTS "rate_limit_log_service_insert" ON public.rate_limit_log;
DROP POLICY IF EXISTS "rate_limit_log_service_select" ON public.rate_limit_log;
DROP POLICY IF EXISTS "Admin can view all license codes"   ON public.license_codes;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;
DROP POLICY IF EXISTS "update_own_company"                 ON public.companies;

ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacantes_select_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_insert_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_update_own" ON public.vacantes;
DROP POLICY IF EXISTS "vacantes_delete_own" ON public.vacantes;
CREATE POLICY "vacantes_select_own" ON public.vacantes FOR SELECT TO authenticated
  USING (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_insert_own" ON public.vacantes FOR INSERT TO authenticated
  WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_update_own" ON public.vacantes FOR UPDATE TO authenticated
  USING (usuario_id::text = auth.uid()::text) WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY "vacantes_delete_own" ON public.vacantes FOR DELETE TO authenticated
  USING (usuario_id::text = auth.uid()::text);

ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "candidatos_select_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_insert_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_update_own" ON public.candidatos;
DROP POLICY IF EXISTS "candidatos_delete_own" ON public.candidatos;
CREATE POLICY "candidatos_select_own" ON public.candidatos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "candidatos_update_own" ON public.candidatos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "candidatos_delete_own" ON public.candidatos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));

ALTER TABLE public.vacante_preguntas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vacante_preguntas_owner" ON public.vacante_preguntas;
CREATE POLICY "vacante_preguntas_owner" ON public.vacante_preguntas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text));

ALTER TABLE public.evaluaciones_whatsapp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evaluaciones_select_own" ON public.evaluaciones_whatsapp;
DROP POLICY IF EXISTS "evaluaciones_insert_own" ON public.evaluaciones_whatsapp;
DROP POLICY IF EXISTS "evaluaciones_update_own" ON public.evaluaciones_whatsapp;
CREATE POLICY "evaluaciones_select_own" ON public.evaluaciones_whatsapp FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "evaluaciones_insert_own" ON public.evaluaciones_whatsapp FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY "evaluaciones_update_own" ON public.evaluaciones_whatsapp FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_whatsapp.vacante_id AND v.usuario_id::text = auth.uid()::text));

DROP POLICY IF EXISTS "cv_analysis_insert_own" ON public.cv_analysis;
CREATE POLICY "cv_analysis_insert_own" ON public.cv_analysis FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid()::text);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_vacante_publica(p_id text)
RETURNS TABLE(id text, titulo text, descripcion text, departamento text, empresa text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id::text, v.titulo::text, v.descripcion::text, v.departamento::text, c.nombre::text
  FROM public.vacantes v
  LEFT JOIN public.companies c ON c.user_id::text = v.usuario_id::text
  WHERE v.id::text = p_id AND v.estado = 'activa';
$$;
REVOKE ALL ON FUNCTION public.get_vacante_publica(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_vacante_publica(text) TO anon, authenticated;

UPDATE storage.buckets
SET public = false, file_size_limit = 5242880, allowed_mime_types = ARRAY['application/pdf']
WHERE id = 'cvs';

COMMIT;

-- Después de aplicar, revisar a mano las políticas de storage.objects del bucket 'cvs'
-- y eliminar cualquiera que dé acceso a anon o a authenticated sin condición de dueño.
