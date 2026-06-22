-- Aggiunge la colonna extra_voci alla tabella lavori.
-- Ogni riga può contenere un array JSON di { label: string, prezzo: number }.
-- Esegui in Supabase SQL Editor prima di usare la funzionalità costi extra in Registro lavori.

ALTER TABLE lavori ADD COLUMN IF NOT EXISTS extra_voci jsonb DEFAULT '[]';
