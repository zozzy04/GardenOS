import { useState, useEffect } from 'react'
import {
  DownloadIcon,
  FileTextIcon,
  GaugeIcon,
  Loader2Icon,
  PlusIcon,
  ReceiptIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useSupabase'
import { useLavori, useSpese, useFatture } from '../hooks/useSupabase'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { toastError, toastSuccess } from '@/lib/notify'

// Aggiungi nuove categorie qui — compaiono automaticamente nel select
const EXTRA_CATEGORIE = [
  'Diserbante',
  'Materiale necessario',
  'Sacchi',
  'Filo per decespugliatore',
  'Benzina',
]

const emptyVoce = () => ({ label: '', labelCustom: '', prezzo: '' })

const Invoice = () => {
  const { user } = useAuth()
  const { lavori } = useLavori(user?.id)
  const { spese } = useSpese(user?.id)
  const { fatture, createFattura, deleteFattura, getLastFatturaPeriodEnd } = useFatture()
  const [famiglieRows, setFamiglieRows] = useState(LEGACY_FAMIGLIE)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredWorks, setFilteredWorks] = useState([])
  const [filteredSpese, setFilteredSpese] = useState([])
  const [invoiceData, setInvoiceData] = useState(null)
  const [extraVoci, setExtraVoci] = useState([])
  const [emitting, setEmitting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

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
    return () => { cancelled = true }
  }, [])

  // Auto-calcola il periodo dalla ultima fattura emessa
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const lastEnd = await getLastFatturaPeriodEnd()
      if (cancelled) return
      const today = new Date().toISOString().split('T')[0]
      setEndDate(today)
      if (lastEnd) {
        const next = new Date(lastEnd)
        next.setDate(next.getDate() + 1)
        setStartDate(next.toISOString().split('T')[0])
      }
    })()
    return () => { cancelled = true }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (startDate && endDate && lavori && spese) {
      computeInvoice()
    }
  }, [startDate, endDate, lavori, spese, famiglieRows, extraVoci]) // eslint-disable-line react-hooks/exhaustive-deps

  const computeInvoice = () => {
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

    const built = buildInvoiceData(
      filtered,
      filteredSpeseList,
      famiglieRows,
      { start: startDate, end: endDate },
      getValidExtraVoci()
    )
    setInvoiceData(built)
  }

  const getValidExtraVoci = () =>
    extraVoci
      .filter((v) => v.prezzo && parseFloat(v.prezzo) > 0 && (v.label || v.labelCustom))
      .map((v) => ({
        label: v.label === 'Personalizzato' ? v.labelCustom : v.label,
        prezzo: parseFloat(v.prezzo),
      }))

  const handleGenerateInvoice = () => {
    if (!startDate || !endDate) {
      toastError('Seleziona un periodo di tempo')
      return
    }
    computeInvoice()
  }

  const handleEmetti = async () => {
    if (!invoiceData) {
      toastError('Genera prima la fattura')
      return
    }
    setEmitting(true)
    try {
      const validExtra = getValidExtraVoci()
      const { error } = await createFattura({
        period_start: startDate,
        period_end: endDate,
        totale_lavori: invoiceData.totaleLavori,
        totale_spese: invoiceData.totaleSpese,
        totale_extra: invoiceData.totaleExtra,
        totale: invoiceData.totale,
        totale_ore: invoiceData.totaleOre,
        numero_lavori: invoiceData.numeroLavori,
        extra_voci: validExtra,
        divisione_millesimi: invoiceData.divisioneMillesimi,
        lavori_snapshot: filteredWorks.map((w) => ({
          data: w.data,
          tipi: w.tipi,
          descrizione: w.descrizione,
          durata: w.durata,
          importo: w.importo,
          usaPrezzoPersonalizzato: w.usaPrezzoPersonalizzato,
          note: w.note,
        })),
        spese_snapshot: filteredSpese.map((s) => ({
          oggetto: s.oggetto,
          data_acquisto: s.data_acquisto,
          prezzo: s.prezzo,
        })),
        created_by: user.id,
      })
      if (error) {
        toastError('Errore nel salvataggio: ' + error.message)
        return
      }
      await exportInvoiceToPdf({
        invoiceData,
        filteredWorks,
        filteredSpese,
        extraVoci: validExtra,
      })
      toastSuccess('Fattura emessa e visibile ai condomini')
    } finally {
      setEmitting(false)
    }
  }

  const exportToPDF = () =>
    exportInvoiceToPdf({
      invoiceData,
      filteredWorks,
      filteredSpese,
      extraVoci: getValidExtraVoci(),
    })

  const handleAddVoce = () => setExtraVoci((v) => [...v, emptyVoce()])
  const handleRemoveVoce = (idx) => setExtraVoci((v) => v.filter((_, i) => i !== idx))
  const handleVoceChange = (idx, field, value) =>
    setExtraVoci((v) => v.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))

  return (
    <PageContainer className="max-w-5xl">
      <PageHeader
        title="Genera fattura"
        description="Seleziona il periodo, aggiungi costi extra e poi emetti"
        icon={<FileTextIcon className="size-7 text-primary" />}
      />

      {/* Periodo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Periodo</CardTitle>
          <CardDescription>
            Auto-calcolato dall&apos;ultima fattura emessa — modificabile manualmente
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-end sm:gap-6">
          <div className="space-y-2">
            <Label htmlFor="inv-start">Data inizio *</Label>
            <Input
              id="inv-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-end">Data fine *</Label>
            <Input
              id="inv-end"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateInvoice} disabled={!startDate || !endDate}>
            <GaugeIcon />
            Genera
          </Button>
        </CardContent>
      </Card>

      {/* Costi extra */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Costi extra</CardTitle>
            <CardDescription>
              Voci aggiuntive non registrate nelle spese — incluse nel totale e divise per millesimi
            </CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={handleAddVoce} className="shrink-0">
            <PlusIcon />
            Aggiungi
          </Button>
        </CardHeader>
        <CardContent>
          {extraVoci.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nessun costo extra. Clicca &ldquo;Aggiungi&rdquo; per inserirne uno.
            </p>
          ) : (
            <div className="space-y-3">
              {extraVoci.map((voce, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[180px] flex-1 space-y-1.5">
                    <Label>Categoria</Label>
                    <Select
                      value={voce.label}
                      onValueChange={(v) => handleVoceChange(idx, 'label', v)}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Seleziona..." />
                      </SelectTrigger>
                      <SelectContent>
                        {EXTRA_CATEGORIE.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        <SelectItem value="Personalizzato">Personalizzato...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {voce.label === 'Personalizzato' && (
                    <div className="min-w-[150px] flex-1 space-y-1.5">
                      <Label>Descrizione</Label>
                      <Input
                        placeholder="Es. Fertilizzante"
                        value={voce.labelCustom}
                        onChange={(e) => handleVoceChange(idx, 'labelCustom', e.target.value)}
                      />
                    </div>
                  )}
                  <div className="w-28 space-y-1.5">
                    <Label>Prezzo (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={voce.prezzo}
                      onChange={(e) => handleVoceChange(idx, 'prezzo', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveVoce(idx)}
                    aria-label="Rimuovi voce"
                  >
                    <XIcon className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {invoiceData && (
        <>
          {/* Summary cards */}
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
            {invoiceData.totaleExtra > 0 && (
              <Card>
                <CardContent className="p-5 sm:p-6">
                  <p className="text-xs font-medium text-muted-foreground">Costi extra</p>
                  <p className="mt-2 text-sm font-semibold">{invoiceData.totaleExtra.toFixed(2)} €</p>
                </CardContent>
              </Card>
            )}
            <Card className="border-primary/30 bg-primary/5 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-5 sm:p-6">
                <p className="text-xs font-medium text-primary">Totale fattura</p>
                <p className="font-sans mt-2 text-2xl font-bold text-primary">
                  {invoiceData.totale.toFixed(2)} €
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Dettaglio lavori */}
          {filteredWorks.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Dettaglio lavori</CardTitle>
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

          {/* Spese condominiali */}
          {filteredSpese.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Spese condominiali</CardTitle>
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
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Costi extra preview */}
          {invoiceData.extraVoci?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Costi extra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {invoiceData.extraVoci.map((voce, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4"
                  >
                    <span className="text-sm font-medium">{voce.label}</span>
                    <span className="font-semibold text-primary">{voce.prezzo.toFixed(2)} €</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Millesimi */}
          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-lg">Divisione per millesimi</CardTitle>
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
                    {Object.entries(invoiceData.divisioneMillesimi).map(([famiglia, data]) => (
                      <TableRow key={famiglia}>
                        <TableCell className="whitespace-normal pl-4">{famiglia}</TableCell>
                        <TableCell className="tabular-nums">
                          {data.millesimi.toFixed(3).replace('.', ',')}
                        </TableCell>
                        <TableCell className="pr-4 text-right tabular-nums">
                          {data.importo.toFixed(0)} €
                        </TableCell>
                      </TableRow>
                    ))}
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

          {/* Azioni */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleEmetti}
              size="lg"
              disabled={emitting}
              className="flex-1 sm:flex-none"
            >
              {emitting ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <ReceiptIcon />
              )}
              {emitting ? 'Emissione in corso...' : 'Emetti fattura'}
            </Button>
            <Button
              onClick={exportToPDF}
              size="lg"
              variant="outline"
              className="flex-1 sm:flex-none"
            >
              <DownloadIcon />
              Solo PDF
            </Button>
          </div>
        </>
      )}

      {!invoiceData &&
        startDate &&
        endDate &&
        filteredWorks.length === 0 &&
        filteredSpese.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <FileTextIcon className="size-12 opacity-50" />
              <p>Nessun lavoro o spesa nel periodo selezionato</p>
            </CardContent>
          </Card>
        )}

      {/* Storico fatture emesse */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fatture emesse</CardTitle>
          <CardDescription>Storico fatture salvate — visibili ai condomini</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {fatture.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
              <ReceiptIcon className="size-10 opacity-50" />
              <p className="text-sm">Nessuna fattura emessa</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[480px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="pl-4 font-semibold">Periodo</TableHead>
                    <TableHead className="font-semibold">Totale</TableHead>
                    <TableHead className="font-semibold">Emessa il</TableHead>
                    <TableHead className="pr-4 text-right font-semibold">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fatture.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="whitespace-nowrap pl-4">
                        {formatInvoiceDate(f.period_start)} – {formatInvoiceDate(f.period_end)}
                      </TableCell>
                      <TableCell className="tabular-nums font-medium">
                        {parseFloat(f.totale).toFixed(2)} €
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(f.created_at).toLocaleDateString('it-IT')}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setDeleteTargetId(f.id)}
                          title="Elimina fattura"
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Eliminare questa fattura?"
        description="La fattura verrà rimossa dal sistema. I condomini non la vedranno più. L'operazione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={async () => {
          if (deleteTargetId == null) return false
          const result = await deleteFattura(deleteTargetId)
          if (result.error) {
            toastError("Errore durante l'eliminazione: " + result.error.message)
            return false
          }
          toastSuccess('Fattura eliminata')
          return true
        }}
      />
    </PageContainer>
  )
}

export default Invoice
