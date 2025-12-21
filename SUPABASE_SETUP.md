# Setup Supabase per GardenOS

## 1. Installazione dipendenze

```bash
npm install @supabase/supabase-js
```

## 2. Configurazione credenziali

### Opzione A: Usando variabili d'ambiente (consigliato)

1. Copia il file `.env.example` come `.env`:
   ```bash
   cp .env.example .env
   ```

2. **Per l'app React (obbligatorio):**
   - Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
   - Copia la **anon/public key**
   - Apri `.env` e incolla la key:
     ```
     VITE_SUPABASE_ANON_KEY=la_tua_anon_key_qui
     ```

3. **Per migrazioni/script (opzionale):**
   - Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database
   - Copia la **Connection string** o la password del database
   - Apri `.env` e aggiungi (sostituisci `[YOUR-PASSWORD]` con la password reale):
     ```
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
     ```

### Opzione B: Modifica diretta del file

1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Copia la **anon/public key**
3. Apri `src/config/supabase.js` e sostituisci `YOUR_ANON_KEY_HERE` con la tua anon key

## 3. Creazione tabelle nel database

1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Clicca su "New Query"
3. Copia e incolla il contenuto di `supabase-schema.sql`
4. Esegui la query (Run)

## 4. Configurazione Autenticazione

1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers
2. Abilita "Email" come provider di autenticazione
3. (Opzionale) Configura le impostazioni email (SMTP)

## 5. Informazioni Database

### Connection String PostgreSQL
```
postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
```

**IMPORTANTE:**
- Sostituisci `[YOUR-PASSWORD]` con la password del database
- La password la trovi su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database
- **NON** esporre mai questa connection string nel codice frontend!
- Usa questa solo per:
  - Migrazioni database
  - Script di backup
  - Tool di amministrazione (pgAdmin, DBeaver, ecc.)

### Per l'applicazione React
Usa sempre il **client Supabase** (`supabase.js`) con la **anon key**, non la connection string diretta.

## 6. Test della connessione

Dopo aver configurato tutto, l'applicazione userà automaticamente Supabase invece di localStorage.

## Struttura Database

### Tabella `lavori`
- `id` (UUID): ID univoco
- `user_id` (UUID): Riferimento all'utente (auth.users)
- `data` (DATE): Data del lavoro
- `tipi` (TEXT[]): Array di tipi di lavoro
- `descrizione` (TEXT): Descrizione del lavoro
- `durata` (DECIMAL): Ore di lavoro
- `importo` (DECIMAL): Importo in euro
- `note` (TEXT): Note opzionali
- `usa_prezzo_personalizzato` (BOOLEAN): Flag per prezzo personalizzato
- `prezzo_personalizzato` (DECIMAL): Prezzo personalizzato se applicabile
- `created_at`, `updated_at`: Timestamp automatici

### Tabella `locations`
- `id` (UUID): ID univoco
- `user_id` (UUID): Riferimento all'utente
- `lat` (DECIMAL): Latitudine
- `lon` (DECIMAL): Longitudine
- `name` (TEXT): Nome della location
- `is_default` (BOOLEAN): Location di default
- `created_at`, `updated_at`: Timestamp automatici

## Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato. Gli utenti possono vedere e modificare solo i propri dati.

## Migrazione da localStorage

I dati esistenti in localStorage non verranno migrati automaticamente. Se necessario, crea uno script di migrazione.

