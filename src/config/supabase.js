// Configurazione Supabase
// IMPORTANTE: Sostituisci queste credenziali con quelle del tuo progetto Supabase
// Le trovi in: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api

import { createClient } from '@supabase/supabase-js'

// URL del progetto Supabase
// Sostituisci YOUR_PROJECT_ID con l'ID del tuo progetto Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co'

// Anon/Public Key - Usa la variabile d'ambiente VITE_SUPABASE_ANON_KEY oppure inserisci direttamente la key qui
// IMPORTANTE: Per l'app React usa sempre la anon key, NON la connection string PostgreSQL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY_HERE'

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

