// Configurazione Supabase
// IMPORTANTE: Sostituisci queste credenziali con quelle del tuo progetto Supabase
// Le trovi in: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

import { createClient } from '@supabase/supabase-js'

// URL: VITE_* oppure NEXT_PUBLIC_* (stesso valore che useresti su Next.js)
const supabaseUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://YOUR_PROJECT_ID.supabase.co'
).trim()

// Chiave pubblica: anon JWT (eyJ...) oppure chiave publishable nuova (sb_publishable_...)
// Se resta vuota, @supabase/supabase-js non invia l'header `apikey` → errore API "No API key found in request"
const supabaseAnonKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
  'YOUR_ANON_KEY_HERE'
).trim()

// Validazione: mostra errore chiaro se le variabili non sono configurate
const isConfigValid =
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0 &&
  !supabaseUrl.includes('YOUR_PROJECT_ID') &&
  !supabaseAnonKey.includes('YOUR_ANON_KEY') &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20

if (!supabaseAnonKey) {
  console.error(
    '❌ VITE_SUPABASE_ANON_KEY (o equivalente) è vuota: le richieste andranno in errore "No API key found in request".'
  )
}

if (!isConfigValid) {
  console.error('❌ ERRORE CRITICO: Variabili d\'ambiente Supabase non configurate!')
  console.error('📝 Configura in Vercel/Netlify:')
  console.error('   1. VITE_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_URL')
  console.error('   2. VITE_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')
  console.error('📖 Vedi VERCEL_ENV_SETUP.md per le istruzioni complete')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

