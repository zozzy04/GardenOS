# 🚀 Istruzioni per Push su GitHub

## ✅ Commit Completato!

Ho già fatto il commit di tutti i file. Ora devi solo:

## 📋 Passi da Seguire:

### 1. Crea il Repository su GitHub

1. Vai su [github.com](https://github.com) e accedi
2. Clicca sul pulsante **"+"** in alto a destra > **"New repository"**
3. Compila il form:
   - **Repository name**: `gardenos` (o il nome che preferisci)
   - **Description**: "Dashboard per gestione lavori giardino"
   - **Visibility**: Pubblica o Privata (come preferisci)
   - ⚠️ **NON** selezionare "Add a README file" (ne abbiamo già uno)
   - ⚠️ **NON** selezionare "Add .gitignore" (ne abbiamo già uno)
   - ⚠️ **NON** selezionare "Choose a license"
4. Clicca **"Create repository"**

### 2. Collega e Pusha su GitHub

Dopo aver creato il repository, GitHub ti mostrerà delle istruzioni. Usa questi comandi:

```bash
cd /Users/riccardozozzolotto/giardino-dashboard

# Aggiungi il remote (sostituisci TUO_USERNAME con il tuo username GitHub)
git remote add origin https://github.com/TUO_USERNAME/gardenos.git

# Rinomina il branch a main (se necessario)
git branch -M main

# Pusha tutto su GitHub
git push -u origin main
```

**Oppure** se preferisci SSH:

```bash
git remote add origin git@github.com:TUO_USERNAME/gardenos.git
git branch -M main
git push -u origin main
```

### 3. Verifica

Dopo il push, ricarica la pagina del repository su GitHub. Dovresti vedere tutti i file del progetto.

## 🎯 Prossimo Passo: Vercel

Una volta che il repository è su GitHub, vai su Vercel e:
1. Importa il repository
2. Configura la variabile d'ambiente `VITE_SUPABASE_ANON_KEY`
3. Deploy!

---

**Nota**: Se hai già un repository GitHub esistente, puoi saltare il passo 1 e usare direttamente il passo 2 con l'URL del tuo repository.

