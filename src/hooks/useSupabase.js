// Hook personalizzato per gestire Supabase
import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

// Hook per l'autenticazione
export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Controlla se c'è una sessione attiva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ascolta i cambiamenti di autenticazione
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Puoi passare username, nome, ecc.
      }
    })
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

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }
}

// Hook per i lavori
export const useLavori = (userId) => {
  const [lavori, setLavori] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadLavori()
  }, [userId])

  const loadLavori = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('lavori')
        .select('*')
        .eq('user_id', userId)
        .order('data', { ascending: false })

      if (fetchError) throw fetchError
      
      // Converti i dati dal formato DB al formato app
      const formattedData = data.map(lavoro => ({
        id: lavoro.id,
        data: new Date(lavoro.data).toLocaleDateString('it-IT'),
        tipi: lavoro.tipi || [],
        descrizione: lavoro.descrizione,
        durata: lavoro.durata.toString(),
        importo: parseFloat(lavoro.importo),
        note: lavoro.note || '',
        usaPrezzoPersonalizzato: lavoro.usa_prezzo_personalizzato || false,
        prezzoPersonalizzato: lavoro.prezzo_personalizzato ? lavoro.prezzo_personalizzato.toString() : ''
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
      // Converti data da formato italiano a ISO
      const dataParts = lavoroData.data.split('/')
      const dataISO = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`

      const { data, error: insertError } = await supabase
        .from('lavori')
        .insert({
          user_id: userId,
          data: dataISO,
          tipi: lavoroData.tipi,
          descrizione: lavoroData.descrizione,
          durata: parseFloat(lavoroData.durata),
          importo: parseFloat(lavoroData.importo),
          note: lavoroData.note || null,
          usa_prezzo_personalizzato: lavoroData.usaPrezzoPersonalizzato || false,
          prezzo_personalizzato: lavoroData.prezzoPersonalizzato ? parseFloat(lavoroData.prezzoPersonalizzato) : null
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
      // Converti data da formato italiano a ISO
      const dataParts = lavoroData.data.split('/')
      const dataISO = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`

      const { data, error: updateError } = await supabase
        .from('lavori')
        .update({
          data: dataISO,
          tipi: lavoroData.tipi,
          descrizione: lavoroData.descrizione,
          durata: parseFloat(lavoroData.durata),
          importo: parseFloat(lavoroData.importo),
          note: lavoroData.note || null,
          usa_prezzo_personalizzato: lavoroData.usaPrezzoPersonalizzato || false,
          prezzo_personalizzato: lavoroData.prezzoPersonalizzato ? parseFloat(lavoroData.prezzoPersonalizzato) : null
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
export const useSpese = (userId) => {
  const [spese, setSpese] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadSpese()
  }, [userId])

  const loadSpese = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('spese_condominiali')
        .select('*')
        .eq('user_id', userId)
        .order('data_acquisto', { ascending: false })

      if (fetchError) throw fetchError
      
      // Converti i dati dal formato DB al formato app
      const formattedData = data.map(spesa => ({
        id: spesa.id,
        oggetto: spesa.oggetto,
        data_acquisto: new Date(spesa.data_acquisto).toLocaleDateString('it-IT'),
        prezzo: parseFloat(spesa.prezzo),
        scontrino_url: spesa.scontrino_url || null
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
      // Converti data da formato italiano a ISO
      const dataParts = spesaData.data_acquisto.split('/')
      const dataISO = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`

      const { data, error: insertError } = await supabase
        .from('spese_condominiali')
        .insert({
          user_id: userId,
          oggetto: spesaData.oggetto,
          data_acquisto: dataISO,
          prezzo: parseFloat(spesaData.prezzo),
          scontrino_url: spesaData.scontrino_url || null
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
      // Converti data da formato italiano a ISO
      const dataParts = spesaData.data_acquisto.split('/')
      const dataISO = `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`

      const { data, error: updateError } = await supabase
        .from('spese_condominiali')
        .update({
          oggetto: spesaData.oggetto,
          data_acquisto: dataISO,
          prezzo: parseFloat(spesaData.prezzo),
          scontrino_url: spesaData.scontrino_url || null
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
      if (spesa && spesa.scontrino_url) {
        try {
          const urlParts = spesa.scontrino_url.split('/')
          const fileName = urlParts.slice(-2).join('/')
          await supabase.storage
            .from('scontrini')
            .remove([fileName])
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
      
      const { data, error: uploadError } = await supabase.storage
        .from('scontrini')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw uploadError
      
      // Ottieni l'URL pubblico
      const { data: urlData } = supabase.storage
        .from('scontrini')
        .getPublicUrl(fileName)
      
      return { url: urlData.publicUrl, error: null }
    } catch (err) {
      console.error('Errore nell\'upload scontrino:', err)
      setError(err.message)
      return { url: null, error: err }
    }
  }

  return {
    spese,
    loading,
    error,
    createSpesa,
    updateSpesa,
    deleteSpesa,
    uploadScontrino,
    refresh: loadSpese
  }
}

