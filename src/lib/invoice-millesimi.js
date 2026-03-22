/**
 * Calcolo divisione millesimi e totali fattura (condiviso tra Invoice admin e Mio conto).
 * Stessi valori legacy di Invoice.jsx prima della migrazione su tabella `famiglie`.
 */

export const LEGACY_FAMIGLIE = [
  { nome: 'Artico Eros - Salotto Desirè', millesimi: 201.055, ordine: 1 },
  { nome: 'Zozzolotto Gianni - Pasquali Paola', millesimi: 304.419, ordine: 2 },
  { nome: 'Uvai Chiara', millesimi: 290.081, ordine: 3 },
  { nome: 'Pavan Stefano - Tumiotto Eleonora', millesimi: 204.445, ordine: 4 },
]

/**
 * @param {{ nome: string, millesimi: number, ordine?: number }[]} rows
 * @returns {{ nome: string, millesimi: number }[]}
 */
export function normalizeFamiglieRows(rows) {
  if (!rows || rows.length === 0) {
    return LEGACY_FAMIGLIE.map(({ nome, millesimi }) => ({ nome, millesimi }))
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
 */
export function buildInvoiceData(worksList, speseList, famiglieOrdered, dateRange) {
  const wl = worksList || []
  const sl = speseList || []

  if (wl.length === 0 && sl.length === 0) {
    return null
  }

  const totaleLavori = wl.reduce((sum, w) => sum + (w.importo || 0), 0)
  const totaleSpese = sl.reduce((sum, s) => sum + (s.prezzo || 0), 0)
  const totale = totaleLavori + totaleSpese
  const totaleOre = wl.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0)

  const famiglie = normalizeFamiglieRows(famiglieOrdered)
  const divisioneMillesimi = {}
  const totaleMillesimi = famiglie.reduce((sum, f) => sum + f.millesimi, 0)

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
    totaleOre,
    numeroLavori: wl.length,
    numeroSpese: sl.length,
    divisioneMillesimi,
    dateRange,
  }
}
