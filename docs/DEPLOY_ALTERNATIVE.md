# 🌐 Alternative di Deploy per GardenOS

Se Vercel non funziona, ecco altre opzioni gratuite e facili da usare.

## 🎯 Opzioni Disponibili

### 1. Netlify ⭐ (Consigliato come alternativa)

**Vantaggi:**
- ✅ Molto simile a Vercel
- ✅ Setup semplicissimo
- ✅ Deploy automatico da GitHub
- ✅ File di configurazione già pronto (`netlify.toml`)

**Guida completa:** Vedi [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)

**Tempo stimato:** 5 minuti

---

### 2. Cloudflare Pages ⭐ (Ottima alternativa)

**Vantaggi:**
- ✅ CDN globale ultra-veloce
- ✅ Performance eccellenti
- ✅ Deploy automatico da GitHub
- ✅ Gratuito e illimitato

**Guida completa:** Vedi [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

**Tempo stimato:** 5 minuti

---

### 3. GitHub Pages (Opzionale, richiede più configurazione)

**Vantaggi:**
- ✅ Gratuito
- ✅ Integrato con GitHub
- ⚠️ Richiede configurazione aggiuntiva per SPA

**Nota:** Richiede modifiche a `vite.config.js` per funzionare correttamente con le Single Page Applications.

---

## 🚀 Quick Start

### Opzione A: Netlify (Più Semplice)

1. Vai su [netlify.com](https://netlify.com)
2. Clicca "Add new site" > "Import an existing project"
3. Collega GitHub e seleziona `GardenOS`
4. **IMPORTANTE:** Aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL` = `https://eifsqttgepbrcbdijrhx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (la tua anon key)
5. Clicca "Deploy site"
6. ✅ Fatto!

**Guida dettagliata:** [NETLIFY_DEPLOY.md](./NETLIFY_DEPLOY.md)

---

### Opzione B: Cloudflare Pages (Più Veloce)

1. Vai su [pages.cloudflare.com](https://pages.cloudflare.com)
2. Clicca "Create a project" > "Connect to Git"
3. Collega GitHub e seleziona `GardenOS`
4. **IMPORTANTE:** Aggiungi le variabili d'ambiente:
   - `VITE_SUPABASE_URL` = `https://eifsqttgepbrcbdijrhx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (la tua anon key)
5. Clicca "Save and Deploy"
6. ✅ Fatto!

**Guida dettagliata:** [CLOUDFLARE_DEPLOY.md](./CLOUDFLARE_DEPLOY.md)

---

## ⚠️ IMPORTANTE: Variabili d'Ambiente

**ENTRAMBE le piattaforme richiedono le stesse variabili:**

1. **`VITE_SUPABASE_URL`**
   - Valore: `https://eifsqttgepbrcbdijrhx.supabase.co`
   - Dove trovarlo: https://supabase.com/dashboard/project/eifsqttgepbrcbdijrhx/settings/api

2. **`VITE_SUPABASE_ANON_KEY`**
   - Valore: La tua anon key (stringa lunga che inizia con `eyJ...`)
   - Dove trovarlo: https://supabase.com/dashboard/project/eifsqttgepbrcbdijrhx/settings/api
   - Cerca la sezione "Project API keys" > "anon" > "public"

**⚠️ Senza queste variabili, l'app NON funzionerà!**

---

## 🔍 Confronto Rapido

| Caratteristica | Netlify | Cloudflare Pages |
|----------------|---------|------------------|
| Setup | ⭐⭐⭐⭐⭐ Facilissimo | ⭐⭐⭐⭐⭐ Facilissimo |
| Performance | ⭐⭐⭐⭐ Ottima | ⭐⭐⭐⭐⭐ Eccellente |
| CDN | ⭐⭐⭐⭐ Buona | ⭐⭐⭐⭐⭐ Globale |
| Deploy Auto | ✅ Sì | ✅ Sì |
| HTTPS | ✅ Automatico | ✅ Automatico |
| Dominio Custom | ✅ Sì | ✅ Sì |

**Raccomandazione:** Entrambe sono ottime. Scegli quella che preferisci!

---

## 🐛 Problemi Comuni

### "Failed to fetch" o "ERR_NAME_NOT_RESOLVED"
- **Causa:** Le variabili d'ambiente non sono configurate
- **Soluzione:** Aggiungi `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nella dashboard della piattaforma

### Il build fallisce
- **Causa:** Problema con le dipendenze o configurazione
- **Soluzione:** Verifica che il build locale funzioni: `npm run build`

### L'app si carica ma il login non funziona
- **Causa:** `VITE_SUPABASE_ANON_KEY` errata o mancante
- **Soluzione:** Verifica che la anon key sia corretta e configurata per tutti gli ambienti

---

## 📞 Supporto

Se hai problemi:
1. Controlla i **Build logs** nella dashboard della piattaforma
2. Controlla la **Console del browser** (F12) per errori
3. Verifica che le variabili d'ambiente siano configurate correttamente
4. Assicurati di aver fatto un **redeploy** dopo aver aggiunto le variabili

---

## 🎉 Dopo il Deploy

Una volta deployato con successo:
- ✅ L'app sarà accessibile da qualsiasi dispositivo
- ✅ I dati saranno sincronizzati su Supabase
- ✅ Ogni push su GitHub triggererà un nuovo deploy
- ✅ HTTPS sarà configurato automaticamente

**Buon deploy! 🚀**

