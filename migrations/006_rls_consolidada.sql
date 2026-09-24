-- Etapa 1 (R-03). Escrita contra el esquema real de producción (pg_dump del 2026-09-23).
-- Aplicar primero en staging y SOLO junto con el código de la rama remediacion/etapa-1.
-- Antes: guardar `SELECT * FROM pg_policies WHERE schemaname IN ('public','storage')` para poder revertir.
BEGIN;

-- Columnas que el código usa y que no existen en producción (causaban fallos en postular,
-- asignar-template e iniciar-whatsapp). Aditivas: no tocan datos existentes.
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS experiencia_anos integer;
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS estado_evaluacion text;
ALTER TABLE public.vacante_preguntas ADD COLUMN IF NOT EXISTS categoria_template text;

-- Una fila de preguntas por vacante (los upsert usan onConflict: 'vacante_id').
-- En producción, comprobar antes que no haya duplicados:
--   SELECT vacante_id, count(*) FROM public.vacante_preguntas GROUP BY 1 HAVING count(*) > 1;
-- Si los hay, esta línea falla y toda la migración se revierte; resolverlos a mano primero.
ALTER TABLE public.vacante_preguntas ADD CONSTRAINT vacante_preguntas_vacante_id_key UNIQUE (vacante_id);

-- vacantes: solo el dueño. La lectura pública de vacantes activas pasa a la RPC get_vacante_publica.
DROP POLICY IF EXISTS select_active_or_own_vacancies ON public.vacantes;
DROP POLICY IF EXISTS insert_own_vacancy ON public.vacantes;
DROP POLICY IF EXISTS update_own_vacancy ON public.vacantes;
DROP POLICY IF EXISTS delete_own_vacancy ON public.vacantes;
DROP POLICY IF EXISTS vacantes_public_read ON public.vacantes;
DROP POLICY IF EXISTS vacantes_public_insert ON public.vacantes;
DROP POLICY IF EXISTS vacantes_select_own ON public.vacantes;
DROP POLICY IF EXISTS vacantes_insert_own ON public.vacantes;
DROP POLICY IF EXISTS vacantes_update_own ON public.vacantes;
DROP POLICY IF EXISTS vacantes_delete_own ON public.vacantes;
ALTER TABLE public.vacantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY vacantes_select_own ON public.vacantes FOR SELECT TO authenticated
  USING (usuario_id::text = auth.uid()::text);
CREATE POLICY vacantes_insert_own ON public.vacantes FOR INSERT TO authenticated
  WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY vacantes_update_own ON public.vacantes FOR UPDATE TO authenticated
  USING (usuario_id::text = auth.uid()::text) WITH CHECK (usuario_id::text = auth.uid()::text);
CREATE POLICY vacantes_delete_own ON public.vacantes FOR DELETE TO authenticated
  USING (usuario_id::text = auth.uid()::text);

-- candidatos: el dueño de la vacante lee, actualiza y borra. Sin INSERT para anon ni authenticated:
-- la postulación pública inserta desde el servidor con service role (antes: insert_active_vacancy_candidate
-- permitía a cualquiera insertar candidatos con score y estado arbitrarios).
DROP POLICY IF EXISTS insert_active_vacancy_candidate ON public.candidatos;
DROP POLICY IF EXISTS select_own_candidates ON public.candidatos;
DROP POLICY IF EXISTS update_own_candidate ON public.candidatos;
DROP POLICY IF EXISTS delete_own_candidate ON public.candidatos;
DROP POLICY IF EXISTS candidatos_public_read ON public.candidatos;
DROP POLICY IF EXISTS candidatos_public_insert ON public.candidatos;
DROP POLICY IF EXISTS candidatos_select_own ON public.candidatos;
DROP POLICY IF EXISTS candidatos_insert_own ON public.candidatos;
DROP POLICY IF EXISTS candidatos_update_own ON public.candidatos;
DROP POLICY IF EXISTS candidatos_delete_own ON public.candidatos;
ALTER TABLE public.candidatos ENABLE ROW LEVEL SECURITY;
CREATE POLICY candidatos_select_own ON public.candidatos FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY candidatos_update_own ON public.candidatos FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY candidatos_delete_own ON public.candidatos FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = candidatos.vacante_id AND v.usuario_id::text = auth.uid()::text));

-- vacante_preguntas: solo el dueño (antes: cualquiera leía las respuestas correctas de vacantes activas).
DROP POLICY IF EXISTS select_active_or_own_vacancy_questions ON public.vacante_preguntas;
DROP POLICY IF EXISTS manage_own_vacancy_questions ON public.vacante_preguntas;
DROP POLICY IF EXISTS "Allow all" ON public.vacante_preguntas;
DROP POLICY IF EXISTS vacante_preguntas_owner ON public.vacante_preguntas;
ALTER TABLE public.vacante_preguntas ENABLE ROW LEVEL SECURITY;
CREATE POLICY vacante_preguntas_owner ON public.vacante_preguntas FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = vacante_preguntas.vacante_id AND v.usuario_id::text = auth.uid()::text));

-- evaluaciones_whatsapp: en producción no tenía RLS.
ALTER TABLE public.evaluaciones_whatsapp ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evaluaciones_select_own ON public.evaluaciones_whatsapp;
DROP POLICY IF EXISTS evaluaciones_insert_own ON public.evaluaciones_whatsapp;
DROP POLICY IF EXISTS evaluaciones_update_own ON public.evaluaciones_whatsapp;
DROP POLICY IF EXISTS evaluaciones_delete_own ON public.evaluaciones_whatsapp;
CREATE POLICY evaluaciones_delete_own ON public.evaluaciones_whatsapp FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id::text = evaluaciones_whatsapp.vacante_id::text AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY evaluaciones_select_own ON public.evaluaciones_whatsapp FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id::text = evaluaciones_whatsapp.vacante_id::text AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY evaluaciones_insert_own ON public.evaluaciones_whatsapp FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id::text = evaluaciones_whatsapp.vacante_id::text AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY evaluaciones_update_own ON public.evaluaciones_whatsapp FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id::text = evaluaciones_whatsapp.vacante_id::text AND v.usuario_id::text = auth.uid()::text));

-- companies: sin UPDATE desde el cliente; el plan solo cambia vía redeem_license_code o service role
-- (antes: update_own_company permitía que un usuario se pusiera plan = 'premium').
DROP POLICY IF EXISTS update_own_company ON public.companies;
DROP POLICY IF EXISTS "Users can update their own company" ON public.companies;

-- cv_analysis: el usuario inserta sus propios análisis (antes solo había SELECT y /api/cv fallaba).
DROP POLICY IF EXISTS cv_analysis_insert_own ON public.cv_analysis;
CREATE POLICY cv_analysis_insert_own ON public.cv_analysis FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid()::text);

-- Lectura pública mínima de una vacante activa, con el nombre de la empresa para el consentimiento.
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
