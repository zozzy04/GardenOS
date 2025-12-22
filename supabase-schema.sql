-- Schema database Supabase per GardenOS
-- Esegui questo script nella SQL Editor di Supabase
-- IMPORTANTE: Questo schema usa Supabase Auth (auth.users) per gli utenti

-- 1. Tabella Lavori
CREATE TABLE IF NOT EXISTS lavori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  tipi TEXT[] NOT NULL, -- Array di tipi di lavoro
  descrizione TEXT NOT NULL,
  durata DECIMAL(3,1) NOT NULL, -- Ore di lavoro (0.5 - 10.0)
  importo DECIMAL(10,2) NOT NULL,
  note TEXT,
  usa_prezzo_personalizzato BOOLEAN DEFAULT FALSE,
  prezzo_personalizzato DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabella Location Meteo
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lat DECIMAL(10,8) NOT NULL,
  lon DECIMAL(11,8) NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella Spese Condominiali
CREATE TABLE IF NOT EXISTS spese_condominiali (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  oggetto TEXT NOT NULL,
  data_acquisto DATE NOT NULL,
  prezzo DECIMAL(10,2) NOT NULL,
  scontrino_url TEXT, -- URL del file caricato in Supabase Storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_lavori_user_id ON lavori(user_id);
CREATE INDEX IF NOT EXISTS idx_lavori_data ON lavori(data);
CREATE INDEX IF NOT EXISTS idx_lavori_user_data ON lavori(user_id, data);
CREATE INDEX IF NOT EXISTS idx_locations_user_id ON locations(user_id);
-- Indice unico per garantire una sola location di default per utente
CREATE UNIQUE INDEX IF NOT EXISTS idx_locations_default_unique 
  ON locations(user_id) 
  WHERE is_default = TRUE;
CREATE INDEX IF NOT EXISTS idx_spese_user_id ON spese_condominiali(user_id);
CREATE INDEX IF NOT EXISTS idx_spese_data ON spese_condominiali(data_acquisto);
CREATE INDEX IF NOT EXISTS idx_spese_user_data ON spese_condominiali(user_id, data_acquisto);

-- Row Level Security (RLS) Policies
-- Abilita RLS su tutte le tabelle
ALTER TABLE lavori ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE spese_condominiali ENABLE ROW LEVEL SECURITY;

-- Elimina policy esistenti se presenti (per permettere re-esecuzione dello script)
DROP POLICY IF EXISTS "Users can view own lavori" ON lavori;
DROP POLICY IF EXISTS "Users can insert own lavori" ON lavori;
DROP POLICY IF EXISTS "Users can update own lavori" ON lavori;
DROP POLICY IF EXISTS "Users can delete own lavori" ON lavori;

DROP POLICY IF EXISTS "Users can view own locations" ON locations;
DROP POLICY IF EXISTS "Users can insert own locations" ON locations;
DROP POLICY IF EXISTS "Users can update own locations" ON locations;
DROP POLICY IF EXISTS "Users can delete own locations" ON locations;

DROP POLICY IF EXISTS "Users can view own spese" ON spese_condominiali;
DROP POLICY IF EXISTS "Users can insert own spese" ON spese_condominiali;
DROP POLICY IF EXISTS "Users can update own spese" ON spese_condominiali;
DROP POLICY IF EXISTS "Users can delete own spese" ON spese_condominiali;

-- Policy per lavori: gli utenti possono vedere solo i propri lavori
CREATE POLICY "Users can view own lavori"
  ON lavori FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lavori"
  ON lavori FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lavori"
  ON lavori FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own lavori"
  ON lavori FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per locations: gli utenti possono vedere solo le proprie location
CREATE POLICY "Users can view own locations"
  ON locations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own locations"
  ON locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own locations"
  ON locations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own locations"
  ON locations FOR DELETE
  USING (auth.uid() = user_id);

-- Policy per spese_condominiali: gli utenti possono vedere solo le proprie spese
CREATE POLICY "Users can view own spese"
  ON spese_condominiali FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spese"
  ON spese_condominiali FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spese"
  ON spese_condominiali FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own spese"
  ON spese_condominiali FOR DELETE
  USING (auth.uid() = user_id);

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Elimina trigger esistenti se presenti (per permettere re-esecuzione dello script)
DROP TRIGGER IF EXISTS update_lavori_updated_at ON lavori;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_spese_updated_at ON spese_condominiali;

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_lavori_updated_at
  BEFORE UPDATE ON lavori
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_spese_updated_at
  BEFORE UPDATE ON spese_condominiali
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

