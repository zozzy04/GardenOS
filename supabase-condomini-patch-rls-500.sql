-- Patch: risolve errore 500 su GET /rest/v1/profiles (ricorsione RLS).
-- Esegui UNA VOLTA nel SQL Editor se hai già applicato una versione precedente
-- di supabase-condomini.sql senza le funzioni is_approved_*.

CREATE OR REPLACE FUNCTION public.is_approved_admin ()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE
      p.user_id = auth.uid ()
      AND p.role = 'admin'
      AND p.approval_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_approved_condomino ()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE
      p.user_id = auth.uid ()
      AND p.role = 'condomino'
      AND p.approval_status = 'approved'
  );
$$;

REVOKE ALL ON FUNCTION public.is_approved_admin () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_admin () TO authenticated;

REVOKE ALL ON FUNCTION public.is_approved_condomino () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_approved_condomino () TO authenticated;

DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT
  USING (public.is_approved_admin ());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE
  USING (public.is_approved_admin ())
  WITH CHECK (true);

DROP POLICY IF EXISTS "condomini_select_lavori_gestore" ON lavori;
CREATE POLICY "condomini_select_lavori_gestore" ON lavori
  FOR SELECT
  USING (
    user_id = (
      SELECT gestore_user_id
      FROM app_settings
      WHERE
        id = 1
    )
    AND public.is_approved_condomino ()
  );

DROP POLICY IF EXISTS "condomini_select_spese_gestore" ON spese_condominiali;
CREATE POLICY "condomini_select_spese_gestore" ON spese_condominiali
  FOR SELECT
  USING (
    user_id = (
      SELECT gestore_user_id
      FROM app_settings
      WHERE
        id = 1
    )
    AND public.is_approved_condomino ()
  );

CREATE OR REPLACE FUNCTION public.admin_set_profile_approval (
  target_user UUID,
  new_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  IF NOT (SELECT public.is_approved_admin ()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE profiles
  SET
    approval_status = new_status,
    updated_at = NOW()
  WHERE
    user_id = target_user
    AND role = 'condomino';
END;
$$;
