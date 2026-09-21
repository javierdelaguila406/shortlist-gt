-- Canjea un código y activa el plan del usuario en una sola transacción.
-- La función solo opera para el usuario autenticado del JWT.
CREATE OR REPLACE FUNCTION public.redeem_license_code(p_code text)
RETURNS TABLE(email text, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  matched_code public.license_codes%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required' USING ERRCODE = '28000';
  END IF;

  SELECT *
  INTO matched_code
  FROM public.license_codes
  WHERE code = upper(trim(p_code))
    AND status = 'unused'
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'license unavailable' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.license_codes
  SET status = 'used',
      used_by_user_id = current_user_id,
      used_at = now()
  WHERE id = matched_code.id;

  UPDATE public.companies
  SET plan = 'premium',
      license_code_used = matched_code.code,
      plan_upgraded_at = now(),
      updated_at = now()
  WHERE user_id = current_user_id
  RETURNING companies.email, companies.plan
  INTO email, plan;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'company profile not found' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_license_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.redeem_license_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.redeem_license_code(text) TO authenticated;
