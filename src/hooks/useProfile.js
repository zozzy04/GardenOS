import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

/** Messaggio chiaro se PostgREST risponde 404 (tabella assente). */
function profileFetchErrorMessage(fetchError) {
  if (!fetchError) return 'Errore sconosciuto'
  const msg = String(fetchError.message || '').toLowerCase()
  const code = String(fetchError.code || '')
  const missing =
    code === 'PGRST205' ||
    code === '42P01' ||
    msg.includes('could not find the table') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('schema cache') ||
    msg.includes('404')
  if (missing) {
    return 'Tabella `profiles` assente: esegui `supabase-condomini.sql` nel SQL Editor di Supabase (dopo `supabase-schema.sql`), poi verifica in Table Editor che esistano `profiles` e `famiglie`.'
  }
  if (/500|internal server error|infinite recursion/i.test(msg)) {
    return 'Errore server su `profiles` (spesso ricorsione RLS sulle policy). Esegui `supabase-condomini-patch-rls-500.sql` nel SQL Editor.'
  }
  return fetchError.message || 'Errore nel caricamento del profilo'
}

/** Profilo app + relazione famiglia (embed Supabase). */
export function useProfile(user) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!!user)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      setError(null)
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select(
          `
          user_id,
          role,
          famiglia_id,
          approval_status,
          display_name,
          famiglie ( id, nome, millesimi, ordine )
        `
        )
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (fetchError) {
        setError(profileFetchErrorMessage(fetchError))
        setProfile(null)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [user?.id])

  const famiglia =
    profile?.famiglie && !Array.isArray(profile.famiglie)
      ? profile.famiglie
      : Array.isArray(profile?.famiglie)
        ? profile.famiglie[0]
        : null

  return { profile, famiglia, loading, error }
}
