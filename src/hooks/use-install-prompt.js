import { useCallback, useSyncExternalStore } from 'react'

/** L'app gira già installata (standalone), non dentro il browser. */
function giaInstallata() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS non supporta display-mode: standalone, usa questa proprietà
    window.navigator.standalone === true
  )
}

/* Stato a livello di modulo, non dentro il componente: Chrome emette
   `beforeinstallprompt` una volta sola e poco dopo l'avvio, mentre la pagina
   della guida è caricata pigramente. Un listener montato insieme a lei
   arriverebbe sempre a evento già passato. */
let stato = { evento: null, installata: giaInstallata() }
const sottoscrittori = new Set()

function aggiorna(modifiche) {
  stato = { ...stato, ...modifiche }
  for (const notifica of sottoscrittori) notifica()
}

const sottoscrivi = (notifica) => {
  sottoscrittori.add(notifica)
  return () => sottoscrittori.delete(notifica)
}

/** Da chiamare una volta all'avvio dell'app, prima che l'evento arrivi. */
export function ascoltaInstallPrompt() {
  if (typeof window === 'undefined') return

  window.addEventListener('beforeinstallprompt', (e) => {
    // Senza preventDefault Chrome mostra la propria barra di installazione
    e.preventDefault()
    aggiorna({ evento: e })
  })

  window.addEventListener('appinstalled', () => {
    aggiorna({ evento: null, installata: true })
  })
}

/**
 * Espone il prompt di installazione nativo dove il browser lo offre.
 *
 * Safari non implementa `beforeinstallprompt`: su iPhone restano le
 * istruzioni manuali, non esiste alternativa programmatica.
 */
export function useInstallPrompt() {
  const { evento, installata } = useSyncExternalStore(
    sottoscrivi,
    () => stato,
    () => stato
  )

  const installa = useCallback(async () => {
    if (!evento) return null
    evento.prompt()
    const { outcome } = await evento.userChoice
    // Il prompt è usa e getta: dopo la scelta l'evento non vale più
    aggiorna({ evento: null })
    return outcome
  }, [evento])

  return { puoInstallare: evento !== null, installata, installa }
}

/** iPadOS si presenta come Mac: lo si distingue dai punti di tocco. */
export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}
