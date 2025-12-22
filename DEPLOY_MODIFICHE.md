# 🚀 Deploy delle Modifiche - Guida Rapida

Questa guida ti aiuta a deployare le nuove modifiche (Spese Condominiali e fix salvataggio lavori).

## 📋 Checklist Pre-Deploy

Prima di fare il deploy, assicurati di aver completato questi passi:

### ✅ 1. Database Supabase

**Esegui lo script SQL aggiornato:**
1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Vai su **SQL Editor**
4. Copia e incolla il contenuto di `supabase-schema.sql`
5. Clicca **Run** (o F5)
6. ✅ Verifica che non ci siano errori

**Cosa fa lo script:**
- Crea la tabella `spese_condominiali`
- Aggiunge indici per le performance
- Configura le policy RLS (Row Level Security)
- Aggiunge trigger per `updated_at`

### ✅ 2. Storage Supabase (per gli scontrini)

**Crea il bucket Storage:**
1. Vai su **Storage** nel menu laterale di Supabase
2. Clicca su **New bucket**
3. Nome: `scontrini`
4. Seleziona **Public bucket**
5. Clicca **Create bucket**

**Configura le Policy RLS:**
Segui le istruzioni dettagliate in `SUPABASE_STORAGE_SETUP.md`

**Policy necessarie:**
- ✅ Users can upload scontrini (INSERT)
- ✅ Public can read scontrini (SELECT)
- ✅ Users can delete own scontrini (DELETE)

### ✅ 3. Build Locale (Test)

**Testa che tutto funzioni localmente:**
```bash
# Installa dipendenze (se necessario)
npm install

# Build di produzione
npm run build

# Verifica che non ci siano errori
# La cartella dist/ dovrebbe essere creata con successo
```

## 🚀 Deploy su Vercel

### Opzione A: Deploy Automatico (se hai già configurato GitHub)

Se hai già collegato il repository a Vercel:

1. **Commit e Push le modifiche:**
```bash
git add .
git commit -m "Aggiunta sezione Spese Condominiali e fix salvataggio lavori"
git push origin main
```

2. **Vercel deployerà automaticamente** 🎉
   - Vai su https://vercel.com/dashboard
   - Controlla che il deploy sia in corso
   - Attendi 1-2 minuti

3. **Verifica il deploy:**
   - Controlla che non ci siano errori di build
   - Testa l'app online

### Opzione B: Deploy Manuale

Se non hai ancora configurato il deploy automatico:

1. **Build locale:**
```bash
npm run build
```

2. **Deploy tramite Vercel CLI:**
```bash
# Installa Vercel CLI (se non l'hai già)
npm i -g vercel

# Deploy
vercel --prod
```

3. **Oppure usa il drag & drop:**
   - Vai su https://vercel.com/dashboard
   - Clicca "Add New Project"
   - Seleziona "Import Git Repository" o "Deploy"
   - Carica la cartella `dist/`

## 🔍 Verifica Post-Deploy

Dopo il deploy, verifica che tutto funzioni:

### ✅ Test Funzionalità

1. **Login:**
   - Accedi all'app
   - Verifica che il login funzioni

2. **Lavori:**
   - Aggiungi un nuovo lavoro
   - Verifica che appaia nello storico
   - Verifica che appaia nella dashboard
   - Verifica che appaia nel calendario

3. **Spese Condominiali:**
   - Vai su "Spese Condominiali" nel menu
   - Aggiungi una nuova spesa
   - Carica uno scontrino (foto o PDF)
   - Verifica che venga salvata correttamente

4. **Fattura:**
   - Genera una fattura per un periodo
   - Verifica che le spese siano incluse
   - Scarica il PDF
   - Verifica che le immagini degli scontrini siano visibili nel PDF

## 🐛 Troubleshooting

### Errore "Bucket not found"
- Verifica che il bucket `scontrini` sia stato creato in Supabase Storage
- Controlla che il nome sia esattamente `scontrini` (minuscolo)

### Errore "Permission denied" nell'upload
- Verifica che le policy RLS siano configurate correttamente
- Controlla `SUPABASE_STORAGE_SETUP.md` per le policy corrette

### I lavori non si salvano
- Verifica che lo script SQL sia stato eseguito correttamente
- Controlla i log di Supabase per errori
- Verifica che le variabili d'ambiente siano configurate in Vercel

### Le immagini non appaiono nel PDF
- Verifica che il bucket sia pubblico
- Controlla che l'URL dell'immagine sia accessibile
- Assicurati che le immagini siano in formato JPG, PNG o WEBP

### Build fallisce su Vercel
- Controlla i log di build nella dashboard Vercel
- Verifica che tutte le dipendenze siano in `package.json`
- Assicurati che Node.js versione sia >= 20.19.0

## 📝 Note Importanti

1. **Variabili d'Ambiente:**
   - Assicurati che `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` siano configurate in Vercel
   - Vai su: Settings > Environment Variables

2. **Database:**
   - Lo script SQL può essere eseguito più volte (è idempotente)
   - Le policy esistenti verranno eliminate e ricreate

3. **Storage:**
   - Il bucket deve essere pubblico per permettere l'accesso alle immagini nel PDF
   - La sicurezza è garantita dalle policy RLS

## ✅ Checklist Finale

Prima di considerare il deploy completato:

- [ ] Script SQL eseguito senza errori
- [ ] Bucket Storage `scontrini` creato
- [ ] Policy RLS configurate per Storage
- [ ] Build locale funziona (`npm run build`)
- [ ] Deploy su Vercel completato
- [ ] Login funziona
- [ ] Nuovi lavori si salvano correttamente
- [ ] Spese condominiali funzionano
- [ ] Upload scontrini funziona
- [ ] Fattura include le spese
- [ ] PDF contiene le immagini degli scontrini

## 🎉 Fatto!

Una volta completati tutti i passi, la tua app sarà online con tutte le nuove funzionalità!

**Buon deploy! 🚀**

