BEGIN;

CREATE TABLE IF NOT EXISTS public.cv_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id text NOT NULL,
  candidato_id text NULL REFERENCES public.candidatos(id) ON DELETE SET NULL,
  pdf_filename text NOT NULL,
  text_extracted text NOT NULL DEFAULT '',
  score_total integer NOT NULL CHECK (score_total BETWEEN 0 AND 100),
  score_keywords integer NOT NULL CHECK (score_keywords BETWEEN 0 AND 100),
  score_experience integer NOT NULL CHECK (score_experience BETWEEN 0 AND 100),
  evaluated boolean NOT NULL DEFAULT false,
  analyzed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cv_analysis ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cv_analysis_select_own" ON public.cv_analysis;
CREATE POLICY "cv_analysis_select_own" ON public.cv_analysis
FOR SELECT TO authenticated USING (auth.uid()::text = usuario_id);

COMMIT;
