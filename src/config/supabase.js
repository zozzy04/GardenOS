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
  
  // Esponi una funzione per verificare la configurazione
  window.__SUPABASE_CONFIG_ERROR__ = {
    supabaseUrl: supabaseUrl,
    supabaseAnonKey: supabaseAnonKey.substring(0, 20) + '...',
    message: 'Variabili d\'ambiente Supabase non configurate correttamente'
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Helper functions per i dati

// Lavori
export const lavoriService = {
  // Ottieni tutti i lavori dell'utente corrente
  async getAll(userId) {
    const { data, error } = await supabase
      .from('lavori')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Ottieni un lavoro specifico
  async getById(id, userId) {
    const { data, error } = await supabase
      .from('lavori')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Crea un nuovo lavoro
  async create(lavoro, userId) {
    const { data, error } = await supabase
      .from('lavori')
      .insert({
        user_id: userId,
        data: lavoro.data,
        tipi: lavoro.tipi,
        descrizione: lavoro.descrizione,
        durata: parseFloat(lavoro.durata),
        importo: parseFloat(lavoro.importo),
        note: lavoro.note || null,
        usa_prezzo_personalizzato: lavoro.usaPrezzoPersonalizzato || false,
        prezzo_personalizzato: lavoro.prezzoPersonalizzato || null
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Aggiorna un lavoro
  async update(id, lavoro, userId) {
    const { data, error } = await supabase
      .from('lavori')
      .update({
        data: lavoro.data,
        tipi: lavoro.tipi,
        descrizione: lavoro.descrizione,
        durata: parseFloat(lavoro.durata),
        importo: parseFloat(lavoro.importo),
        note: lavoro.note || null,
        usa_prezzo_personalizzato: lavoro.usaPrezzoPersonalizzato || false,
        prezzo_personalizzato: lavoro.prezzoPersonalizzato || null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Elimina un lavoro
  async delete(id, userId) {
    const { error } = await supabase
      .from('lavori')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Filtra lavori per data
  async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('lavori')
      .select('*')
      .eq('user_id', userId)
      .gte('data', startDate)
      .lte('data', endDate)
      .order('data', { ascending: false })
    
    if (error) throw error
    return data
  }
}

// Locations
export const locationsService = {
  // Ottieni tutte le location dell'utente
  async getAll(userId) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Ottieni la location di default
  async getDefault(userId) {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows returned
    return data
  },

  // Crea o aggiorna una location
  async upsert(location, userId) {
    // Se è default, rimuovi il default dalle altre
    if (location.is_default) {
      await supabase
        .from('locations')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
    }

    const { data, error } = await supabase
      .from('locations')
      .upsert({
        user_id: userId,
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        name: location.name,
        is_default: location.is_default || false
      }, {
        onConflict: 'user_id,is_default',
        ignoreDuplicates: false
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Elimina una location
  async delete(id, userId) {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  }
}

// Spese Condominiali
export const speseService = {
  // Ottieni tutte le spese dell'utente corrente
  async getAll(userId) {
    const { data, error } = await supabase
      .from('spese_condominiali')
      .select('*')
      .eq('user_id', userId)
      .order('data_acquisto', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Ottieni una spesa specifica
  async getById(id, userId) {
    const { data, error } = await supabase
      .from('spese_condominiali')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // Crea una nuova spesa
  async create(spesa, userId) {
    const { data, error } = await supabase
      .from('spese_condominiali')
      .insert({
        user_id: userId,
        oggetto: spesa.oggetto,
        data_acquisto: spesa.data_acquisto,
        prezzo: parseFloat(spesa.prezzo),
        scontrino_url: spesa.scontrino_url || null
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Aggiorna una spesa
  async update(id, spesa, userId) {
    const { data, error } = await supabase
      .from('spese_condominiali')
      .update({
        oggetto: spesa.oggetto,
        data_acquisto: spesa.data_acquisto,
        prezzo: parseFloat(spesa.prezzo),
        scontrino_url: spesa.scontrino_url || null
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Elimina una spesa
  async delete(id, userId) {
    const { error } = await supabase
      .from('spese_condominiali')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    
    if (error) throw error
  },

  // Filtra spese per data
  async getByDateRange(userId, startDate, endDate) {
    const { data, error } = await supabase
      .from('spese_condominiali')
      .select('*')
      .eq('user_id', userId)
      .gte('data_acquisto', startDate)
      .lte('data_acquisto', endDate)
      .order('data_acquisto', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Upload file scontrino
  async uploadScontrino(userId, file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`
    
    const { error } = await supabase.storage
      .from('scontrini')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    
    // Ottieni l'URL pubblico
    const { data: urlData } = supabase.storage
      .from('scontrini')
      .getPublicUrl(fileName)
    
    return urlData.publicUrl
  },

  // Elimina file scontrino
  async deleteScontrino(fileUrl) {
    // Estrai il path dal URL
    const urlParts = fileUrl.split('/')
    const fileName = urlParts.slice(-2).join('/') // userId/filename
    
    const { error } = await supabase.storage
      .from('scontrini')
      .remove([fileName])
    
    if (error) throw error
  }
}

