// Hook personalizzato per gestire Supabase
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

// Hook per l'autenticazione
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [passwordRecovery, setPasswordRecovery] = useState(false)

  useEffect(() => {
    // Controlla se c'è una sessione attiva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ascolta i cambiamenti di autenticazione
    /* Il link di recupero riporta nell'app con una sessione valida: senza
       intercettare PASSWORD_RECOVERY l'utente entrerebbe normalmente, senza
       mai poter cambiare la password. */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true)
      }
      /* USER_UPDATED arriva a tutte le istanze di useAuth: senza questo,
         l'istanza in App resterebbe in modo recupero anche dopo che il form
         ha cambiato la password, lasciando l'utente bloccato li'. */
      if (event === 'USER_UPDATED' || event === 'SIGNED_OUT') {
        setPasswordRecovery(false)
      }
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    const userMetadata = Object.fromEntries(
      Object.entries(metadata).filter(
        ([, v]) => v !== undefined && v !== null && v !== ''
      )
    )
    const req = {
      email: email.trim(),
      password,
    }
    if (Object.keys(userMetadata).length > 0) {
      req.options = { data: userMetadata }
    }
    const { data, error } = await supabase.auth.signUp(req)
    return { data, error }
  }

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  /* Manda la mail di recupero. Ritorna sempre senza distinguere fra indirizzo
     esistente e no: chi non ha un account non deve poterlo dedurre da qui. */
  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    })
    return { error }
  }

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password })
    if (!error) setPasswordRecovery(false)
    return { error }
  }

  return {
    user,
    loading,
    passwordRecovery,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  }
}

// Hook per i lavori
// skipUserFilter: per condomini approvati — RLS restituisce solo i lavori del gestore
export const useLavori = (userId, options = {}) => {
  const { skipUserFilter = false } = options
  const [lavori, setLavori] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadLavori()
  }, [userId, skipUserFilter])

  const loadLavori = async () => {
    try {
      setLoading(true)
      setError(null)
      let q = supabase.from('lavori').select('*').order('data', { ascending: false })
      if (!skipUserFilter) {
        q = q.eq('user_id', userId)
      }
      const { data, error: fetchError } = await q

      if (fetchError) throw fetchError
      
      // Converti i dati dal formato DB al formato app
      const formattedData = data.map(lavoro => ({
        id: lavoro.id,
        data: lavoro.data,
        tipi: lavoro.tipi || [],
        descrizione: lavoro.descrizione,
        durata: lavoro.durata.toString(),
        importo: parseFloat(lavoro.importo),
        note: lavoro.note || '',
        extraVoci: lavoro.extra_voci || [],
        fatturaId: lavoro.fattura_id ?? null,
      }))
      
      setLavori(formattedData)
    } catch (err) {
      console.error('Errore nel caricamento lavori:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createLavoro = async (lavoroData) => {
    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('lavori')
        .insert({
          user_id: userId,
          data: lavoroData.data,
          tipi: lavoroData.tipi,
          descrizione: lavoroData.descrizione,
          durata: parseFloat(lavoroData.durata),
          importo: parseFloat(lavoroData.importo),
          note: lavoroData.note || null,
          extra_voci: lavoroData.extraVoci || [],
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      await loadLavori() // Ricarica la lista
      return { data, error: null }
    } catch (err) {
      console.error('Errore nella creazione lavoro:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const updateLavoro = async (id, lavoroData) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from('lavori')
        .update({
          data: lavoroData.data,
          tipi: lavoroData.tipi,
          descrizione: lavoroData.descrizione,
          durata: parseFloat(lavoroData.durata),
          importo: parseFloat(lavoroData.importo),
          note: lavoroData.note || null,
          extra_voci: lavoroData.extraVoci || [],
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) throw updateError
      
      await loadLavori() // Ricarica la lista
      return { data, error: null }
    } catch (err) {
      console.error('Errore nell\'aggiornamento lavoro:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const deleteLavoro = async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from('lavori')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError
      
      await loadLavori() // Ricarica la lista
      return { error: null }
    } catch (err) {
      console.error('Errore nell\'eliminazione lavoro:', err)
      setError(err.message)
      return { error: err }
    }
  }

  return {
    lavori,
    loading,
    error,
    createLavoro,
    updateLavoro,
    deleteLavoro,
    refresh: loadLavori
  }
}

// Hook per le location meteo
export const useLocation = (userId) => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadLocation()
  }, [userId])

  const loadLocation = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', userId)
        .eq('is_default', true)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError // PGRST116 = no rows
      
      if (data) {
        setLocation({
          lat: data.lat.toString(),
          lon: data.lon.toString(),
          name: data.name
        })
      } else {
        setLocation(null)
      }
    } catch (err) {
      console.error('Errore nel caricamento location:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveLocation = async (locationData) => {
    try {
      setError(null)
      const { data, error: saveError } = await supabase
        .from('locations')
        .upsert({
          user_id: userId,
          lat: parseFloat(locationData.lat),
          lon: parseFloat(locationData.lon),
          name: locationData.name,
          is_default: true
        }, {
          onConflict: 'user_id,is_default'
        })
        .select()
        .single()

      if (saveError) throw saveError
      
      setLocation({
        lat: data.lat.toString(),
        lon: data.lon.toString(),
        name: data.name
      })
      
      return { data, error: null }
    } catch (err) {
      console.error('Errore nel salvataggio location:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  return {
    location,
    loading,
    error,
    saveLocation,
    refresh: loadLocation
  }
}

// Hook per le spese condominiali
export const useSpese = (userId, options = {}) => {
  const { skipUserFilter = false } = options
  const [spese, setSpese] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadSpese()
  }, [userId, skipUserFilter])

  const loadSpese = async () => {
    try {
      setLoading(true)
      setError(null)
      let q = supabase
        .from('spese_condominiali')
        .select('*')
        .order('data_acquisto', { ascending: false })
      if (!skipUserFilter) {
        q = q.eq('user_id', userId)
      }
      const { data, error: fetchError } = await q

      if (fetchError) throw fetchError
      
      // Converti i dati dal formato DB al formato app
      const formattedData = data.map(spesa => ({
        id: spesa.id,
        oggetto: spesa.oggetto,
        data_acquisto: spesa.data_acquisto,
        prezzo: parseFloat(spesa.prezzo),
        scontrinoPath: spesa.scontrino_path || null,
        fatturaId: spesa.fattura_id ?? null,
      }))
      
      setSpese(formattedData)
    } catch (err) {
      console.error('Errore nel caricamento spese:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createSpesa = async (spesaData) => {
    try {
      setError(null)
      const { data, error: insertError } = await supabase
        .from('spese_condominiali')
        .insert({
          user_id: userId,
          oggetto: spesaData.oggetto,
          data_acquisto: spesaData.data_acquisto,
          prezzo: parseFloat(spesaData.prezzo),
          scontrino_path: spesaData.scontrino_path || null
        })
        .select()
        .single()

      if (insertError) throw insertError
      
      await loadSpese() // Ricarica la lista
      return { data, error: null }
    } catch (err) {
      console.error('Errore nella creazione spesa:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const updateSpesa = async (id, spesaData) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from('spese_condominiali')
        .update({
          oggetto: spesaData.oggetto,
          data_acquisto: spesaData.data_acquisto,
          prezzo: parseFloat(spesaData.prezzo),
          scontrino_path: spesaData.scontrino_path || null
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) throw updateError
      
      await loadSpese() // Ricarica la lista
      return { data, error: null }
    } catch (err) {
      console.error('Errore nell\'aggiornamento spesa:', err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const deleteSpesa = async (id) => {
    try {
      setError(null)
      // Prima elimina il file scontrino se presente
      const spesa = spese.find(s => s.id === id)
      if (spesa && spesa.scontrinoPath) {
        try {
          await supabase.storage
            .from('scontrini')
            .remove([spesa.scontrinoPath])
        } catch (storageError) {
          console.warn('Errore nell\'eliminazione file scontrino:', storageError)
          // Continua comunque con l'eliminazione della spesa
        }
      }

      const { error: deleteError } = await supabase
        .from('spese_condominiali')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)

      if (deleteError) throw deleteError
      
      await loadSpese() // Ricarica la lista
      return { error: null }
    } catch (err) {
      console.error('Errore nell\'eliminazione spesa:', err)
      setError(err.message)
      return { error: err }
    }
  }

  const uploadScontrino = async (file) => {
    try {
      setError(null)
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('scontrini')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw uploadError

      /* Si salva il percorso dentro al bucket, non un URL: il bucket e'
         privato e ogni accesso passa da un link firmato a scadenza. */
      return { path: fileName, error: null }
    } catch (err) {
      console.error('Errore nell\'upload scontrino:', err)
      setError(err.message)
      return { path: null, error: err }
    }
  }

  /** Link temporaneo per aprire o incorporare uno scontrino. */
  const getScontrinoUrl = async (path, secondi = 300) => {
    if (!path) return null
    const { data, error: signError } = await supabase.storage
      .from('scontrini')
      .createSignedUrl(path, secondi)
    if (signError) {
      console.error('Errore nella firma URL scontrino:', signError)
      return null
    }
    return data?.signedUrl ?? null
  }

  return {
    spese,
    loading,
    error,
    createSpesa,
    updateSpesa,
    deleteSpesa,
    uploadScontrino,
    getScontrinoUrl,
    refresh: loadSpese
  }
}

// Hook per lo stato di pagamento delle quote.
// Non filtra per famiglia: ci pensa RLS — l'admin vede tutti i pagamenti,
// il condòmino solo quelli della propria famiglia.
export const usePagamenti = () => {
  const [pagamenti, setPagamenti] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadPagamenti()
  }, [])

  const loadPagamenti = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('pagamenti')
        .select('id, fattura_id, famiglia_id, saldata_il, importo')

      if (fetchError) throw fetchError
      setPagamenti(data || [])
    } catch (err) {
      console.error('Errore nel caricamento pagamenti:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    pagamenti,
    loading,
    error,
    refresh: loadPagamenti,
  }
}

// Hook per le fatture emesse
export const useFatture = () => {
  const [fatture, setFatture] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadFatture()
  }, [])

  const loadFatture = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('fatture')
        .select('*')
        .order('period_end', { ascending: false })
      if (fetchError) throw fetchError
      setFatture(data || [])
    } catch (err) {
      console.error('Errore nel caricamento fatture:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Emette la fattura e marca lavori e spese come fatturati, in un'unica
   * transazione lato database: se il client facesse le due cose in sequenza,
   * un errore nel mezzo lascerebbe righe rifatturabili.
   */
  const emettiFattura = async (fatturaData, lavoriIds = [], speseIds = []) => {
    try {
      setError(null)
      const { data, error: rpcError } = await supabase.rpc('emetti_fattura', {
        dati: fatturaData,
        lavori_ids: lavoriIds,
        spese_ids: speseIds,
      })
      if (rpcError) throw rpcError
      await loadFatture()
      return { data, error: null }
    } catch (err) {
      console.error("Errore nell'emissione fattura:", err)
      setError(err.message)
      return { data: null, error: err }
    }
  }

  const deleteFattura = async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from('fatture')
        .delete()
        .eq('id', id)
      if (deleteError) throw deleteError
      await loadFatture()
      return { error: null }
    } catch (err) {
      console.error("Errore nell'eliminazione fattura:", err)
      setError(err.message)
      return { error: err }
    }
  }

  const getLastFatturaPeriodEnd = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('fatture')
        .select('period_end')
        .order('period_end', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (fetchError) throw fetchError
      return data?.period_end || null
    } catch (err) {
      console.error("Errore nel recupero ultima fattura:", err)
      return null
    }
  }

  return {
    fatture,
    loading,
    error,
    emettiFattura,
    deleteFattura,
    getLastFatturaPeriodEnd,
    refresh: loadFatture,
  }
}

