import { useState } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  DownloadIcon,
  FileTextIcon,
  Loader2Icon,
  WalletIcon,
} from 'lucide-react'
import { useFatture } from '../hooks/useSupabase'
import { exportInvoiceToPdf, formatInvoiceDate } from '@/lib/invoice-pdf'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** @param {{ highlightFamigliaNome?: string | null }} props */
const MioConto = ({ highlightFamigliaNome = null }) => {
  const { fatture, loading } = useFatture()
  const [expandedId, setExpandedId] = useState(null)

  const getMiaQuota = (fattura) => {
    if (!highlightFamigliaNome) return null
    const dm = fattura.divisione_millesimi || {}
    return dm[highlightFamigliaNome] || null
  }

  const handleDownloadPdf = (fattura) => {
    const invoiceData = {
      totale: parseFloat(fattura.totale),
      totaleLavori: parseFloat(fattura.totale_lavori),
      totaleSpese: parseFloat(fattura.totale_spese),
      totaleExtra: parseFloat(fattura.totale_extra),
      totaleOre: parseFloat(fattura.totale_ore),
      numeroLavori: fattura.numero_lavori,
      numeroSpese: (fattura.spese_snapshot || []).length,
      extraVoci: fattura.extra_voci || [],
      divisioneMillesimi: fattura.divisione_millesimi || {},
      dateRange: { start: fattura.period_start, end: fattura.period_end },
    }
    exportInvoiceToPdf({
      invoiceData,
      filteredWorks: fattura.lavori_snapshot || [],
      filteredSpese: fattura.spese_snapshot || [],
      extraVoci: fattura.extra_voci || [],
      highlightFamigliaNome,
      isCondominoView: true,
      docTitle: 'IL MIO CONTO — GARDENOS',
      fileNamePrefix: 'mio-conto-giardino',
    })
  }

  // Stats condomino: totale pagato + numero fatture
  const totaleQuota = highlightFamigliaNome
    ? fatture.reduce((sum, f) => {
        const q = (f.divisione_millesimi || {})[highlightFamigliaNome]
        return sum + (q ? q.importo : 0)
      }, 0)
    : 0

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Il mio conto"
        description="Fatture emesse dall'amministratore per il condominio (sola lettura)."
        icon={<FileTextIcon className="size-7 text-primary" />}
      />

      {!highlightFamigliaNome && (
        <Card className="border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/40">
          <CardContent className="py-3 text-sm text-amber-900 dark:text-amber-100">
            Nessuna famiglia associata al profilo. Contatta il gestore per collegare i millesimi
            corretti.
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Caricamento fatture...
        </div>
      )}

      {!loading && fatture.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
            <WalletIcon className="size-12 opacity-50" />
            <p className="font-medium text-foreground">Nessuna fattura disponibile</p>
            <p className="text-sm">
              L&apos;amministratore non ha ancora emesso fatture.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dashboard condomino — stats riepilogative */}
      {!loading && fatture.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {highlightFamigliaNome ? (
            <Card className="border-primary/25 bg-primary/5">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-primary">Totale pagato</p>
                <p className="mt-1.5 font-sans text-2xl font-bold text-primary">
                  {totaleQuota.toFixed(0)} €
                </p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">da inizio gestione</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">Totale condominio</p>
                <p className="mt-1.5 font-sans text-2xl font-bold">
                  {fatture.reduce((s, f) => s + parseFloat(f.totale), 0).toFixed(0)} €
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Fatture ricevute</p>
              <p className="mt-1.5 font-sans text-2xl font-bold">{fatture.length}</p>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Ultima fattura</p>
              <p className="mt-1.5 text-sm font-semibold">
                {formatInvoiceDate(fatture[0]?.period_end || '')}
              </p>
              {highlightFamigliaNome && fatture[0] && (
                <p className="mt-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  Tua quota: {((fatture[0].divisione_millesimi || {})[highlightFamigliaNome]?.importo ?? 0).toFixed(0)} €
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && fatture.length > 0 && (
        <div className="space-y-3">
          {fatture.map((fattura) => {
            const miaQuota = getMiaQuota(fattura)
            const isExpanded = expandedId === fattura.id
            const lavori = fattura.lavori_snapshot || []
            const spese = fattura.spese_snapshot || []
            const extra = fattura.extra_voci || []
            const dm = fattura.divisione_millesimi || {}

            return (
              <Card key={fattura.id} className={cn(isExpanded && 'ring-1 ring-primary/30')}>
                {/* Riga riassuntiva con gerarchia chiara */}
                <CardContent className="p-4 sm:p-5">
                  {/* Prima riga: periodo + meta */}
                  <div className="mb-3 min-w-0">
                    <p className="text-base font-semibold leading-tight">
                      {formatInvoiceDate(fattura.period_start)} –{' '}
                      {formatInvoiceDate(fattura.period_end)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {fattura.numero_lavori}{' '}
                      {fattura.numero_lavori === 1 ? 'lavoro' : 'lavori'} · Emessa il{' '}
                      {new Date(fattura.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  {/* Seconda riga: quota + azioni */}
                  <div className="flex flex-wrap items-center gap-2">
                    {miaQuota ? (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                        La tua quota: {miaQuota.importo.toFixed(0)} €
                      </span>
                    ) : (
                      <span className="text-sm font-semibold">
                        {parseFloat(fattura.totale).toFixed(2)} €
                      </span>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(fattura)}>
                      <DownloadIcon className="size-4" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant={isExpanded ? 'secondary' : 'outline'}
                      onClick={() => setExpandedId(isExpanded ? null : fattura.id)}
                      aria-label={isExpanded ? 'Chiudi dettaglio' : 'Vedi dettaglio'}
                    >
                      {isExpanded ? (
                        <><ChevronUpIcon className="size-4" /> Chiudi</>
                      ) : (
                        <><ChevronDownIcon className="size-4" /> Dettaglio</>
                      )}
                    </Button>
                  </div>
                </CardContent>

                {/* Dettaglio espanso */}
                {isExpanded && (
                  <div className="space-y-5 border-t border-border px-4 pb-5 pt-4 sm:px-5">
                    {/* Mini-cards riepilogo */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Lavori</p>
                        <p className="mt-1 font-sans text-xl font-bold">{fattura.numero_lavori}</p>
                      </div>
                      <div className="rounded-lg bg-muted/50 p-3">
                        <p className="text-xs text-muted-foreground">Ore</p>
                        <p className="mt-1 font-sans text-xl font-bold">
                          {parseFloat(fattura.totale_ore).toFixed(1)}h
                        </p>
                      </div>
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                        <p className="text-xs font-medium text-primary">Totale condominio</p>
                        <p className="mt-1 font-sans text-xl font-bold text-primary">
                          {parseFloat(fattura.totale).toFixed(2)} €
                        </p>
                      </div>
                      {miaQuota && (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                            La tua quota
                          </p>
                          <p className="mt-1 font-sans text-xl font-bold text-emerald-700 dark:text-emerald-400">
                            {miaQuota.importo.toFixed(0)} €
                          </p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            Mill. {miaQuota.millesimi.toFixed(3).replace('.', ',')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Lista lavori — nessun prezzo */}
                    {lavori.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">Lavori</h4>
                        <div className="space-y-2">
                          {lavori.map((work, idx) => (
                            <div
                              key={idx}
                              className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4"
                            >
                              <p className="text-xs font-semibold text-muted-foreground">
                                {work.data}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {(Array.isArray(work.tipi)
                                  ? work.tipi
                                  : work.tipo
                                    ? [work.tipo]
                                    : []
                                ).map((t, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                              <p className="mt-1 text-sm">{work.descrizione}</p>
                              <p className="mt-1 text-xs text-muted-foreground">
                                Ore: {work.durata || '0'}
                              </p>
                              {(work.extra_voci || []).length > 0 && (
                                <div className="mt-2 space-y-0.5 border-t border-border/40 pt-2">
                                  {(work.extra_voci || []).map((v, vi) => (
                                    <div key={vi} className="flex justify-between text-xs text-muted-foreground">
                                      <span>{v.label}</span>
                                      <span>{parseFloat(v.prezzo || 0).toFixed(2)} €</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lista spese */}
                    {spese.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">Spese condominiali</h4>
                        <div className="space-y-2">
                          {spese.map((spesa, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                            >
                              <div>
                                <p className="text-sm">{spesa.oggetto}</p>
                                <p className="text-xs text-muted-foreground">
                                  {spesa.data_acquisto}
                                </p>
                              </div>
                              <span className="text-sm font-semibold">
                                {parseFloat(spesa.prezzo).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Costi extra */}
                    {extra.length > 0 && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">Costi extra</h4>
                        <div className="space-y-2">
                          {extra.map((v, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3"
                            >
                              <span className="text-sm">{v.label}</span>
                              <span className="text-sm font-semibold">
                                {parseFloat(v.prezzo).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tabella millesimi */}
                    {Object.keys(dm).length > 0 && (
                      <div>
                        <h4 className="mb-3 text-sm font-semibold">Divisione per millesimi</h4>
                        <div className="-mx-0 max-w-[calc(100vw-3rem)] overflow-x-auto sm:max-w-none">
                          <Table className="w-full min-w-[340px]">
                            <TableHeader>
                              <TableRow className="bg-muted/50 hover:bg-muted/50">
                                <TableHead className="pl-3 font-semibold">Famiglia</TableHead>
                                <TableHead className="font-semibold">Millesimi</TableHead>
                                <TableHead className="pr-3 text-right font-semibold">
                                  Importo
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {Object.entries(dm).map(([famiglia, data]) => {
                                const isMine =
                                  highlightFamigliaNome && famiglia === highlightFamigliaNome
                                return (
                                  <TableRow
                                    key={famiglia}
                                    className={cn(
                                      isMine &&
                                        'bg-amber-100/90 font-medium dark:bg-amber-950/50'
                                    )}
                                  >
                                    <TableCell className="whitespace-normal pl-3">
                                      {famiglia}
                                      {isMine ? (
                                        <Badge
                                          variant="secondary"
                                          className="ml-2 align-middle"
                                        >
                                          La tua famiglia
                                        </Badge>
                                      ) : null}
                                    </TableCell>
                                    <TableCell className="tabular-nums">
                                      {data.millesimi.toFixed(3).replace('.', ',')}
                                    </TableCell>
                                    <TableCell className="pr-3 text-right tabular-nums">
                                      {data.importo.toFixed(0)} €
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                              <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
                                <TableCell className="pl-3">Totale</TableCell>
                                <TableCell>1000,000</TableCell>
                                <TableCell className="pr-3 text-right tabular-nums">
                                  {Math.round(parseFloat(fattura.totale)).toFixed(0)} €
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => handleDownloadPdf(fattura)}
                      className="w-full sm:w-auto"
                    >
                      <DownloadIcon />
                      Scarica PDF
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </PageContainer>
  )
}

export default MioConto
