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
