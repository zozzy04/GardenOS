-- GardenOS: rende privata la tabella `famiglie` e sposta l'assegnazione della
-- famiglia dalla registrazione all'approvazione da parte dell'admin.
--
-- Prima di questo script la pagina di registrazione leggeva `famiglie` da
-- anonimo: nomi e millesimi di tutti i condòmini erano ottenibili con una
-- chiamata REST, senza account. Dopo questo script:
--   - `anon` non ha più alcun accesso a `famiglie`
--   - un condòmino approvato vede solo la propria famiglia
--   - l'admin vede tutte le famiglie e le assegna in fase di approvazione
--
-- Esegui UNA VOLTA nel SQL Editor, dopo supabase-condomini.sql.
-- Rende obsoleto supabase-policy-profiles-pending-update.sql.

-- ---------------------------------------------------------------------------
-- 1. Via l'accesso anonimo
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "famiglie_select_public" ON famiglie;
REVOKE ALL ON famiglie FROM anon;

-- ---------------------------------------------------------------------------
-- 2. Helper: famiglia dell'utente corrente
--    SECURITY DEFINER come is_approved_*: legge `profiles` senza rivalutarne le
--    policy, altrimenti la policy su `famiglie` innescherebbe una ricorsione.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.my_famiglia_id ()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT p.famiglia_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid ()
$$;

REVOKE ALL ON FUNCTION public.my_famiglia_id () FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.my_famiglia_id () TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. Lettura famiglie: admin tutte, condòmino solo la propria
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "famiglie_select_admin" ON famiglie;
CREATE POLICY "famiglie_select_admin" ON famiglie
  FOR SELECT
  TO authenticated
  USING (public.is_approved_admin ());

DROP POLICY IF EXISTS "famiglie_select_own" ON famiglie;
CREATE POLICY "famiglie_select_own" ON famiglie
  FOR SELECT
  TO authenticated
  USING (id = public.my_famiglia_id ());

GRANT SELECT ON famiglie TO authenticated;

-- ---------------------------------------------------------------------------
-- 4. Niente più scritture su `profiles` dal client
--    La registrazione passa display_name nei metadati (ci pensa il trigger) e
--    la famiglia la assegna l'admin via RPC: nessun percorso diretto serve più.
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_update_own_pending" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
REVOKE UPDATE ON profiles FROM authenticated;

GRANT SELECT ON profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- 5. Approvazione: assegna anche la famiglia, in modo atomico
--    Firma cambiata (terzo parametro): si elimina la vecchia versione a 2
--    argomenti, altrimenti resterebbe come overload raggiungibile.
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.admin_set_profile_approval (UUID, TEXT);

CREATE OR REPLACE FUNCTION public.admin_set_profile_approval (
  target_user UUID,
  new_status TEXT,
  target_famiglia UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  final_famiglia UUID;
BEGIN
  IF new_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Stato non valido';
  END IF;

  IF NOT (SELECT public.is_approved_admin ()) THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;

  IF target_famiglia IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.famiglie WHERE id = target_famiglia) THEN
    RAISE EXCEPTION 'Famiglia inesistente';
  END IF;

  -- NULL significa «lascia quella che c'è», non «azzera»
  SELECT COALESCE(target_famiglia, p.famiglia_id)
  INTO final_famiglia
  FROM public.profiles p
  WHERE p.user_id = target_user AND p.role = 'condomino';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profilo condomino non trovato';
  END IF;

  -- Un condòmino approvato senza famiglia vedrebbe «Il mio conto» vuoto:
  -- meglio bloccare l'approvazione che consegnare un account inutile.
  IF new_status = 'approved' AND final_famiglia IS NULL THEN
    RAISE EXCEPTION 'Assegna una famiglia prima di approvare';
  END IF;

  UPDATE profiles
  SET
    approval_status = new_status,
    famiglia_id = final_famiglia,
    updated_at = NOW()
  WHERE
    user_id = target_user
    AND role = 'condomino';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_profile_approval (UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_approval (UUID, TEXT, UUID) TO authenticated;
