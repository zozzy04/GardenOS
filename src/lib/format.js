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
