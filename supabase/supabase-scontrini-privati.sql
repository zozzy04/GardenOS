-- GardenOS: rende privato il bucket `scontrini`.
--
-- Il bucket era pubblico e `spese_condominiali.scontrino_url` conteneva un URL
-- permanente e non autenticato: chiunque lo avesse (o lo indovinasse) poteva
-- scaricare lo scontrino. Gli scontrini contengono indirizzi, importi e a
-- volte le ultime cifre della carta.
--
-- Dopo questo script il bucket e' privato e l'app genera URL firmati a
-- scadenza. La colonna cambia significato — da URL a percorso nel bucket —
-- quindi cambia anche nome, cosi' il codice vecchio fallisce invece di
-- continuare a girare su un valore che non e' piu' quello che crede.
--
-- Esegui nel SQL Editor. Richiede anche il deploy del codice aggiornato:
-- sono due meta' dello stesso cambiamento.

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Il bucket non e' piu' pubblico
-- ---------------------------------------------------------------------------

UPDATE storage.buckets SET public = FALSE WHERE id = 'scontrini';

-- ---------------------------------------------------------------------------
-- 2. Lettura solo al proprietario della cartella
--    I file stanno in `{user_id}/{timestamp}.{ext}`: il primo segmento del
--    percorso e' l'utente, quindi basta confrontarlo con auth.uid().
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public can read scontrini" ON storage.objects;
DROP POLICY IF EXISTS "scontrini_select_public" ON storage.objects;
DROP POLICY IF EXISTS "scontrini_select_own" ON storage.objects;

CREATE POLICY "scontrini_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'scontrini'
    AND auth.uid ()::TEXT = (storage.foldername (name))[1]
  );

-- Upload ed eliminazione restano al proprietario (ricreate per idempotenza)
DROP POLICY IF EXISTS "Users can upload scontrini" ON storage.objects;
DROP POLICY IF EXISTS "scontrini_insert_own" ON storage.objects;

CREATE POLICY "scontrini_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scontrini'
    AND auth.uid ()::TEXT = (storage.foldername (name))[1]
  );

DROP POLICY IF EXISTS "Users can delete own scontrini" ON storage.objects;
DROP POLICY IF EXISTS "scontrini_delete_own" ON storage.objects;

CREATE POLICY "scontrini_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'scontrini'
    AND auth.uid ()::TEXT = (storage.foldername (name))[1]
  );

-- ---------------------------------------------------------------------------
-- 3. Da URL a percorso
--    Il vecchio valore era
--      https://<progetto>.supabase.co/storage/v1/object/public/scontrini/<path>
--    e di tutto questo serve solo <path>.
-- ---------------------------------------------------------------------------

ALTER TABLE spese_condominiali
  RENAME COLUMN scontrino_url TO scontrino_path;

UPDATE spese_condominiali
SET scontrino_path = substring(scontrino_path FROM '/public/scontrini/(.*)$')
WHERE scontrino_path LIKE '%/public/scontrini/%';

/* Se qualche riga aveva un URL in un formato diverso resta invariata e non
   risolvera' piu': meglio un'anteprima rotta che un file pubblico. Per
   individuarle:
     SELECT id, oggetto, scontrino_path FROM spese_condominiali
     WHERE scontrino_path LIKE 'http%'; */

COMMIT;
