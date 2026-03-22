import { useState, useEffect } from 'react'
import { DownloadIcon, FileIcon, FileTextIcon, GaugeIcon } from 'lucide-react'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import { useSpese } from '../hooks/useSupabase'
import { supabase } from '../config/supabase'
import { buildInvoiceData, LEGACY_FAMIGLIE } from '@/lib/invoice-millesimi'
import { exportInvoiceToPdf, formatInvoiceDate } from '@/lib/invoice-pdf'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { toastError } from '@/lib/notify'
import { cn } from '@/lib/utils'

/** @param {{ highlightFamigliaNome?: string | null }} props */
const MioConto = ({ highlightFamigliaNome = null }) => {
  const { user } = useAuth()
  const { lavori } = useLavori(user?.id, { skipUserFilter: true })
  const { spese } = useSpese(user?.id, { skipUserFilter: true })
  const [famiglieRows, setFamiglieRows] = useState(LEGACY_FAMIGLIE)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredWorks, setFilteredWorks] = useState([])
  const [filteredSpese, setFilteredSpese] = useState([])
  const [invoiceData, setInvoiceData] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: e } = await supabase
        .from('famiglie')
        .select('id, nome, millesimi, ordine')
        .order('ordine', { ascending: true })
      if (cancelled || e || !data?.length) return
      setFamiglieRows(data)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (startDate && endDate && lavori && spese) {
      filterWorksByDate()
    }
  }, [startDate, endDate, lavori, spese, famiglieRows])

  const filterWorksByDate = () => {
    if (!startDate || !endDate || !lavori || !spese) return

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const filtered = lavori
      .filter((work) => {
        const workDate = new Date(work.data.split('/').reverse().join('-'))
        return workDate >= start && workDate <= end
      })
      .sort((a, b) => {
        const dateA = new Date(a.data.split('/').reverse().join('-'))
        const dateB = new Date(b.data.split('/').reverse().join('-'))
        return dateA - dateB
      })

    const filteredSpeseList = spese
      .filter((spesa) => {
        const spesaDate = new Date(spesa.data_acquisto.split('/').reverse().join('-'))
        return spesaDate >= start && spesaDate <= end
      })
      .sort((a, b) => {
        const dateA = new Date(a.data_acquisto.split('/').reverse().join('-'))
        const dateB = new Date(b.data_acquisto.split('/').reverse().join('-'))
        return dateA - dateB
      })

    setFilteredWorks(filtered)
    setFilteredSpese(filteredSpeseList)
    const built = buildInvoiceData(filtered, filteredSpeseList, famiglieRows, {
      start: startDate,
      end: endDate,
    })
    setInvoiceData(built)
  }

  const handleGenerate = () => {
    if (!startDate || !endDate) {
      toastError('Seleziona un periodo di tempo')
      return
    }
    filterWorksByDate()
  }

  const exportToPDF = () =>
    exportInvoiceToPdf({
      invoiceData,
      filteredWorks,
      filteredSpese,
      highlightFamigliaNome: highlightFamigliaNome || null,
      docTitle: 'IL MIO CONTO — GARDENOS',
      fileNamePrefix: 'mio-conto-giardino',
    })

  const miaQuota =
    highlightFamigliaNome && invoiceData?.divisioneMillesimi?.[highlightFamigliaNome]

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Il mio conto"
        description="Totale condominiale e quota della tua famiglia sul periodo scelto (sola lettura)."
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Periodo</CardTitle>
          <CardDescription>Data inizio e fine inclusiva</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="mc-start">Data inizio *</Label>
            <Input
              id="mc-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mc-end">Data fine *</Label>
            <Input
              id="mc-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} disabled={!startDate || !endDate}>
            <GaugeIcon />
            Calcola
          </Button>
        </CardContent>
      </Card>

      {invoiceData && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
            <Card>
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-medium text-muted-foreground">Periodo</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatInvoiceDate(invoiceData.dateRange.start)} –{' '}
                  {formatInvoiceDate(invoiceData.dateRange.end)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-medium text-muted-foreground">Lavori</p>
                <p className="font-sans mt-2 text-2xl font-bold">{invoiceData.numeroLavori}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-medium text-muted-foreground">Ore totali</p>
                <p className="font-sans mt-2 text-2xl font-bold">
                  {invoiceData.totaleOre.toFixed(1)}h
                </p>
              </CardContent>
            </Card>
            {invoiceData.numeroSpese > 0 && (
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-muted-foreground">Spese condominiali</p>
                  <p className="mt-2 text-sm font-semibold">
                    {invoiceData.numeroSpese} ({invoiceData.totaleSpese.toFixed(2)} €)
                  </p>
                </CardContent>
              </Card>
            )}
            <Card className="border-primary/30 bg-primary/5 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-medium text-primary">Totale condominiale</p>
                <p className="font-sans mt-2 text-2xl font-bold text-primary">
                  {invoiceData.totale.toFixed(2)} €
                </p>
              </CardContent>
            </Card>
            {miaQuota && (
              <Card className="border-emerald-500/40 bg-emerald-500/5 sm:col-span-2 lg:col-span-1">
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    La tua quota ({highlightFamigliaNome})
                  </p>
                  <p className="font-sans mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                    {miaQuota.importo.toFixed(0)} €
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Millesimi: {miaQuota.millesimi.toFixed(3).replace('.', ',')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {filteredWorks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dettaglio lavori</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredWorks.map((work) => (
                  <div
                    key={work.id}
                    className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{work.data}</span>
                      {work.usaPrezzoPersonalizzato && (
                        <Badge variant="outline" className="font-medium">
                          Prezzo personalizzato
                        </Badge>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(Array.isArray(work.tipi)
                        ? work.tipi
                        : work.tipo
                          ? [work.tipo]
                          : []
                      ).map((tipo, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tipo}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-sm">{work.descrizione}</p>
                    <div className="mt-2 flex justify-between text-sm text-muted-foreground">
                      <span>Ore: {work.durata || '0'}</span>
                      <span className="font-semibold text-foreground">
                        {work.importo ? `${work.importo.toFixed(2)} €` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {filteredSpese.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Spese condominiali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredSpese.map((spesa) => (
                  <div
                    key={spesa.id}
                    className="rounded-xl border border-border bg-muted/40 p-4 sm:p-5"
                  >
                    <div className="text-sm font-semibold">{spesa.data_acquisto}</div>
                    <p className="mt-1">{spesa.oggetto}</p>
                    <p className="mt-2 font-semibold text-primary">
                      {spesa.prezzo ? `${spesa.prezzo.toFixed(2)} €` : '-'}
                    </p>
                    {spesa.scontrino_url && (
                      <a
                        href={spesa.scontrino_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-sm text-primary underline underline-offset-2"
                      >
                        <FileIcon className="size-4" />
                        Visualizza scontrino
                      </a>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Divisione per millesimi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 max-w-[calc(100vw-2rem)] overflow-x-auto px-2 sm:mx-0 sm:max-w-none sm:overflow-visible sm:px-0 md:max-w-none">
                <Table className="min-w-[400px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-4 font-semibold">Famiglia</TableHead>
                    <TableHead className="font-semibold">Millesimi</TableHead>
                    <TableHead className="pr-4 text-right font-semibold">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(invoiceData.divisioneMillesimi).map(([famiglia, data]) => {
                    const isMine = highlightFamigliaNome && famiglia === highlightFamigliaNome
                    return (
                      <TableRow
                        key={famiglia}
                        className={cn(
                          isMine && 'bg-amber-100/90 font-medium dark:bg-amber-950/50'
                        )}
                      >
                        <TableCell className="whitespace-normal pl-4">
                          {famiglia}
                          {isMine ? (
                            <Badge variant="secondary" className="ml-2 align-middle">
                              La tua famiglia
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {data.millesimi.toFixed(3).replace('.', ',')}
                        </TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">
                          {data.importo.toFixed(0)} €
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-semibold hover:bg-muted/50">
                    <TableCell className="pl-4">Totale</TableCell>
                    <TableCell>1000,000</TableCell>
                    <TableCell className="pr-4 text-right tabular-nums">
                      {Math.round(invoiceData.totale).toFixed(0)} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Button onClick={exportToPDF} size="lg" className="w-full sm:w-auto">
            <DownloadIcon />
            Scarica PDF
          </Button>
        </>
      )}

      {!invoiceData && startDate && endDate && filteredWorks.length === 0 && filteredSpese.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <FileTextIcon className="size-12 opacity-50" />
            <p>Nessun lavoro o spesa nel periodo selezionato</p>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}

export default MioConto
