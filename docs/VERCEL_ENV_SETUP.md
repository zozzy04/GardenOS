# 🔧 Configurazione Variabili d'Ambiente in Vercel

## ⚠️ IMPORTANTE: Questo è il passaggio più critico!

Se vedi errori come `your_project_id.supabase.co` o `Failed to fetch`, significa che le variabili d'ambiente non sono configurate correttamente in Vercel.

## 📋 Passi da Seguire

### 1. Vai su Vercel Dashboard

1. Accedi a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto **GardenOS**

### 2. Aggiungi le Variabili d'Ambiente

1. Vai su **Settings** > **Environment Variables**
2. Aggiungi **ENTRAMBE** le variabili seguenti:

#### Variabile 1: `VITE_SUPABASE_URL`

- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://eifsqttgepbrcbdijrhx.supabase.co`
  - ⚠️ Sostituisci `eifsqttgepbrcbdijrhx` con il tuo Project ID se diverso
  - Lo trovi su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
- **Environments**: Seleziona tutti (Production, Preview, Development)
- Clicca **Save**

#### Variabile 2: `VITE_SUPABASE_ANON_KEY`

- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: La tua anon key (stringa lunga che inizia con `eyJ...`)
  - La trovi su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
  - Cerca la sezione "Project API keys" > "anon" > "public"
- **Environments**: Seleziona tutti (Production, Preview, Development)
- Clicca **Save**

### 3. Riavvia il Deploy

Dopo aver aggiunto le variabili:

1. Vai su **Deployments**
2. Trova l'ultimo deployment
3. Clicca sui **tre puntini** (⋮)
4. Seleziona **Redeploy**
5. Oppure fai un nuovo commit per triggerare un deploy automatico

### 4. Verifica

Dopo il deploy, verifica che:
- ✅ L'app si carica senza errori
- ✅ Il login funziona
- ✅ Non ci sono errori nella console del browser

## 🔍 Come Trovare le Credenziali Supabase

### Project ID e URL

1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
2. Il **Project URL** è mostrato nella sezione "Project URL"
   - Formato: `https://YOUR_PROJECT_ID.supabase.co`
   - Esempio: `https://eifsqttgepbrcbdijrhx.supabase.co`

### Anon Key

1. Nella stessa pagina, cerca la sezione **"Project API keys"**
2. Trova la chiave **"anon"** o **"public"**
3. Clicca sull'icona di copia per copiarla
4. È una stringa lunga che inizia con `eyJ...`

## ⚠️ Errori Comuni

### Errore: `your_project_id.supabase.co`
- **Causa**: `VITE_SUPABASE_URL` non configurata o errata
- **Soluzione**: Aggiungi/corregi la variabile `VITE_SUPABASE_URL` in Vercel

### Errore: `Failed to fetch` o `ERR_NAME_NOT_RESOLVED`
- **Causa**: `VITE_SUPABASE_URL` contiene un placeholder invece dell'URL reale
- **Soluzione**: Verifica che l'URL sia corretto (formato: `https://PROJECT_ID.supabase.co`)

### Errore: `Invalid API key`
- **Causa**: `VITE_SUPABASE_ANON_KEY` non configurata o errata
- **Soluzione**: Verifica di aver copiato correttamente la anon key da Supabase

### L'app funziona in locale ma non su Vercel
- **Causa**: Le variabili d'ambiente sono configurate solo in locale (file `.env`)
- **Soluzione**: Aggiungi le variabili anche in Vercel (vedi sopra)

## 📝 Checklist

Prima di considerare il deploy completato, verifica:

- [ ] `VITE_SUPABASE_URL` è configurata in Vercel
- [ ] `VITE_SUPABASE_ANON_KEY` è configurata in Vercel
- [ ] Entrambe le variabili sono selezionate per tutti gli ambienti
- [ ] Hai fatto un nuovo deploy dopo aver aggiunto le variabili
- [ ] L'app si carica senza errori
- [ ] Il login funziona correttamente

## 🆘 Ancora Problemi?

Se dopo aver seguito questi passi hai ancora problemi:

1. Controlla i **Build Logs** in Vercel per errori durante il build
2. Controlla la **Console del Browser** (F12) per errori runtime
3. Verifica che le variabili siano visibili in **Settings** > **Environment Variables**
4. Assicurati di aver fatto un **Redeploy** dopo aver aggiunto le variabili

