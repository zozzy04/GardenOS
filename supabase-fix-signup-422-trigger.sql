-- GardenOS: elimina il 422 su POST /auth/v1/signup quando il trigger profilo fallisce.
-- Esegui UNA VOLTA nel SQL Editor di Supabase.
--
-- Cause tipiche:
-- 1) RLS su public.profiles blocca l’INSERT del trigger → "Database error saving new user" / 422
-- 2) UUID famiglia_id nei metadati non valido (mitigato sotto)
--
-- Dopo questo script, la registrazione da app può usare signUp senza metadata (consigliato)
-- oppure con famiglia_id nei metadati.

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
