# 🗄️ Riepilogo Setup Supabase per GardenOS

## ✅ File Creati

1. **`supabase-schema.sql`** - Schema completo del database con:
   - Tabella `lavori` per i lavori del giardino
   - Tabella `locations` per le posizioni meteo
   - Indici per performance
   - Row Level Security (RLS) policies
   - Trigger per aggiornamento automatico timestamp

2. **`src/config/supabase.js`** - Configurazione client Supabase con:
   - Client configurato
   - Helper functions per lavori e locations
   - Servizi pronti all'uso

3. **`src/hooks/useSupabase.js`** - Custom hooks React:
   - `useAuth()` - Gestione autenticazione
   - `useLavori(userId)` - Gestione lavori
   - `useLocation(userId)` - Gestione location meteo

4. **`.env.example`** - Template per variabili d'ambiente

5. **`SUPABASE_SETUP.md`** - Guida completa setup

6. **`INTEGRAZIONE_SUPABASE.md`** - Guida integrazione componenti

## 📋 Passi da Seguire

### 1. Installazione
```bash
npm install @supabase/supabase-js
```

### 2. Configurazione Credenziali

**Opzione A (Consigliata):**
```bash
cp .env.example .env
```

Poi modifica `.env`:

1. **Per l'app React (obbligatorio):**
   - Inserisci `VITE_SUPABASE_ANON_KEY` da:
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

2. **Per migrazioni/script (opzionale):**
   - Inserisci `DATABASE_URL` con la connection string:
   - `postgresql://postgres:[PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres`
   - Sostituisci `[PASSWORD]` con la password del database
   - La trovi su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database

**Opzione B:**
Modifica direttamente `src/config/supabase.js` e sostituisci `YOUR_ANON_KEY_HERE`

### 3. Creazione Database

1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Clicca "New Query"
3. Copia e incolla tutto il contenuto di `supabase-schema.sql`
4. Clicca "Run" per eseguire

### 4. Configurazione Auth

1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers
2. Abilita "Email" provider
3. (Opzionale) Disabilita "Confirm email" in Auth > Settings per login immediato

## 🗂️ Struttura Database

### Tabella `lavori`
- Collega ogni lavoro all'utente tramite `user_id`
- Supporta array di tipi di lavoro (`tipi TEXT[]`)
- Gestisce prezzo personalizzato
- Timestamp automatici

### Tabella `locations`
- Una location di default per utente
- Constraint unico per garantire una sola default

## 🔒 Sicurezza (RLS)

Tutte le tabelle hanno **Row Level Security** abilitato:
- ✅ Utenti vedono solo i propri dati
- ✅ Utenti possono creare solo dati per se stessi
- ✅ Utenti possono modificare solo i propri dati
- ✅ Utenti possono eliminare solo i propri dati

## 📝 Prossimi Passi

Per integrare completamente Supabase nell'app:

1. **Modifica `App.jsx`** per usare `useAuth()` invece di localStorage
2. **Modifica `Login.jsx`** per usare `signUp()` e `signIn()` di Supabase
3. **Modifica `WorkLog.jsx`** per usare `useLavori()` hook
4. **Modifica `WeatherStats.jsx`** per usare `useLocation()` hook
5. **Modifica altri componenti** (Dashboard, History, Calendar, Invoice) per usare i dati da Supabase

Vedi `INTEGRAZIONE_SUPABASE.md` per esempi dettagliati.

## ⚠️ Note Importanti

- I dati in localStorage **NON** vengono migrati automaticamente
- Supabase Auth usa **email** invece di username (puoi aggiungere username nei metadata)
- Le chiavi API sono pubbliche ma sicure grazie a RLS
- Il database è già configurato per il tuo progetto: `YOUR_PROJECT_ID`

## 🔗 Link Utili

- Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
- API Settings: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
- SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
- Auth Settings: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/auth/providers

