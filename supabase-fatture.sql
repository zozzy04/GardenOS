-- GardenOS: tabella fatture emesse dal gestore
-- Esegui nel SQL Editor di Supabase DOPO supabase-condomini.sql
--
-- Questa tabella memorizza uno snapshot di ogni fattura al momento dell'emissione.
-- I condomini approvati possono leggere tutte le fatture (RLS via is_approved_condomino).
-- Solo l'admin può inserire ed eliminare.

CREATE TABLE IF NOT EXISTS fatture (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start  DATE NOT NULL,
  period_end    DATE NOT NULL,
  totale_lavori DECIMAL(12,2) NOT NULL DEFAULT 0,
  totale_spese  DECIMAL(12,2) NOT NULL DEFAULT 0,
  totale_extra  DECIMAL(12,2) NOT NULL DEFAULT 0,
  totale        DECIMAL(12,2) NOT NULL DEFAULT 0,
  totale_ore    DECIMAL(8,2)  NOT NULL DEFAULT 0,
  numero_lavori INT           NOT NULL DEFAULT 0,
  -- [{label: string, prezzo: number}]
  extra_voci          JSONB NOT NULL DEFAULT '[]',
  -- {famiglia: {millesimi: number, importo: number}}
  divisione_millesimi JSONB NOT NULL DEFAULT '{}',
  -- [{data, tipi, descrizione, durata, importo, usaPrezzoPersonalizzato, note}]
  lavori_snapshot     JSONB NOT NULL DEFAULT '[]',
  -- [{oggetto, data_acquisto, prezzo}]
  spese_snapshot      JSONB NOT NULL DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_fatture_period_end ON fatture (period_end DESC);
CREATE INDEX IF NOT EXISTS idx_fatture_created_at ON fatture (created_at DESC);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

ALTER TABLE fatture ENABLE ROW LEVEL SECURITY;

-- Admin: lettura, inserimento, eliminazione
DROP POLICY IF EXISTS "fatture_select_admin"  ON fatture;
DROP POLICY IF EXISTS "fatture_insert_admin"  ON fatture;
DROP POLICY IF EXISTS "fatture_delete_admin"  ON fatture;

CREATE POLICY "fatture_select_admin" ON fatture
  FOR SELECT USING (public.is_approved_admin());

CREATE POLICY "fatture_insert_admin" ON fatture
  FOR INSERT WITH CHECK (public.is_approved_admin());

CREATE POLICY "fatture_delete_admin" ON fatture
  FOR DELETE USING (public.is_approved_admin());

-- Condomini approvati: solo lettura
DROP POLICY IF EXISTS "fatture_select_condomino" ON fatture;

CREATE POLICY "fatture_select_condomino" ON fatture
  FOR SELECT USING (public.is_approved_condomino());

GRANT SELECT, INSERT, DELETE ON fatture TO authenticated;
