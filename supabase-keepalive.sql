-- GardenOS: keepalive automatico per Supabase free tier
-- Previene il pausing automatico del DB (scatta dopo 7 giorni senza attività)
-- Esegui nel SQL Editor di Supabase una sola volta

-- pg_cron è disponibile su tutti i piani Supabase
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Rimuovi job precedente se esiste (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'gardenos-keepalive') THEN
    PERFORM cron.unschedule('gardenos-keepalive');
  END IF;
END $$;

-- Query leggera ogni 3 giorni alle 06:00 UTC
-- Mantiene il DB attivo senza toccare dati reali
SELECT cron.schedule(
  'gardenos-keepalive',
  '0 6 */3 * *',
  $$SELECT COUNT(*) FROM famiglie$$
);
