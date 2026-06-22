import { useState } from 'react'
import {
  AlertCircleIcon,
  ClipboardListIcon,
  DownloadIcon,
  FileTextIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
  Loader2Icon,
} from 'lucide-react'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { PageContainer, PageHeader, PageToolbar } from '@/components/page-layout'
import { ConfirmActionDialog } from '@/components/confirm-action-dialog'
import { toastError, toastSuccess } from '@/lib/notify'

const TARIFFE = {
  'Taglio erba': 15,
  'Taglio siepe': 20,
  'Raccolta foglie': 15,
}

const EXTRA_CATEGORIE = [
  'Diserbante',
  'Materiale necessario',
  'Sacchi',
  'Filo per decespugliatore',
  'Benzina',
]

const emptyExtraVoce = () => ({ label: '', labelCustom: '', prezzo: '' })

const WorkLog = () => {
  const { user } = useAuth()
  const { lavori, loading, error, createLavoro, updateLavoro, deleteLavoro } = useLavori(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipi: [],
    descrizione: '',
    durata: '0.5',
    note: '',
  })
  const [extraVoci, setExtraVoci] = useState([])
  const [filterType, setFilterType] = useState('tutti')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const works = lavori || []

  const calculateImporto = (tipi, durata) => {
    if (!tipi || tipi.length === 0 || !durata) return 0
    const tariffe = tipi.map((tipo) => TARIFFE[tipo] || 0).filter((t) => t > 0)
    if (tariffe.length === 0) return 0
    const tariffaMedia = tariffe.reduce((sum, t) => sum + t, 0) / tariffe.length
    return (parseFloat(durata) * tariffaMedia).toFixed(2)
  }

  const handleTipoToggle = (tipo) => {
    const currentTipi = formData.tipi || []
    if (currentTipi.includes(tipo)) {
      setFormData({ ...formData, tipi: currentTipi.filter((t) => t !== tipo) })
    } else {
      setFormData({ ...formData, tipi: [...currentTipi, tipo] })
    }
  }

  const handleAddExtra = () => setExtraVoci((v) => [...v, emptyExtraVoce()])
  const handleRemoveExtra = (idx) => setExtraVoci((v) => v.filter((_, i) => i !== idx))
  const handleExtraChange = (idx, field, value) =>
    setExtraVoci((v) => v.map((item, i) => (i === idx ? { ...item, [field]: value } : item)))

  const getValidExtraVoci = () =>
    extraVoci
      .filter((v) => v.prezzo && parseFloat(v.prezzo) > 0 && (v.label || v.labelCustom))
      .map((v) => ({
        label: v.label === 'Personalizzato' ? v.labelCustom : v.label,
        prezzo: parseFloat(v.prezzo),
      }))

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split('T')[0],
      tipi: [],
      descrizione: '',
      durata: '0.5',
      note: '',
    })
    setExtraVoci([])
    setEditingId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.tipi || formData.tipi.length === 0) {
      toastError('Seleziona almeno una categoria di lavoro')
      return
    }
    if (!formData.durata || parseFloat(formData.durata) <= 0) {
      toastError('Inserisci un numero di ore valido')
      return
    }

    setSubmitting(true)
    const importo = calculateImporto(formData.tipi, formData.durata)

    const workData = {
      data: new Date(formData.data).toLocaleDateString('it-IT'),
      tipi: formData.tipi,
      descrizione: formData.descrizione,
      durata: formData.durata,
      importo: parseFloat(importo),
      note: formData.note || '',
      extraVoci: getValidExtraVoci(),
    }

    try {
      if (editingId) {
        const result = await updateLavoro(editingId, workData)
        if (result.error) {
          toastError("Errore durante l'aggiornamento: " + result.error.message)
          setSubmitting(false)
          return
        }
        toastSuccess('Lavoro aggiornato')
      } else {
        const result = await createLavoro(workData)
        if (result.error) {
          toastError('Errore durante la creazione: ' + result.error.message)
          setSubmitting(false)
          return
        }
        toastSuccess('Lavoro aggiunto')
      }
      resetForm()
    } catch (err) {
      toastError('Si è verificato un errore. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (work) => {
    const tipi = Array.isArray(work.tipi) ? work.tipi : work.tipo ? [work.tipo] : []
    const dataParts = work.data.split('/')
    const dataISO = dataParts.length === 3
      ? `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`
      : new Date().toISOString().split('T')[0]

    setFormData({
      data: dataISO,
      tipi,
      descrizione: work.descrizione,
      durata: work.durata || '0.5',
      note: work.note || '',
    })
    // Ricostruisce extraVoci con la struttura del form
    setExtraVoci(
      (work.extraVoci || []).map((v) => ({
        label: EXTRA_CATEGORIE.includes(v.label) ? v.label : 'Personalizzato',
        labelCustom: EXTRA_CATEGORIE.includes(v.label) ? '' : v.label,
        prezzo: v.prezzo?.toString() || '',
      }))
    )
    setEditingId(work.id)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('work-log-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const filteredWorks = filterType === 'tutti'
    ? works
    : works.filter((work) => {
        const workTipi = Array.isArray(work.tipi) ? work.tipi : work.tipo ? [work.tipo] : []
        return workTipi.includes(filterType)
      })

  const allTipi = works.flatMap((w) => {
    if (Array.isArray(w.tipi)) return w.tipi
    if (w.tipo) return [w.tipo]
    return []
  })
  const workTypes = ['tutti', ...new Set(allTipi.filter(Boolean))]

  const exportToCSV = () => {
    const headers = ['Data', 'Tipi', 'Descrizione', 'Ore Lavoro', 'Importo (€)', 'Costi Extra (€)', 'Note']
    const rows = works.map((w) => {
      const tipi = Array.isArray(w.tipi) ? w.tipi.join(' + ') : w.tipo || ''
      const extraTot = (w.extraVoci || []).reduce((s, v) => s + (v.prezzo || 0), 0)
      return [w.data, tipi, w.descrizione, w.durata || '0', w.importo ? `${w.importo.toFixed(2)}` : '0', extraTot.toFixed(2), w.note || '']
    })
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `gardenos-lavori-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const totaleImporto = works.reduce((sum, w) => sum + (w.importo || 0), 0)
  const totaleOre = works.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0)

  return (
    <PageContainer>
      <PageToolbar>
        <PageHeader
          title="Registro lavori"
          description="Registra e gestisci le attività svolte"
          icon={<ClipboardListIcon className="size-6 text-primary" />}
        />
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <Button
            variant={showForm ? 'secondary' : 'default'}
            size="sm"
            onClick={() => {
              if (showForm) { resetForm() } else { setShowForm(true) }
            }}
          >
            {showForm ? <><XIcon /> Chiudi</> : <><PlusIcon /> Nuovo lavoro</>}
          </Button>
          {works.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <DownloadIcon /> CSV
            </Button>
          )}
        </div>
      </PageToolbar>

      {showForm && (
        <Card id="work-log-form" className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="font-heading text-lg">{editingId ? 'Modifica lavoro' : 'Nuovo lavoro'}</CardTitle>
            <CardDescription>Compila i campi obbligatori</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                    className="h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Categorie *</Label>
                  <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(TARIFFE).map((tipo) => (
                      <label
                        key={tipo}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-input bg-background p-3 text-sm transition-colors hover:bg-accent/50"
                      >
                        <Checkbox
                          checked={(formData.tipi || []).includes(tipo)}
                          onCheckedChange={() => handleTipoToggle(tipo)}
                        />
                        <span>{tipo} ({TARIFFE[tipo]}€/ora)</span>
                      </label>
                    ))}
                  </div>
                  {(formData.tipi || []).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Tariffa media:{' '}
                      <strong className="text-foreground">
                        {((formData.tipi || []).reduce((sum, t) => sum + (TARIFFE[t] || 0), 0) / (formData.tipi || []).length).toFixed(2)}€/ora
                      </strong>
                    </p>
                  )}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Descrizione *</Label>
                  <Input
                    value={formData.descrizione}
                    onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                    placeholder="Es: Potatura rosmarino..."
                    required
                    className="h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ore *</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={formData.durata}
                      onValueChange={(v) => setFormData({ ...formData, durata: v })}
                    >
                      <SelectTrigger className="h-11 w-full sm:h-10 sm:w-[180px]">
                        <SelectValue placeholder="Durata" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 20 }, (_, i) => {
                          const value = (i + 1) * 0.5
                          const v = value.toString()
                          return (
                            <SelectItem key={v} value={v}>
                              {value} {value === 1 ? 'ora' : 'ore'}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {(formData.tipi || []).length > 0 && (
                      <div className="text-sm font-medium text-primary">
                        Totale lavoro: {calculateImporto(formData.tipi, formData.durata)} €
                      </div>
                    )}
                  </div>
                </div>

                {/* Costi extra per questo lavoro */}
                <div className="space-y-3 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Costi extra</Label>
                      <p className="mt-0.5 text-xs text-muted-foreground">Materiali o spese specifiche di questo lavoro</p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddExtra}>
                      <PlusIcon /> Aggiungi
                    </Button>
                  </div>
                  {extraVoci.length > 0 && (
                    <div className="space-y-2.5">
                      {extraVoci.map((voce, idx) => (
                        <div key={idx} className="flex flex-wrap items-end gap-2.5 rounded-lg border border-border/60 bg-muted/30 p-3">
                          <div className="min-w-[140px] flex-1 space-y-1.5">
                            <Label className="text-xs">Categoria</Label>
                            <Select
                              value={voce.label}
                              onValueChange={(v) => handleExtraChange(idx, 'label', v)}
                            >
                              <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="Seleziona..." />
                              </SelectTrigger>
                              <SelectContent>
                                {EXTRA_CATEGORIE.map((cat) => (
                                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                                <SelectItem value="Personalizzato">Personalizzato...</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {voce.label === 'Personalizzato' && (
                            <div className="min-w-[120px] flex-1 space-y-1.5">
                              <Label className="text-xs">Descrizione</Label>
                              <Input
                                placeholder="Es. Fertilizzante"
                                value={voce.labelCustom}
                                onChange={(e) => handleExtraChange(idx, 'labelCustom', e.target.value)}
                                className="h-10"
                              />
                            </div>
                          )}
                          <div className="w-24 space-y-1.5">
                            <Label className="text-xs">€</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={voce.prezzo}
                              onChange={(e) => handleExtraChange(idx, 'prezzo', e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveExtra(idx)}
                            aria-label="Rimuovi voce"
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Note</Label>
                  <Textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Note aggiuntive..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <><Loader2Icon className="size-4 animate-spin" /> Caricamento...</>
                  ) : editingId ? 'Salva modifiche' : 'Aggiungi lavoro'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {works.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label className="shrink-0 text-sm">Filtra</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-10 w-full sm:w-[240px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              {workTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type === 'tutti' ? 'Tutti i lavori' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && works.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <p className="text-sm">Caricamento lavori...</p>
        </div>
      )}

      <Card className="overflow-hidden border-border/60">
        <CardContent className="p-0">
          {!loading && filteredWorks.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-16 text-center text-muted-foreground">
              <FileTextIcon className="size-10 opacity-40" />
              <p className="font-heading font-medium text-foreground">Nessun lavoro registrato</p>
              <p className="text-sm">Inizia aggiungendo il tuo primo lavoro.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4 font-semibold">Descrizione</TableHead>
                    <TableHead className="font-semibold">Data</TableHead>
                    <TableHead className="font-semibold">Ore</TableHead>
                    <TableHead className="text-right font-semibold">Importo</TableHead>
                    <TableHead className="pr-4 text-right font-semibold">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorks.map((work) => {
                    const extraTot = (work.extraVoci || []).reduce((s, v) => s + (v.prezzo || 0), 0)
                    return (
                      <TableRow key={work.id}>
                        <TableCell className="max-w-[220px] whitespace-normal align-top pl-4">
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(work.tipi) ? work.tipi : work.tipo ? [work.tipo] : []).map((tipo, idx) => (
                              <Badge key={idx} variant="secondary" className="text-[11px]">{tipo}</Badge>
                            ))}
                          </div>
                          <p className="mt-1 text-sm text-foreground">{work.descrizione}</p>
                          {(work.extraVoci || []).length > 0 && (
                            <div className="mt-1.5 space-y-0.5">
                              {(work.extraVoci || []).map((v, i) => (
                                <p key={i} className="text-[11px] text-muted-foreground">
                                  + {v.label} {v.prezzo?.toFixed(2)} €
                                </p>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap text-sm">{work.data}</TableCell>
                        <TableCell className="align-top text-sm">{work.durata || '0'}</TableCell>
                        <TableCell className="align-top text-right text-sm tabular-nums">
                          <div className="flex flex-col items-end">
                            <span>{work.importo ? `${work.importo.toFixed(2)} €` : '-'}</span>
                            {extraTot > 0 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{extraTot.toFixed(2)} € extra
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right pr-4">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="outline" size="icon-sm" onClick={() => handleEdit(work)} title="Modifica">
                              <PencilIcon />
                            </Button>
                            <Button type="button" variant="destructive" size="icon-sm" onClick={() => setDeleteTargetId(work.id)} title="Elimina">
                              <Trash2Icon />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {works.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="font-heading text-xl font-bold sm:text-2xl">{works.length}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Lavori totali</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="font-heading text-xl font-bold sm:text-2xl">{totaleOre.toFixed(1)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Ore totali</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4 text-center">
              <p className="font-heading text-xl font-bold sm:text-2xl">{new Set(works.map((w) => w.data)).size}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Giorni lavorati</p>
            </CardContent>
          </Card>
          <Card className="border-primary/25 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="font-heading text-xl font-bold text-primary sm:text-2xl">{totaleImporto.toFixed(2)} €</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Importo totale</p>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
        title="Eliminare questo lavoro?"
        description="L'operazione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={async () => {
          if (deleteTargetId == null) return false
          const result = await deleteLavoro(deleteTargetId)
          if (result.error) {
            toastError("Errore durante l'eliminazione: " + result.error.message)
            return false
          }
          toastSuccess('Lavoro eliminato')
          return true
        }}
      />
    </PageContainer>
  )
}

export default WorkLog
