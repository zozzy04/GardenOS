/**
 * Calcolo divisione millesimi e totali fattura (condiviso tra Invoice admin e Mio conto).
 * L'unica fonte delle famiglie è la tabella `famiglie` su Supabase: nessun valore
 * di riserva nel codice, così una fattura non può essere emessa su quote inventate.
 */

/**
 * @param {{ nome: string, millesimi: number, ordine?: number }[]} rows
 * @returns {{ nome: string, millesimi: number }[]} vuoto se non ci sono righe valide
 */
export function normalizeFamiglieRows(rows) {
  if (!rows || rows.length === 0) {
    return []
  }
  const sorted = [...rows].sort(
    (a, b) => (a.ordine ?? 0) - (b.ordine ?? 0) || a.nome.localeCompare(b.nome)
  )
  return sorted.map((r) => ({
    nome: r.nome,
    millesimi: typeof r.millesimi === 'string' ? parseFloat(r.millesimi) : Number(r.millesimi),
  }))
}

/**
 * @param {{ importo?: number, durata?: string|number }[]} worksList
 * @param {{ prezzo?: number }[]} speseList
 * @param {{ nome: string, millesimi: number }[]} famiglieOrdered
 * @param {{ start: string, end: string }} dateRange
 * @param {{ label: string, prezzo: number }[]} [extraVoci]
 */
export function buildInvoiceData(worksList, speseList, famiglieOrdered, dateRange, extraVoci = []) {
  const wl = worksList || []
  const sl = speseList || []
  const ev = extraVoci || []

  if (wl.length === 0 && sl.length === 0 && ev.length === 0) {
    return null
  }

  const totaleLavori = wl.reduce((sum, w) => sum + (w.importo || 0), 0)
  const totaleSpese = sl.reduce((sum, s) => sum + (s.prezzo || 0), 0)
  const totaleExtra = ev.reduce((sum, v) => sum + (v.prezzo || 0), 0)
  const totale = totaleLavori + totaleSpese + totaleExtra
  const totaleOre = wl.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0)

  const famiglie = normalizeFamiglieRows(famiglieOrdered)
  const totaleMillesimi = famiglie.reduce((sum, f) => sum + f.millesimi, 0)

  // Senza famiglie (o con millesimi a zero) la divisione non è calcolabile.
  // Meglio nessuna fattura che una fattura con quote sbagliate.
  if (totaleMillesimi <= 0) {
    return null
  }

  const divisioneMillesimi = {}

  const importiCalcolati = famiglie.map(({ nome, millesimi }) => {
    const percentuale = millesimi / totaleMillesimi
    const importoCalcolato = totale * percentuale
    return { famiglia: nome, millesimi, importoCalcolato }
  })

  const importiArrotondati = importiCalcolati.map((item) => ({
    ...item,
    importo: Math.round(item.importoCalcolato),
  }))

  const sommaArrotondata = importiArrotondati.reduce((sum, item) => sum + item.importo, 0)
  const differenza = Math.round(totale) - sommaArrotondata

  if (Math.abs(differenza) > 0) {
    const famigliaMax = importiArrotondati.reduce((max, item) =>
      item.importo > max.importo ? item : max
    )
    famigliaMax.importo = Math.round(famigliaMax.importo + differenza)
  }

  importiArrotondati.forEach((item) => {
    divisioneMillesimi[item.famiglia] = {
      millesimi: item.millesimi,
      importo: item.importo,
    }
  })

  return {
    totale,
    totaleLavori,
    totaleSpese,
    totaleExtra,
    totaleOre,
    numeroLavori: wl.length,
    numeroSpese: sl.length,
    extraVoci: ev,
    divisioneMillesimi,
    dateRange,
  }
}
