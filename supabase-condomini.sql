-- GardenOS: condomini, famiglie, profili, RLS lettura dati gestore
-- Esegui in Supabase SQL Editor DOPO supabase-schema.sql
--
-- Se l'app mostra 404 su /rest/v1/profiles → questo script non è stato applicato
-- (o è fallito): la tabella public.profiles non esiste ancora.
--
-- PRIMA DI ESEGUIRE:
-- 1) Crea l'utente gestore in Authentication (se non esiste).
-- 2) Sostituisci YOUR_GESTORE_USER_ID con il UUID reale (auth.users.id).
-- 3) Esegui il blocco INSERT app_settings in fondo con quell'UUID.
-- 4) Inserisci una riga profiles per il gestore (vedi sezione bootstrap gestore).

-- ---------------------------------------------------------------------------
-- Tabelle
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS famiglie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  millesimi DECIMAL(12, 3) NOT NULL,
  ordine INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  gestore_user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'condomino' CHECK (role IN ('admin', 'condomino')),
  famiglia_id UUID REFERENCES famiglie (id) ON DELETE SET NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    approval_status IN ('pending', 'approved', 'rejected')
  ),
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role_status ON profiles (role, approval_status);
CREATE INDEX IF NOT EXISTS idx_profiles_famiglia ON profiles (famiglia_id);

-- Seed famiglie (stessi millesimi di Invoice.jsx legacy)
INSERT INTO famiglie (nome, millesimi, ordine)
VALUES
  ('Artico Eros - Salotto Desirè', 201.055, 1),
  ('Zozzolotto Gianni - Pasquali Paola', 304.419, 2),
  ('Uvai Chiara', 290.081, 3),
  ('Pavan Stefano - Tumiotto Eleonora', 204.445, 4)
ON CONFLICT (nome) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Trigger profilo su nuova registrazione
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user_profile ()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fid UUID;
  raw_fid TEXT;
BEGIN
  raw_fid := NULLIF(TRIM(NEW.raw_user_meta_data ->> 'famiglia_id'), '');

  IF raw_fid IS NOT NULL THEN
    BEGIN
      fid := raw_fid::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        fid := NULL;
    END;

    IF fid IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.famiglie WHERE id = fid) THEN
      fid := NULL;
    END IF;
  ELSE
    fid := NULL;
  END IF;

  /* Senza questo, RLS su `profiles` può far fallire l’INSERT e GoTrue risponde 422. */
  SET LOCAL row_security = off;

  INSERT INTO public.profiles (user_id, role, famiglia_id, approval_status, display_name)
  VALUES (
    NEW.id,
    'condomino',
    fid,
    'pending',
    NULLIF(TRIM(NEW.raw_user_meta_data ->> 'display_name'), '')
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile ();

-- Aggiorna updated_at su profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column ();

-- ---------------------------------------------------------------------------
-- RLS: famiglie (lettura pubblica per registrazione)
-- ---------------------------------------------------------------------------

ALTER TABLE famiglie ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "famiglie_select_public" ON famiglie;
CREATE POLICY "famiglie_select_public" ON famiglie
  FOR SELECT
  USING (true);

GRANT SELECT ON famiglie TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- RLS: app_settings (lettura autenticati)
-- ---------------------------------------------------------------------------

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings_select_auth" ON app_settings;
CREATE POLICY "app_settings_select_auth" ON app_settings
  FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON app_settings TO authenticated;

-- Solo service role / dashboard per INSERT/UPDATE app_settings (nessuna policy write da client)

-- ---------------------------------------------------------------------------
-- Funzioni helper RLS (SECURITY DEFINER: leggono profiles senza rivalutare le policy)
-- Senza di esse, policy tipo "admin se EXISTS (SELECT … FROM profiles)" causano
-- ricorsione infinita e 500 su GET /rest/v1/profiles.
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT
  USING (auth.uid () = user_id);

CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT
  USING (public.is_approved_admin ());

CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE
  USING (public.is_approved_admin ())
  WITH CHECK (true);

-- Condomino in attesa: può aggiornare solo famiglia/nome (dopo signup senza metadata sul trigger)
DROP POLICY IF EXISTS "profiles_update_own_pending" ON profiles;
CREATE POLICY "profiles_update_own_pending" ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid () = user_id AND approval_status = 'pending')
  WITH CHECK (
    auth.uid () = user_id
    AND approval_status = 'pending'
    AND role = 'condomino'
  );

GRANT SELECT, UPDATE ON profiles TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: lavori — condomini approvati leggono i lavori del gestore
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- RLS: spese_condominiali — stessa logica
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- RPC: approvazione / rifiuto (solo admin)
-- ---------------------------------------------------------------------------

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

REVOKE ALL ON FUNCTION public.admin_set_profile_approval (UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_profile_approval (UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- Bootstrap gestore (esegui UNA VOLTA con UUID reale)
-- ---------------------------------------------------------------------------
-- INSERT INTO app_settings (id, gestore_user_id)
-- VALUES (1, 'YOUR_GESTORE_USER_ID'::uuid)
-- ON CONFLICT (id) DO UPDATE SET gestore_user_id = EXCLUDED.gestore_user_id;
--
-- INSERT INTO profiles (user_id, role, famiglia_id, approval_status, display_name)
-- VALUES ('YOUR_GESTORE_USER_ID'::uuid, 'admin', NULL, 'approved', 'Gestore')
-- ON CONFLICT (user_id) DO UPDATE SET
--   role = 'admin',
--   approval_status = 'approved',
--   famiglia_id = NULL;
