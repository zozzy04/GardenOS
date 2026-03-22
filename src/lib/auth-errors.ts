/** Messaggi in italiano per errori Auth Supabase (signup/login). */
export function describeSignUpError(err: {
  message?: string
  status?: number
  code?: string
}): string {
  const raw = err.message || ''
  const msg = raw.toLowerCase()
  const code = (err.code || '').toLowerCase()

  /* 422 da GoTrue: spesso errore DB sul trigger profilo, NON solo email duplicata */
  if (
    msg.includes('database error saving new user') ||
    msg.includes('error saving user') ||
    msg.includes('unexpected_failure')
  ) {
    return 'La registrazione è stata rifiutata dal database (di solito il trigger su `profiles` / `famiglia_id`). Esegui in Supabase SQL Editor lo script `supabase-fix-signup-422-trigger.sql` incluso nel repo, oppure controlla i log (Database → Logs) e che la famiglia scelta esista in `famiglie`.'
  }

  if (
    msg.includes('already been registered') ||
    msg.includes('user already registered') ||
    msg.includes('already registered') ||
    msg.includes('email address is already') ||
    code === 'user_already_exists'
  ) {
    return 'Questa email è già registrata. Usa «Torna al login» per accedere. Se non ricordi la password, reimpostala da Supabase (Authentication → Users) o abilita il recupero email.'
  }

  if (
    msg.includes('password') &&
    (msg.includes('least') || msg.includes('short') || msg.includes('weak') || msg.includes('characters'))
  ) {
    return 'La password non rispetta i requisiti del progetto (lunghezza o complessità). Controlla Authentication → Providers → Email nel dashboard Supabase.'
  }

  if (msg.includes('invalid') && msg.includes('email')) {
    return 'Indirizzo email non valido.'
  }

  if (code === 'signup_disabled' || msg.includes('signups not allowed')) {
    return 'Le nuove registrazioni sono disabilitate per questo progetto Supabase.'
  }

  if (raw) {
    return raw
  }

  if (err.status === 422) {
    return 'Richiesta non accettata (422). Se non è un problema di email già usata, controlla trigger `handle_new_user_profile` e tabella `profiles` su Supabase, oppure applica `supabase-fix-signup-422-trigger.sql`.'
  }

  return 'Registrazione non riuscita. Riprova o verifica la configurazione Auth su Supabase.'
}
