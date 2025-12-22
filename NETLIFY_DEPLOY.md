# 🚀 Deploy su Netlify - Guida Completa

Netlify è un'ottima alternativa a Vercel, molto semplice da usare e completamente gratuita.

## ✅ Vantaggi di Netlify

- ✅ Deploy gratuito illimitato
- ✅ HTTPS automatico
- ✅ CDN globale
- ✅ Deploy automatico da GitHub
- ✅ Variabili d'ambiente facili da configurare
- ✅ Supporto nativo per Vite/React

## 📋 Passi per il Deploy

### 1. Vai su Netlify

1. Apri [netlify.com](https://netlify.com)
2. Clicca su **"Sign up"** (puoi usare GitHub per registrarti velocemente)
3. Accedi al tuo account

### 2. Importa il Progetto

1. Dalla dashboard, clicca su **"Add new site"**
2. Seleziona **"Import an existing project"**
3. Clicca su **"Deploy with GitHub"**
4. Autorizza Netlify ad accedere ai tuoi repository (se richiesto)
5. Seleziona il repository **`GardenOS`** (o `zozzy04/GardenOS`)

### 3. Configura il Build

Netlify dovrebbe rilevare automaticamente Vite, ma verifica queste impostazioni:

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Base directory**: (lascia vuoto)

### 4. ⚠️ IMPORTANTE: Configura le Variabili d'Ambiente

**PRIMA di cliccare "Deploy"**, configura le variabili:

1. Clicca su **"Show advanced"** o **"Environment variables"**
2. Aggiungi **ENTRAMBE** le variabili:

#### Variabile 1: `VITE_SUPABASE_URL`
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://eifsqttgepbrcbdijrhx.supabase.co`
- Clicca **"Add variable"**

#### Variabile 2: `VITE_SUPABASE_ANON_KEY`
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: La tua anon key (stringa lunga che inizia con `eyJ...`)
  - La trovi su: https://supabase.com/dashboard/project/eifsqttgepbrcbdijrhx/settings/api
  - Cerca la sezione "Project API keys" > "anon" > "public"
- Clicca **"Add variable"**

### 5. Deploy!

1. Clicca su **"Deploy site"**
2. Attendi 1-2 minuti per il build
3. ✅ La tua app sarà online su un URL tipo: `gardenos-xxxxx.netlify.app`

### 6. Configurazione Post-Deploy (Opzionale)

#### Cambiare il nome del sito:
1. Vai su **"Site settings"** > **"Change site name"**
2. Scegli un nome personalizzato (es: `gardenos`)
3. Il nuovo URL sarà: `gardenos.netlify.app`

#### Dominio personalizzato:
1. Vai su **"Domain settings"**
2. Clicca **"Add custom domain"**
3. Segui le istruzioni per configurare i DNS

## 🔄 Deploy Automatico

Ogni volta che fai un push su GitHub, Netlify farà automaticamente un nuovo deploy!

## 🐛 Troubleshooting

### Il build fallisce?
- Verifica che le variabili d'ambiente siano configurate
- Controlla i **Deploy logs** nella dashboard Netlify
- Assicurati che il build locale funzioni: `npm run build`

### L'app non si carica?
- Verifica che entrambe le variabili d'ambiente siano configurate
- Controlla la console del browser (F12) per errori
- Verifica che le variabili siano visibili in **Site settings** > **Environment variables**

### Errori di autenticazione?
- Verifica che `VITE_SUPABASE_ANON_KEY` sia corretta
- Controlla che l'URL in `VITE_SUPABASE_URL` sia corretto
- Verifica i log di Supabase per errori

## 📝 Checklist

Prima di considerare il deploy completato:

- [ ] Repository GitHub collegato
- [ ] Build command: `npm run build`
- [ ] Publish directory: `dist`
- [ ] `VITE_SUPABASE_URL` configurata
- [ ] `VITE_SUPABASE_ANON_KEY` configurata
- [ ] Deploy completato con successo
- [ ] L'app si carica senza errori
- [ ] Il login funziona correttamente

## 🎉 Fatto!

Una volta deployato, la tua app sarà:
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con HTTPS automatico
- ✅ Con deploy automatico ad ogni push
- ✅ Con CDN globale per performance ottimali

**Buon deploy! 🚀**

