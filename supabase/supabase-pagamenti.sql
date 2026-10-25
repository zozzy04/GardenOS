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
