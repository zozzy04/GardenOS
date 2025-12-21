# Guida Integrazione Supabase

## Passi per integrare Supabase nell'applicazione

### 1. Installazione

```bash
npm install @supabase/supabase-js
```

### 2. Configurazione

1. **Crea file `.env`** nella root del progetto:
   ```
   VITE_SUPABASE_ANON_KEY=la_tua_anon_key_qui
   ```

2. **Ottieni la chiave** da: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

### 3. Esegui lo schema SQL

1. Vai su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor
2. Clicca "New Query"
3. Copia e incolla il contenuto di `supabase-schema.sql`
4. Esegui la query

### 4. Modifica i componenti

I componenti devono essere aggiornati per usare Supabase invece di localStorage. 

**Esempio per WorkLog.jsx:**

```javascript
import { useLavori } from '../hooks/useSupabase'
import { useAuth } from '../hooks/useSupabase'

const WorkLog = () => {
  const { user } = useAuth()
  const { lavori, loading, createLavoro, updateLavoro, deleteLavoro } = useLavori(user?.id)

  // Sostituisci localStorage con le chiamate Supabase
  const handleSubmit = async (e) => {
    e.preventDefault()
    // ... validazione ...
    
    if (editingId) {
      await updateLavoro(editingId, workData)
    } else {
      await createLavoro(workData)
    }
  }
  
  // ... resto del codice
}
```

**Esempio per Login.jsx:**

```javascript
import { useAuth } from '../hooks/useSupabase'

const Login = ({ onLogin }) => {
  const { signUp, signIn, user } = useAuth()
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (isLogin) {
      const { data, error } = await signIn(formData.email, formData.password)
      if (error) {
        setError(error.message)
      } else {
        onLogin(data.user)
      }
    } else {
      const { data, error } = await signUp(
        formData.email, 
        formData.password,
        { username: formData.username } // metadata
      )
      if (error) {
        setError(error.message)
      } else {
        onLogin(data.user)
      }
    }
  }
}
```

### 5. Modifica App.jsx

```javascript
import { useAuth } from './hooks/useSupabase'

function App() {
  const { user, loading, signOut } = useAuth()
  
  if (loading) {
    return <div>Caricamento...</div>
  }
  
  if (!user) {
    return <Login onLogin={() => {}} />
  }
  
  // ... resto del codice
}
```

## Struttura Database

### Tabella `lavori`
- Tutti i lavori del giardino
- Collegata a `auth.users` tramite `user_id`
- RLS abilitato: ogni utente vede solo i propri dati

### Tabella `locations`
- Location meteo salvate
- Una location di default per utente
- RLS abilitato

## Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato. Gli utenti possono:
- ✅ Vedere solo i propri dati
- ✅ Creare solo dati per se stessi
- ✅ Modificare solo i propri dati
- ✅ Eliminare solo i propri dati

## Migrazione da localStorage

I dati esistenti in localStorage NON vengono migrati automaticamente. 

Per migrare manualmente:
1. Esporta i dati da localStorage
2. Usa lo script di migrazione (da creare se necessario)
3. Oppure ricrea i dati manualmente

## Note Importanti

- **Autenticazione**: Usa Supabase Auth invece di localStorage per gli utenti
- **Sicurezza**: Le chiavi API sono pubbliche ma sicure grazie a RLS
- **Performance**: I dati vengono caricati in modo asincrono
- **Offline**: Supabase gestisce automaticamente la cache e la sincronizzazione

