# Configurazione Supabase Storage per Scontrini

Per abilitare l'upload degli scontrini (foto e PDF) delle spese condominiali, è necessario configurare un bucket Storage in Supabase.

## Passi per la Configurazione

1. **Accedi al Dashboard Supabase**
   - Vai su https://supabase.com/dashboard
   - Seleziona il tuo progetto

2. **Crea il Bucket "scontrini"**
   - Vai su **Storage** nel menu laterale
   - Clicca su **New bucket**
   - Nome bucket: `scontrini`
   - Seleziona **Public bucket** (per permettere l'accesso pubblico alle immagini)
   - Clicca su **Create bucket**

3. **Configura le Policy RLS (Row Level Security)**
   - Vai su **Storage** > **Policies**
   - Seleziona il bucket `scontrini`
   - Clicca su **New Policy**
   
   **Policy 1: Permetti upload agli utenti autenticati**
   - Policy name: `Users can upload scontrini`
   - Allowed operation: `INSERT`
   - Policy definition:
   ```sql
   (bucket_id = 'scontrini'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
   ```
   
   **Policy 2: Permetti lettura pubblica**
   - Policy name: `Public can read scontrini`
   - Allowed operation: `SELECT`
   - Policy definition:
   ```sql
   bucket_id = 'scontrini'::text
   ```
   
   **Policy 3: Permetti eliminazione al proprietario**
   - Policy name: `Users can delete own scontrini`
   - Allowed operation: `DELETE`
   - Policy definition:
   ```sql
   (bucket_id = 'scontrini'::text) AND (auth.uid()::text = (storage.foldername(name))[1])
   ```

4. **Verifica la Configurazione**
   - Prova ad aggiungere una spesa con scontrino dall'app
   - Verifica che il file venga caricato correttamente
   - Controlla che l'immagine sia visibile nella fattura PDF

## Note Importanti

- I file vengono salvati nella struttura: `{user_id}/{timestamp}.{ext}`
- Il bucket è pubblico per permettere l'accesso alle immagini nella fattura PDF
- La sicurezza è garantita dalle policy RLS che limitano upload/delete solo ai file dell'utente
- Dimensione massima file: 10MB (configurata nel componente)

## Troubleshooting

**Errore "Bucket not found"**
- Verifica che il bucket si chiami esattamente `scontrini` (minuscolo)
- Controlla che il bucket sia stato creato correttamente

**Errore "Permission denied"**
- Verifica che le policy RLS siano configurate correttamente
- Controlla che l'utente sia autenticato

**Immagini non visibili nel PDF**
- Verifica che il bucket sia pubblico
- Controlla che l'URL dell'immagine sia accessibile pubblicamente
- Assicurati che le immagini siano in formato JPG, PNG o WEBP (non PDF per l'anteprima)

