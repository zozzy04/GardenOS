# 🚀 Guida al Deploy di GardenOS

## Opzione 1: Vercel (Consigliato - Gratuito)

Vercel è la piattaforma migliore per deployare applicazioni React/Vite. Offre:
- ✅ Deploy gratuito illimitato
- ✅ HTTPS automatico
- ✅ CDN globale
- ✅ Deploy automatico da GitHub
- ✅ Variabili d'ambiente facili da configurare

### Passi per il Deploy su Vercel:

#### 1. Prepara il Repository Git

```bash
# Assicurati di essere nella directory del progetto
cd /Users/riccardozozzolotto/giardino-dashboard

# Inizializza Git se non l'hai già fatto
git init

# Aggiungi tutti i file
git add .

# Crea il primo commit
git commit -m "Initial commit: GardenOS ready for deploy"

# Crea un repository su GitHub (vai su github.com e crea un nuovo repo)
# Poi collega il repository locale
git remote add origin https://github.com/TUO_USERNAME/gardenos.git
git branch -M main
git push -u origin main
```

#### 2. Deploy su Vercel

1. **Vai su [vercel.com](https://vercel.com)** e registrati (puoi usare GitHub)
2. **Clicca su "Add New Project"**
3. **Importa il tuo repository GitHub** (seleziona `gardenos`)
4. **Configurazione del progetto:**
   - Framework Preset: **Vite** (dovrebbe essere rilevato automaticamente)
   - Root Directory: `./` (lasciare vuoto)
   - Build Command: `npm run build` (già configurato)
   - Output Directory: `dist` (già configurato)

5. **Configura le Variabili d'Ambiente:**
   - Clicca su "Environment Variables"
   - Aggiungi **DUE** variabili:
     
     **Variabile 1:**
     - **Name**: `VITE_SUPABASE_URL`
     - **Value**: `https://YOUR_PROJECT_ID.supabase.co` (sostituisci `YOUR_PROJECT_ID` con l'ID del tuo progetto)
     - Seleziona tutti gli ambienti (Production, Preview, Development)
     - Clicca "Add"
     
     **Variabile 2:**
     - **Name**: `VITE_SUPABASE_ANON_KEY`
     - **Value**: La tua anon key di Supabase
     - Seleziona tutti gli ambienti (Production, Preview, Development)
     - Clicca "Add"

6. **Deploy!**
   - Clicca "Deploy"
   - Attendi 1-2 minuti
   - ✅ La tua app sarà online su un URL tipo: `gardenos.vercel.app`

#### 3. Configurazione Domino Personalizzato (Opzionale)

Se vuoi un dominio personalizzato:
1. Vai su "Settings" > "Domains"
2. Aggiungi il tuo dominio
3. Segui le istruzioni per configurare i DNS

---

## Opzione 2: Netlify (Alternativa Gratuita)

Netlify è un'altra ottima opzione gratuita.

### Passi per il Deploy su Netlify:

1. **Vai su [netlify.com](https://netlify.com)** e registrati
2. **Clicca su "Add new site" > "Import an existing project"**
3. **Collega GitHub** e seleziona il repository
4. **Configurazione:**
   - Build command: `npm run build`
   - Publish directory: `dist`
5. **Aggiungi variabile d'ambiente:**
   - Vai su "Site settings" > "Environment variables"
   - Aggiungi `VITE_SUPABASE_ANON_KEY` con il valore
6. **Deploy!**

---

## Opzione 3: Cloudflare Pages (Alternativa Gratuita)

1. **Vai su [pages.cloudflare.com](https://pages.cloudflare.com)**
2. **Collega il repository GitHub**
3. **Configurazione:**
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Aggiungi variabile d'ambiente** nella sezione "Environment variables"
5. **Deploy!**

---

## ⚙️ Configurazione Variabili d'Ambiente

**IMPORTANTE:** Dopo il deploy, assicurati di configurare **ENTRAMBE** le variabili d'ambiente:

### Variabile 1: `VITE_SUPABASE_URL`
- **Valore**: `https://YOUR_PROJECT_ID.supabase.co`
- **Dove trovarlo**: 
  1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
  2. L'URL è mostrato nella sezione "Project URL" o "API URL"
  3. Oppure costruiscilo sostituendo `YOUR_PROJECT_ID` con l'ID del tuo progetto (es: `https://eifsqttgepbrcbdijrhx.supabase.co`)

### Variabile 2: `VITE_SUPABASE_ANON_KEY`
- **Valore**: La tua anon/public key di Supabase
- **Dove trovarlo**: 
  1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api
  2. Copia la **anon/public key** (è una stringa lunga che inizia con `eyJ...`)
  3. Incollala nella variabile d'ambiente della piattaforma di hosting

### ⚠️ Attenzione
- **ENTRAMBE** le variabili sono obbligatorie
- Se manca anche solo una, l'app non funzionerà
- Assicurati di selezionare tutti gli ambienti (Production, Preview, Development) quando le aggiungi

---

## 🔒 Sicurezza

- ✅ Il file `.env` è già nel `.gitignore` (non verrà committato)
- ✅ Le variabili d'ambiente vanno configurate nella piattaforma di hosting
- ✅ La anon key è sicura da esporre pubblicamente (grazie a RLS)

---

## 📝 Note Importanti

1. **Dopo il deploy**, l'app sarà accessibile da qualsiasi dispositivo con internet
2. **I dati sono salvati su Supabase**, quindi saranno sincronizzati ovunque
3. **Ogni push su GitHub** triggererà un nuovo deploy automatico (se configurato)
4. **HTTPS è incluso** gratuitamente su tutte le piattaforme

---

## 🐛 Troubleshooting

### L'app non si carica dopo il deploy?
- Verifica che la variabile d'ambiente `VITE_SUPABASE_ANON_KEY` sia configurata
- Controlla i log di build nella dashboard della piattaforma
- Assicurati che il build locale funzioni: `npm run build`

### Errori di autenticazione?
- Verifica che la anon key sia corretta
- Controlla che Supabase Auth sia configurato correttamente
- Verifica i log di Supabase per errori

---

## 🎉 Dopo il Deploy

Una volta deployato, potrai:
- ✅ Accedere all'app da qualsiasi dispositivo
- ✅ I dati saranno sincronizzati in tempo reale
- ✅ L'app sarà sempre aggiornata (con deploy automatico)

**Buon deploy! 🚀**

