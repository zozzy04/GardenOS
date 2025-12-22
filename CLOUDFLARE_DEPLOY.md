# 🚀 Deploy su Cloudflare Pages - Guida Completa

Cloudflare Pages è un'ottima alternativa gratuita con CDN globale e performance eccellenti.

## ✅ Vantaggi di Cloudflare Pages

- ✅ Deploy gratuito illimitato
- ✅ HTTPS automatico
- ✅ CDN globale ultra-veloce
- ✅ Deploy automatico da GitHub
- ✅ Variabili d'ambiente facili da configurare
- ✅ Supporto nativo per Vite/React

## 📋 Passi per il Deploy

### 1. Vai su Cloudflare Pages

1. Apri [pages.cloudflare.com](https://pages.cloudflare.com)
2. Clicca su **"Sign up"** (puoi usare GitHub per registrarti)
3. Accedi al tuo account Cloudflare

### 2. Crea un Nuovo Progetto

1. Dalla dashboard, clicca su **"Create a project"**
2. Seleziona **"Connect to Git"**
3. Autorizza Cloudflare ad accedere ai tuoi repository GitHub (se richiesto)
4. Seleziona il repository **`GardenOS`** (o `zozzy04/GardenOS`)

### 3. Configura il Build

Cloudflare dovrebbe rilevare automaticamente Vite, ma verifica:

- **Framework preset**: `Vite` (dovrebbe essere selezionato automaticamente)
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: (lascia vuoto)

### 4. ⚠️ IMPORTANTE: Configura le Variabili d'Ambiente

**PRIMA di cliccare "Save and Deploy"**, configura le variabili:

1. Clicca su **"Environment variables"** nella sezione di configurazione
2. Aggiungi **ENTRAMBE** le variabili:

#### Variabile 1: `VITE_SUPABASE_URL`
- **Variable name**: `VITE_SUPABASE_URL`
- **Value**: `https://eifsqttgepbrcbdijrhx.supabase.co`
- **Environment**: Seleziona **Production**, **Preview**, e **Branch previews**
- Clicca **"Add"**

#### Variabile 2: `VITE_SUPABASE_ANON_KEY`
- **Variable name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: La tua anon key (stringa lunga che inizia con `eyJ...`)
  - La trovi su: https://supabase.com/dashboard/project/eifsqttgepbrcbdijrhx/settings/api
  - Cerca la sezione "Project API keys" > "anon" > "public"
- **Environment**: Seleziona **Production**, **Preview**, e **Branch previews**
- Clicca **"Add"**

### 5. Deploy!

1. Clicca su **"Save and Deploy"**
2. Attendi 1-2 minuti per il build
3. ✅ La tua app sarà online su un URL tipo: `gardenos.pages.dev`

### 6. Configurazione Post-Deploy (Opzionale)

#### Cambiare il nome del progetto:
1. Vai su **"Settings"** > **"Project name"**
2. Scegli un nome personalizzato (es: `gardenos`)
3. Il nuovo URL sarà: `gardenos.pages.dev`

#### Dominio personalizzato:
1. Vai su **"Custom domains"**
2. Clicca **"Set up a custom domain"**
3. Segui le istruzioni per configurare i DNS

## 🔄 Deploy Automatico

Ogni volta che fai un push su GitHub, Cloudflare Pages farà automaticamente un nuovo deploy!

## 🐛 Troubleshooting

### Il build fallisce?
- Verifica che le variabili d'ambiente siano configurate per tutti gli ambienti
- Controlla i **Build logs** nella dashboard Cloudflare
- Assicurati che il build locale funzioni: `npm run build`

### L'app non si carica?
- Verifica che entrambe le variabili d'ambiente siano configurate
- Controlla la console del browser (F12) per errori
- Verifica che le variabili siano visibili in **Settings** > **Environment variables**

### Errori di autenticazione?
- Verifica che `VITE_SUPABASE_ANON_KEY` sia corretta
- Controlla che l'URL in `VITE_SUPABASE_URL` sia corretto
- Verifica i log di Supabase per errori

## 📝 Checklist

Prima di considerare il deploy completato:

- [ ] Repository GitHub collegato
- [ ] Framework preset: `Vite`
- [ ] Build command: `npm run build`
- [ ] Build output directory: `dist`
- [ ] `VITE_SUPABASE_URL` configurata per tutti gli ambienti
- [ ] `VITE_SUPABASE_ANON_KEY` configurata per tutti gli ambienti
- [ ] Deploy completato con successo
- [ ] L'app si carica senza errori
- [ ] Il login funziona correttamente

## 🎉 Fatto!

Una volta deployato, la tua app sarà:
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Con HTTPS automatico
- ✅ Con CDN globale ultra-veloce
- ✅ Con deploy automatico ad ogni push
- ✅ Con performance ottimali grazie alla rete Cloudflare

**Buon deploy! 🚀**

