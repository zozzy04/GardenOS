-- ===========================================================================
-- GardenOS — migrazione cumulativa del 25/10/2026
--
-- Unisce, NELL'ORDINE OBBLIGATORIO, tre script gia' presenti nel repository:
--   1. supabase-famiglie-private.sql
--   2. supabase-pagamenti.sql
--   3. supabase-fatture-numerazione.sql
-- I contenuti sono riportati verbatim: questo file non aggiunge nulla, serve
-- solo a eseguirli in sequenza con i controlli preliminari davanti.
--
-- COME SI USA
--   Incolla tutto nel SQL Editor di Supabase ed esegui una volta sola.
--   E' tutto dentro una transazione: o passa tutto, o non cambia nulla.
--   (Unica eccezione: setval sulla sequenza dei numeri fattura non viene
--    annullato dal rollback. Effetto al massimo qualche numero saltato.)
--   E' idempotente: rieseguirlo non fa danni.
--
-- SE SI FERMA
--   Il blocco di controllo qui sotto si interrompe con un messaggio esplicito
--   prima di toccare qualunque cosa. Leggi il messaggio, risolvi, riesegui.
-- ===========================================================================

BEGIN;

DO $preflight$
DECLARE
  mancanti TEXT;
  coppie   TEXT;
BEGIN
  -- Prerequisiti: gli script precedenti devono essere gia' stati applicati
  SELECT string_agg(t, ', ')
  INTO mancanti
  FROM unnest(ARRAY[
    'famiglie', 'profiles', 'app_settings',
    'lavori', 'spese_condominiali', 'fatture'
  ]) AS t
  WHERE to_regclass('public.' || t) IS NULL;

  IF mancanti IS NOT NULL THEN
    RAISE EXCEPTION
      'Tabelle mancanti: %. Esegui prima supabase-schema.sql, supabase-condomini.sql e supabase-fatture.sql.',
      mancanti;
  END IF;

  IF to_regprocedure('public.is_approved_admin()') IS NULL THEN
    RAISE EXCEPTION
      'Funzione is_approved_admin() assente: esegui prima supabase-condomini.sql.';
  END IF;

  -- Il vincolo di esclusione del punto 3 non puo' essere creato se i dati
  -- esistenti lo violano gia'. Meglio dirlo adesso che a meta' migrazione.
  /* Identifica le fatture per periodo e non per numero: la colonna `numero`
     viene creata dal blocco 3/3, qui non esiste ancora. */
  SELECT string_agg(
    format('[%s..%s] con [%s..%s]', a.period_start, a.period_end, b.period_start, b.period_end),
    '; '
  )
  INTO coppie
  FROM fatture a
  JOIN fatture b
    ON a.id < b.id
   AND daterange(a.period_start, a.period_end, '[]')
    && daterange(b.period_start, b.period_end, '[]');

  IF coppie IS NOT NULL THEN
    RAISE EXCEPTION
      'Fatture con periodi sovrapposti: %. Correggi i periodi (o elimina i duplicati) e riesegui.',
      coppie;
  END IF;

  -- Non bloccante: senza gestore configurato l'emissione fattura non marca
  -- lavori e spese, perche' la RPC filtra su quell'id.
  IF NOT EXISTS (SELECT 1 FROM app_settings WHERE id = 1) THEN
    RAISE WARNING
      'app_settings vuota: imposta gestore_user_id, altrimenti emetti_fattura non marchera'' le righe come fatturate.';
  END IF;

  RAISE NOTICE 'Controlli preliminari superati.';
END
$preflight$;


-- ===========================================================================
-- 1 / 3 — supabase-famiglie-private.sql
-- ===========================================================================

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

-- ===========================================================================
-- 2 / 3 — supabase-pagamenti.sql
-- ===========================================================================

-- GardenOS: stato di pagamento delle quote.
--
-- Una fattura è unica per il condominio ma viene saldata da ogni famiglia
-- separatamente: lo stato NON può stare su `fatture`, serve una riga per
-- coppia (fattura, famiglia). La presenza della riga significa «saldata».
--
-- Esegui nel SQL Editor dopo supabase-fatture.sql e supabase-famiglie-private.sql.

CREATE TABLE IF NOT EXISTS pagamenti (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fattura_id    UUID NOT NULL REFERENCES fatture (id) ON DELETE CASCADE,
  famiglia_id   UUID NOT NULL REFERENCES famiglie (id) ON DELETE CASCADE,
  saldata_il    DATE NOT NULL DEFAULT CURRENT_DATE,
  importo       DECIMAL(12, 2),
  note          TEXT,
  registrato_da UUID REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (fattura_id, famiglia_id)
);

CREATE INDEX IF NOT EXISTS idx_pagamenti_fattura ON pagamenti (fattura_id);
CREATE INDEX IF NOT EXISTS idx_pagamenti_famiglia ON pagamenti (famiglia_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE pagamenti ENABLE ROW LEVEL SECURITY;

-- Admin: registra e annulla i pagamenti
DROP POLICY IF EXISTS "pagamenti_select_admin" ON pagamenti;
CREATE POLICY "pagamenti_select_admin" ON pagamenti
  FOR SELECT TO authenticated
  USING (public.is_approved_admin ());

DROP POLICY IF EXISTS "pagamenti_insert_admin" ON pagamenti;
CREATE POLICY "pagamenti_insert_admin" ON pagamenti
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_admin ());

DROP POLICY IF EXISTS "pagamenti_delete_admin" ON pagamenti;
CREATE POLICY "pagamenti_delete_admin" ON pagamenti
  FOR DELETE TO authenticated
  USING (public.is_approved_admin ());

-- Condòmino: vede solo i pagamenti della propria famiglia, in sola lettura
DROP POLICY IF EXISTS "pagamenti_select_own" ON pagamenti;
CREATE POLICY "pagamenti_select_own" ON pagamenti
  FOR SELECT TO authenticated
  USING (famiglia_id = public.my_famiglia_id ());

GRANT SELECT, INSERT, DELETE ON pagamenti TO authenticated;

-- ===========================================================================
-- 3 / 3 — supabase-fatture-numerazione.sql
-- ===========================================================================

-- GardenOS: numerazione, periodi non sovrapposti e legame lavoro <-> fattura.
--
-- Risolve tre problemi della generazione fatture:
--   1) le fatture non avevano un identificativo leggibile
--   2) lo stesso periodo poteva essere emesso due volte, fatturandolo due volte
--   3) l'appartenenza di un lavoro a una fattura si deduceva solo dalle date:
--      un lavoro inserito in ritardo dentro un periodo gia' fatturato non
--      sarebbe mai stato fatturato, senza che nessuno se ne accorgesse
--
-- Esegui nel SQL Editor dopo supabase-fatture.sql.

-- ---------------------------------------------------------------------------
-- 1. Numero progressivo
--    Progressivo globale, non per anno: questa non e' una fattura fiscale ma
--    un rendiconto condominiale, e un contatore unico e' piu' semplice da
--    seguire a distanza di anni.
-- ---------------------------------------------------------------------------

ALTER TABLE fatture ADD COLUMN IF NOT EXISTS numero INT;

CREATE SEQUENCE IF NOT EXISTS fatture_numero_seq;

-- Assegna un numero alle fatture gia' emesse, in ordine cronologico
WITH numerate AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY period_end, created_at) AS n
  FROM fatture
  WHERE numero IS NULL
)
UPDATE fatture f
SET numero = numerate.n
FROM numerate
WHERE f.id = numerate.id;

-- Porta la sequenza oltre i numeri gia' usati
SELECT setval(
  'fatture_numero_seq',
  COALESCE((SELECT MAX(numero) FROM fatture), 0) + 1,
  false
);

ALTER TABLE fatture ALTER COLUMN numero SET DEFAULT nextval('fatture_numero_seq');
ALTER TABLE fatture ALTER COLUMN numero SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_fatture_numero ON fatture (numero);

-- ---------------------------------------------------------------------------
-- 2. Periodi non sovrapponibili
--    Vincolo di esclusione: e' il database a garantirlo, non il client.
--    Se fallisce, ci sono gia' fatture con periodi sovrapposti: individuale con
--      SELECT a.numero, b.numero FROM fatture a JOIN fatture b
--      ON a.id < b.id AND daterange(a.period_start, a.period_end, '[]')
--                      && daterange(b.period_start, b.period_end, '[]');
--    e correggile prima di rieseguire questo blocco.
-- ---------------------------------------------------------------------------

ALTER TABLE fatture DROP CONSTRAINT IF EXISTS fatture_periodo_valido;
ALTER TABLE fatture ADD CONSTRAINT fatture_periodo_valido
  CHECK (period_start <= period_end);

ALTER TABLE fatture DROP CONSTRAINT IF EXISTS fatture_periodo_no_overlap;
ALTER TABLE fatture ADD CONSTRAINT fatture_periodo_no_overlap
  EXCLUDE USING gist ((daterange(period_start, period_end, '[]')) WITH &&);

-- ---------------------------------------------------------------------------
-- 3. Legame esplicito con le righe fatturate
--    ON DELETE SET NULL: cancellare una fattura rimette lavori e spese in
--    coda per la prossima, invece di farli sparire dal conteggio.
-- ---------------------------------------------------------------------------

ALTER TABLE lavori
  ADD COLUMN IF NOT EXISTS fattura_id UUID REFERENCES fatture (id) ON DELETE SET NULL;

ALTER TABLE spese_condominiali
  ADD COLUMN IF NOT EXISTS fattura_id UUID REFERENCES fatture (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lavori_fattura ON lavori (fattura_id);
CREATE INDEX IF NOT EXISTS idx_spese_fattura ON spese_condominiali (fattura_id);

-- Le fatture gia' emesse non hanno il legame: lo si ricostruisce dalle date,
-- che e' esattamente il criterio approssimato usato finora. Da qui in avanti
-- il legame e' esplicito.
UPDATE lavori l
SET fattura_id = f.id
FROM fatture f
WHERE l.fattura_id IS NULL
  AND l.data BETWEEN f.period_start AND f.period_end;

UPDATE spese_condominiali s
SET fattura_id = f.id
FROM fatture f
WHERE s.fattura_id IS NULL
  AND s.data_acquisto BETWEEN f.period_start AND f.period_end;

-- ---------------------------------------------------------------------------
-- 4. Emissione atomica
--    Inserire la fattura e marcare le righe sono due operazioni che devono
--    riuscire o fallire insieme: se il client le facesse in sequenza, un
--    errore nel mezzo lascerebbe righe non marcate e quindi rifatturabili.
--    `numero`, `id` e `created_by` non sono impostabili dal chiamante.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.emetti_fattura (
  dati JSONB,
  lavori_ids UUID[] DEFAULT '{}',
  spese_ids UUID[] DEFAULT '{}'
)
RETURNS fatture
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nuova fatture;
  gestore UUID;
BEGIN
  IF NOT (SELECT public.is_approved_admin ()) THEN
    RAISE EXCEPTION 'Non autorizzato';
  END IF;

  SELECT gestore_user_id INTO gestore FROM app_settings WHERE id = 1;

  BEGIN
    INSERT INTO fatture (
      period_start, period_end,
      totale_lavori, totale_spese, totale_extra, totale,
      totale_ore, numero_lavori,
      extra_voci, divisione_millesimi, lavori_snapshot, spese_snapshot,
      created_by
    )
    VALUES (
      (dati ->> 'period_start')::DATE,
      (dati ->> 'period_end')::DATE,
      COALESCE((dati ->> 'totale_lavori')::DECIMAL, 0),
      COALESCE((dati ->> 'totale_spese')::DECIMAL, 0),
      COALESCE((dati ->> 'totale_extra')::DECIMAL, 0),
      COALESCE((dati ->> 'totale')::DECIMAL, 0),
      COALESCE((dati ->> 'totale_ore')::DECIMAL, 0),
      COALESCE((dati ->> 'numero_lavori')::INT, 0),
      COALESCE(dati -> 'extra_voci', '[]'::JSONB),
      COALESCE(dati -> 'divisione_millesimi', '{}'::JSONB),
      COALESCE(dati -> 'lavori_snapshot', '[]'::JSONB),
      COALESCE(dati -> 'spese_snapshot', '[]'::JSONB),
      auth.uid ()
    )
    RETURNING * INTO nuova;
  EXCEPTION
    WHEN exclusion_violation THEN
      RAISE EXCEPTION 'Esiste gia una fattura che copre questo periodo';
  END;

  /* fattura_id IS NULL: una riga gia' fatturata non viene riassegnata.
     Il filtro su user_id vale perche' SECURITY DEFINER scavalca le RLS. */
  UPDATE lavori
  SET fattura_id = nuova.id
  WHERE id = ANY (lavori_ids)
    AND fattura_id IS NULL
    AND user_id = gestore;

  UPDATE spese_condominiali
  SET fattura_id = nuova.id
  WHERE id = ANY (spese_ids)
    AND fattura_id IS NULL
    AND user_id = gestore;

  RETURN nuova;
END;
$$;

REVOKE ALL ON FUNCTION public.emetti_fattura (JSONB, UUID[], UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.emetti_fattura (JSONB, UUID[], UUID[]) TO authenticated;

COMMIT;

-- Migrazione completata.
