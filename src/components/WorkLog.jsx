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
import { Loader2Icon } from 'lucide-react'

const TARIFFE = {
  'Taglio erba': 15,
  'Taglio siepe': 20,
  'Raccolta foglie': 15,
}

const WorkLog = () => {
  const { user } = useAuth()
  const { lavori, loading, error, createLavoro, updateLavoro, deleteLavoro } = useLavori(
    user?.id
  )
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipi: [],
    descrizione: '',
    durata: '0.5',
    note: '',
    prezzoPersonalizzato: '',
    usaPrezzoPersonalizzato: false,
  })
  const [filterType, setFilterType] = useState('tutti')
  const [submitting, setSubmitting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const works = lavori || []

  const calculateImporto = (
    tipi,
    durata,
    prezzoPersonalizzato = '',
    usaPrezzoPersonalizzato = false
  ) => {
    if (usaPrezzoPersonalizzato && prezzoPersonalizzato) {
      return parseFloat(prezzoPersonalizzato).toFixed(2)
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.usaPrezzoPersonalizzato && (!formData.tipi || formData.tipi.length === 0)) {
      toastError('Seleziona almeno una categoria di lavoro oppure usa un prezzo personalizzato')
      return
    }
    if (
      formData.usaPrezzoPersonalizzato &&
      (!formData.prezzoPersonalizzato || parseFloat(formData.prezzoPersonalizzato) <= 0)
    ) {
      toastError('Inserisci un prezzo personalizzato valido')
      return
    }
    if (!formData.durata || parseFloat(formData.durata) <= 0) {
      toastError('Inserisci un numero di ore valido')
      return
    }

    setSubmitting(true)
    const importo = calculateImporto(
      formData.tipi,
      formData.durata,
      formData.prezzoPersonalizzato,
      formData.usaPrezzoPersonalizzato
    )

    const workData = {
      data: new Date(formData.data).toLocaleDateString('it-IT'),
      tipi: formData.tipi,
      descrizione: formData.descrizione,
      durata: formData.durata,
      importo: parseFloat(importo),
      note: formData.note || '',
      usaPrezzoPersonalizzato: formData.usaPrezzoPersonalizzato,
      prezzoPersonalizzato: formData.usaPrezzoPersonalizzato ? formData.prezzoPersonalizzato : '',
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

      setFormData({
        data: new Date().toISOString().split('T')[0],
        tipi: [],
        descrizione: '',
        durata: '0.5',
        note: '',
        prezzoPersonalizzato: '',
        usaPrezzoPersonalizzato: false,
      })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Errore:', err)
      toastError('Si è verificato un errore. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (work) => {
    const tipi = Array.isArray(work.tipi) ? work.tipi : work.tipo ? [work.tipo] : []
    const dataParts = work.data.split('/')
    const dataISO =
      dataParts.length === 3
        ? `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`
        : new Date().toISOString().split('T')[0]

    setFormData({
      data: dataISO,
      tipi: tipi,
      descrizione: work.descrizione,
      durata: work.durata || '0.5',
      note: work.note || '',
      prezzoPersonalizzato: work.prezzoPersonalizzato || '',
      usaPrezzoPersonalizzato: work.usaPrezzoPersonalizzato || false,
    })
    setEditingId(work.id)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('work-log-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const filteredWorks =
    filterType === 'tutti'
      ? works
      : works.filter((work) => {
          const workTipi = Array.isArray(work.tipi)
            ? work.tipi
            : work.tipo
              ? [work.tipo]
              : []
          return workTipi.includes(filterType)
        })

  const allTipi = works.flatMap((w) => {
    if (Array.isArray(w.tipi)) return w.tipi
    if (w.tipo) return [w.tipo]
    return []
  })
  const workTypes = ['tutti', ...new Set(allTipi.filter(Boolean))]

  const exportToCSV = () => {
    const headers = ['Data', 'Tipi', 'Descrizione', 'Ore Lavoro', 'Importo (€)', 'Note']
    const rows = works.map((w) => {
      const tipi = Array.isArray(w.tipi) ? w.tipi.join(' + ') : w.tipo || ''
      return [
        w.data,
        tipi,
        w.descrizione,
        w.durata || '0',
        w.importo ? `${w.importo.toFixed(2)}` : '0',
        w.note || '',
      ]
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
          title="Registro lavori giardino"
          description="Registra e filtra le attività svolte"
          icon={<ClipboardListIcon className="size-7 text-primary" />}
        />
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button
            variant={showForm ? 'secondary' : 'default'}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <XIcon />
                Chiudi
              </>
            ) : (
              <>
                <PlusIcon />
                Nuovo lavoro
              </>
            )}
          </Button>
          {works.length > 0 && (
            <Button variant="outline" onClick={exportToCSV}>
              <DownloadIcon />
              Esporta CSV
            </Button>
          )}
        </div>
      </PageToolbar>

      {showForm && (
        <Card id="work-log-form">
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica lavoro' : 'Nuovo lavoro'}</CardTitle>
            <CardDescription>Compila i campi obbligatori</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Categorie di lavoro * (multipla)</Label>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.keys(TARIFFE).map((tipo) => (
                      <label
                        key={tipo}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-input bg-background p-3 text-sm"
                      >
                        <Checkbox
                          checked={(formData.tipi || []).includes(tipo)}
                          onCheckedChange={() => handleTipoToggle(tipo)}
                        />
                        <span>
                          {tipo} ({TARIFFE[tipo]}€/ora)
                        </span>
                      </label>
                    ))}
                  </div>
                  {(formData.tipi || []).length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Tariffa media:{' '}
                      <strong className="text-foreground">
                        {(
                          (formData.tipi || []).reduce((sum, t) => sum + (TARIFFE[t] || 0), 0) /
                          (formData.tipi || []).length
                        ).toFixed(2)}
                        €/ora
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ore lavoro *</Label>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={formData.durata}
                      onValueChange={(v) => setFormData({ ...formData, durata: v })}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
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
                    <div className="text-sm font-medium text-primary">
                      {!formData.usaPrezzoPersonalizzato && (formData.tipi || []).length > 0 && (
                        <span>Totale: {calculateImporto(formData.tipi, formData.durata)} €</span>
                      )}
                      {formData.usaPrezzoPersonalizzato && formData.prezzoPersonalizzato && (
                        <span>
                          Totale: {parseFloat(formData.prezzoPersonalizzato).toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                    <Checkbox
                      checked={formData.usaPrezzoPersonalizzato}
                      onCheckedChange={(checked) =>
                        setFormData({
                          ...formData,
                          usaPrezzoPersonalizzato: !!checked,
                          prezzoPersonalizzato: checked ? formData.prezzoPersonalizzato : '',
                        })
                      }
                    />
                    Usa prezzo personalizzato
                  </label>
                  {formData.usaPrezzoPersonalizzato && (
                    <div className="mt-2 space-y-2">
                      <Label>Prezzo personalizzato (€) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.prezzoPersonalizzato}
                        onChange={(e) =>
                          setFormData({ ...formData, prezzoPersonalizzato: e.target.value })
                        }
                        placeholder="0.00"
                        required={formData.usaPrezzoPersonalizzato}
                      />
                      <p className="text-xs text-muted-foreground">
                        Il prezzo personalizzato sostituisce il calcolo automatico
                      </p>
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
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      Caricamento...
                    </>
                  ) : editingId ? (
                    'Salva modifiche'
                  ) : (
                    'Aggiungi lavoro'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData({
                      data: new Date().toISOString().split('T')[0],
                      tipi: [],
                      descrizione: '',
                      durata: '0.5',
                      note: '',
                      prezzoPersonalizzato: '',
                      usaPrezzoPersonalizzato: false,
                    })
                  }}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {works.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Label className="shrink-0">Filtra per tipo</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[min(100%,280px)]">
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
          <Loader2Icon className="size-10 animate-spin text-primary" />
          <p>Caricamento lavori...</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {!loading && filteredWorks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <FileTextIcon className="size-12 opacity-50" />
              <p className="font-medium text-foreground">Nessun lavoro registrato</p>
              <p className="text-sm">Inizia aggiungendo il tuo primo lavoro.</p>
            </div>
          ) : (
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4 font-semibold">Descrizione</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Ore</TableHead>
                  <TableHead className="text-right font-semibold">Importo</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWorks.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell className="max-w-[240px] whitespace-normal align-top pl-4">
                      <div className="flex flex-wrap gap-1">
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
                      <p className="mt-1 text-foreground">{work.descrizione}</p>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap">{work.data}</TableCell>
                    <TableCell className="align-top">{work.durata || '0'}</TableCell>
                    <TableCell className="align-top text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1">
                        {work.importo ? `${work.importo.toFixed(2)} €` : '-'}
                        {work.usaPrezzoPersonalizzato && (
                          <Badge
                            variant="outline"
                            className="h-5 px-1 text-[10px]"
                            title="Prezzo personalizzato"
                          >
                            ★
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="align-top text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleEdit(work)}
                          title="Modifica"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                            onClick={() => setDeleteTargetId(work.id)}
                          title="Elimina"
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {works.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-sans text-2xl font-bold">{works.length}</p>
              <p className="text-xs text-muted-foreground">Lavori totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-sans text-2xl font-bold">{totaleOre.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Ore totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-sans text-2xl font-bold">
                {new Set(works.map((w) => w.data)).size}
              </p>
              <p className="text-xs text-muted-foreground">Giorni lavorati</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="font-sans text-2xl font-bold text-primary">
                {totaleImporto.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">Importo totale</p>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Eliminare questo lavoro?"
        description="L’operazione non può essere annullata."
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
