-- Etapa 2. Aplicar primero en staging y SOLO junto con el código de la rama remediacion/etapa-2.
-- Requiere la migración 006 aplicada.
BEGIN;

-- R-07: el puntaje del CV sale del PDF; si no se pudo leer, el candidato queda "no evaluado".
ALTER TABLE public.candidatos ADD COLUMN IF NOT EXISTS cv_evaluado boolean NOT NULL DEFAULT false;

-- score_test valía 0 por defecto sin que nadie hubiera hecho una prueba; ahora NULL significa "sin prueba".
-- El estado 'evaluado' es nuevo en esta migración, así que ningún 0 existente proviene de una prueba real.
ALTER TABLE public.candidatos ALTER COLUMN score_test DROP DEFAULT;
UPDATE public.candidatos SET score_test = NULL WHERE score_test = 0 AND estado IS DISTINCT FROM 'evaluado';

-- Evaluaciones por enlace (reemplazan a WhatsApp). Solo se guarda el hash del token del enlace.
CREATE TABLE IF NOT EXISTS public.evaluaciones_candidato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id text NOT NULL REFERENCES public.candidatos(id) ON DELETE CASCADE,
  vacante_id text NOT NULL REFERENCES public.vacantes(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  preguntas jsonb NOT NULL,
  respuestas jsonb,
  estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'completada', 'anulada')),
  score_test integer CHECK (score_test BETWEEN 0 AND 100),
  expira_en timestamptz NOT NULL,
  creado_por uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  abierta_en timestamptz,
  completada_en timestamptz
);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_candidato_candidato ON public.evaluaciones_candidato(candidato_id);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_candidato_vacante ON public.evaluaciones_candidato(vacante_id);

ALTER TABLE public.evaluaciones_candidato ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evaluaciones_candidato_select_own ON public.evaluaciones_candidato;
DROP POLICY IF EXISTS evaluaciones_candidato_insert_own ON public.evaluaciones_candidato;
DROP POLICY IF EXISTS evaluaciones_candidato_update_own ON public.evaluaciones_candidato;
CREATE POLICY evaluaciones_candidato_select_own ON public.evaluaciones_candidato FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_candidato.vacante_id AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY evaluaciones_candidato_insert_own ON public.evaluaciones_candidato FOR INSERT TO authenticated
  WITH CHECK (creado_por = auth.uid() AND EXISTS (
    SELECT 1 FROM public.candidatos c JOIN public.vacantes v ON v.id = c.vacante_id
    WHERE c.id = evaluaciones_candidato.candidato_id AND v.id = evaluaciones_candidato.vacante_id
      AND v.usuario_id::text = auth.uid()::text));
CREATE POLICY evaluaciones_candidato_update_own ON public.evaluaciones_candidato FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_candidato.vacante_id AND v.usuario_id::text = auth.uid()::text))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vacantes v
                 WHERE v.id = evaluaciones_candidato.vacante_id AND v.usuario_id::text = auth.uid()::text));
-- Sin políticas para anon: el candidato responde a través de la API, que valida el token con service role.

-- Límites del plan Demo: 1 vacante, 1 candidato y 1 evaluación vigente por empresa.
-- En un trigger para que ninguna ruta (ni el service role) pueda saltárselos.
CREATE OR REPLACE FUNCTION public.enforce_plan_limits()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_owner text;
  v_plan text;
  v_count integer;
BEGIN
  IF TG_TABLE_NAME = 'vacantes' THEN
    v_owner := NEW.usuario_id::text;
  ELSE
    SELECT v.usuario_id::text INTO v_owner FROM public.vacantes v WHERE v.id = NEW.vacante_id;
  END IF;
  IF v_owner IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended('plan-limit:' || v_owner, 0));

  SELECT c.plan INTO v_plan FROM public.companies c WHERE c.user_id::text = v_owner;
  IF coalesce(v_plan, 'demo') <> 'demo' THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'vacantes' THEN
    SELECT count(*) INTO v_count FROM public.vacantes v WHERE v.usuario_id::text = v_owner;
  ELSIF TG_TABLE_NAME = 'candidatos' THEN
    SELECT count(*) INTO v_count
    FROM public.candidatos c JOIN public.vacantes v ON v.id = c.vacante_id
    WHERE v.usuario_id::text = v_owner;
  ELSE
    SELECT count(*) INTO v_count
    FROM public.evaluaciones_candidato e JOIN public.vacantes v ON v.id = e.vacante_id
    WHERE v.usuario_id::text = v_owner AND e.estado <> 'anulada';
  END IF;

  IF v_count >= 1 THEN
    RAISE EXCEPTION 'plan_limit:%', TG_TABLE_NAME USING ERRCODE = 'P0001', HINT = 'demo';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_plan_limits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_plan_limit_vacantes ON public.vacantes;
CREATE TRIGGER trg_plan_limit_vacantes BEFORE INSERT ON public.vacantes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
DROP TRIGGER IF EXISTS trg_plan_limit_candidatos ON public.candidatos;
CREATE TRIGGER trg_plan_limit_candidatos BEFORE INSERT ON public.candidatos
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();
DROP TRIGGER IF EXISTS trg_plan_limit_evaluaciones ON public.evaluaciones_candidato;
CREATE TRIGGER trg_plan_limit_evaluaciones BEFORE INSERT ON public.evaluaciones_candidato
  FOR EACH ROW EXECUTE FUNCTION public.enforce_plan_limits();

-- R-08: límite de intentos atómico (contar e insertar bajo el mismo bloqueo).
CREATE OR REPLACE FUNCTION public.rate_limit_hit(p_key text, p_limit int, p_window_ms bigint)
RETURNS TABLE(allowed boolean, retry_after_s int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_window interval := make_interval(secs => p_window_ms / 1000.0);
  v_count int;
  v_oldest timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_key, 0));
  SELECT count(*), min(r."timestamp") INTO v_count, v_oldest
  FROM public.rate_limit_log r
  WHERE r.key = p_key AND r."timestamp" > now() - v_window;

  IF v_count >= p_limit THEN
    RETURN QUERY SELECT false, GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_oldest + v_window - now())))::int);
    RETURN;
  END IF;

  INSERT INTO public.rate_limit_log(key, "timestamp") VALUES (p_key, now());
  DELETE FROM public.rate_limit_log WHERE "timestamp" < now() - interval '1 day';
  RETURN QUERY SELECT true, 0;
END;
$$;
REVOKE ALL ON FUNCTION public.rate_limit_hit(text, int, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(text, int, bigint) TO service_role;

COMMIT;
