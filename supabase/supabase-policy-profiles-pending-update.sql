-- GardenOS: consente al condomino «pending» di aggiornare famiglia_id e display_name.
-- Necessario per la registrazione che fa signUp SENZA metadata (evita 422 sul trigger).
-- Esegui nel SQL Editor di Supabase se hai già applicato supabase-condomini.sql senza questa policy.

DROP POLICY IF EXISTS "profiles_update_own_pending" ON public.profiles;

CREATE POLICY "profiles_update_own_pending" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid () = user_id AND approval_status = 'pending')
  WITH CHECK (
    auth.uid () = user_id
    AND approval_status = 'pending'
    AND role = 'condomino'
  );
