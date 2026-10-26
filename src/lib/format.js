const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const euroConCentesimi = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/**
 * Importo in euro all'italiana: 1.240 €.
 * Le quote dei condòmini sono arrotondate all'unità (vedi buildInvoiceData),
 * quindi di default niente centesimi.
 *
 * @param {number | string | null | undefined} valore
 * @param {{ centesimi?: boolean }} [opts]
 */
export function formatEuro(valore, { centesimi = false } = {}) {
  const n = typeof valore === 'string' ? parseFloat(valore) : valore
  if (n == null || Number.isNaN(n)) return '—'
  return (centesimi ? euroConCentesimi : euro).format(n)
}

/**
 * Data da leggere, in formato italiano.
 *
 * Nell'app le date circolano sempre in ISO `yyyy-mm-dd`, come arrivano dal
 * database: sono giorni, non istanti, e si formattano solo qui, al momento
 * di disegnarle. Tollera anche `dd/mm/yyyy` perché gli snapshot delle fatture
 * già emesse contengono quel formato — sono record storici e non si
 * riscrivono.
 *
 * Non passa da `Date`: costruire una data da una stringa ISO la interpreta
 * come mezzanotte UTC, e in un fuso negativo il giorno mostrato slitta.
 *
 * @param {string | null | undefined} valore
 */
export function formatDataIt(valore) {
  if (!valore) return '—'
  const s = String(valore)
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : s
}

/**
 * Una `Date` come giorno ISO nel fuso locale.
 *
 * Sostituisce `toISOString().split('T')[0]`, che converte prima in UTC: a
 * mezzanotte passata, in Italia, restituisce il giorno precedente.
 *
 * @param {Date} [data]
 */
export function toIsoDate(data = new Date()) {
  const anno = data.getFullYear()
  const mese = String(data.getMonth() + 1).padStart(2, '0')
  const giorno = String(data.getDate()).padStart(2, '0')
  return `${anno}-${mese}-${giorno}`
}

/**
 * Giorno ISO come `Date` a mezzanotte **locale**.
 *
 * `new Date('2026-06-22')` sarebbe mezzanotte UTC, cioè le 02:00 in Italia:
 * confrontarla con una data costruita localmente dà risultati incoerenti.
 * Serve solo dove occorre aritmetica fra giorni (differenze, intervalli).
 *
 * @param {string} iso
 */
export function parseIsoDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''))
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}
