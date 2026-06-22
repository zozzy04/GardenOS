import { useState, useRef } from 'react'
import {
  AlertCircleIcon,
  FileIcon,
  PencilIcon,
  PlusIcon,
  ShoppingCartIcon,
  Trash2Icon,
  UploadIcon,
  XIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useSupabase'
import { useSpese } from '../hooks/useSupabase'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2Icon } from 'lucide-react'
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

// Aggiungi nuove categorie qui
const SPESE_CATEGORIE = [
  'Diserbante',
  'Materiale necessario',
  'Sacchi',
  'Filo per decespugliatore',
  'Benzina',
]

const emptyForm = () => ({
  oggettoCategoria: '',
  oggettoCustom: '',
  data_acquisto: new Date().toISOString().split('T')[0],
  prezzo: '',
  scontrino_file: null,
  scontrino_url: null,
  scontrino_preview: null,
})

const SpeseCondominiali = () => {
  const { user } = useAuth()
  const { spese, loading, error, createSpesa, updateSpesa, deleteSpesa, uploadScontrino } =
    useSpese(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      toastError('Formato file non supportato. Usa JPG, PNG, WEBP o PDF.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toastError('File troppo grande. Dimensione massima: 10MB.')
      return
    }

    setFormData({
      ...formData,
      scontrino_file: file,
      scontrino_preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const oggettoFinal =
      formData.oggettoCategoria === 'Personalizzato'
        ? formData.oggettoCustom.trim()
        : formData.oggettoCategoria

    if (!oggettoFinal) {
      toastError("Seleziona o inserisci la categoria della spesa")
      return
    }
    if (!formData.prezzo || parseFloat(formData.prezzo) <= 0) {
      toastError('Inserisci un prezzo valido')
      return
    }

    setSubmitting(true)
    let scontrinoUrl = formData.scontrino_url

    try {
      if (formData.scontrino_file) {
        setUploadingFile(true)
        const uploadResult = await uploadScontrino(formData.scontrino_file)
        if (uploadResult.error) {
          toastError("Errore durante l'upload dello scontrino: " + uploadResult.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
        scontrinoUrl = uploadResult.url
      }

      const spesaData = {
        oggetto: oggettoFinal,
        data_acquisto: new Date(formData.data_acquisto).toLocaleDateString('it-IT'),
        prezzo: formData.prezzo,
        scontrino_url: scontrinoUrl,
      }

      if (editingId) {
        const result = await updateSpesa(editingId, spesaData)
        if (result.error) {
          toastError("Errore durante l'aggiornamento: " + result.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
        toastSuccess('Spesa aggiornata')
      } else {
        const result = await createSpesa(spesaData)
        if (result.error) {
          toastError('Errore durante la creazione: ' + result.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
        toastSuccess('Spesa aggiunta')
      }

      setFormData(emptyForm())
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Errore:', err)
      toastError('Si è verificato un errore. Riprova.')
    } finally {
      setSubmitting(false)
      setUploadingFile(false)
    }
  }

  const handleEdit = (spesa) => {
    const dataParts = spesa.data_acquisto.split('/')
    const dataISO =
      dataParts.length === 3
        ? `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}`
        : new Date().toISOString().split('T')[0]

    const isKnownCategory = SPESE_CATEGORIE.includes(spesa.oggetto)
    setFormData({
      oggettoCategoria: isKnownCategory ? spesa.oggetto : 'Personalizzato',
      oggettoCustom: isKnownCategory ? '' : spesa.oggetto,
      data_acquisto: dataISO,
      prezzo: spesa.prezzo.toString(),
      scontrino_file: null,
      scontrino_url: spesa.scontrino_url,
      scontrino_preview:
        spesa.scontrino_url && spesa.scontrino_url.match(/\.(jpg|jpeg|png|webp)$/i)
          ? spesa.scontrino_url
          : null,
    })
    setEditingId(spesa.id)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('spese-form-anchor')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const removeFile = () =>
    setFormData({ ...formData, scontrino_file: null, scontrino_url: null, scontrino_preview: null })

  const totaleSpese = spese.reduce((sum, s) => sum + (s.prezzo || 0), 0)

  return (
    <PageContainer>
      <PageToolbar>
        <PageHeader
          title="Spese condominiali"
          description="Registra spese e scontrini"
          icon={<ShoppingCartIcon className="size-6 text-primary" />}
        />
        <Button
          className="shrink-0"
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
              Nuova spesa
            </>
          )}
        </Button>
      </PageToolbar>

      {showForm && (
        <Card id="spese-form-anchor">
          <CardHeader>
            <CardTitle>{editingId ? 'Modifica spesa' : 'Nuova spesa'}</CardTitle>
            <CardDescription>Oggetto, data, importo e allegato opzionale</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Categoria *</Label>
                  <Select
                    value={formData.oggettoCategoria}
                    onValueChange={(v) =>
                      setFormData({ ...formData, oggettoCategoria: v, oggettoCustom: '' })
                    }
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleziona categoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {SPESE_CATEGORIE.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                      <SelectItem value="Personalizzato">Personalizzato...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.oggettoCategoria === 'Personalizzato' && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Descrizione *</Label>
                    <Input
                      value={formData.oggettoCustom}
                      onChange={(e) => setFormData({ ...formData, oggettoCustom: e.target.value })}
                      placeholder="Es: Concime, gomma acqua..."
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Data acquisto *</Label>
                  <Input
                    type="date"
                    value={formData.data_acquisto}
                    onChange={(e) => setFormData({ ...formData, data_acquisto: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Prezzo (€) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prezzo}
                    onChange={(e) => setFormData({ ...formData, prezzo: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Scontrino (foto o PDF)</Label>
                  {formData.scontrino_preview && (
                    <div className="space-y-2 rounded-lg border border-input p-3">
                      <img
                        src={formData.scontrino_preview}
                        alt="Anteprima scontrino"
                        className="max-h-48 rounded-md object-contain"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={removeFile}>
                        <XIcon />
                        Rimuovi
                      </Button>
                    </div>
                  )}
                  {formData.scontrino_url && !formData.scontrino_preview && (
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={formData.scontrino_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-2"
                      >
                        <FileIcon className="mr-1 inline size-4" />
                        Visualizza scontrino esistente
                      </a>
                      <Button type="button" variant="outline" size="sm" onClick={removeFile}>
                        Rimuovi
                      </Button>
                    </div>
                  )}
                  {!formData.scontrino_preview && !formData.scontrino_url && (
                    <div className="rounded-lg border border-dashed border-input bg-muted/30 p-6 text-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="scontrino-upload"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                        aria-label="Carica scontrino"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <UploadIcon />
                        Scegli file
                      </Button>
                      <CardDescription className="mt-3 text-pretty">
                        JPG, PNG, WEBP o PDF — massimo 10MB
                      </CardDescription>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={submitting || uploadingFile}>
                  {submitting || uploadingFile ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" />
                      {uploadingFile ? 'Caricamento file...' : 'Salvataggio...'}
                    </>
                  ) : editingId ? (
                    'Salva modifiche'
                  ) : (
                    'Aggiungi spesa'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(null)
                    setFormData(emptyForm())
                  }}
                >
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Errore</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && spese.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
          <Loader2Icon className="size-10 animate-spin text-primary" />
          <p>Caricamento spese...</p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {!loading && spese.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-muted-foreground">
              <ShoppingCartIcon className="size-12 opacity-50" />
              <p className="font-medium text-foreground">Nessuna spesa registrata</p>
              <p className="text-sm">Aggiungi la prima spesa condominiale.</p>
            </div>
          ) : (
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="pl-4 font-semibold">Oggetto</TableHead>
                  <TableHead className="font-semibold">Data</TableHead>
                  <TableHead className="font-semibold">Prezzo</TableHead>
                  <TableHead className="font-semibold">Scontrino</TableHead>
                  <TableHead className="pr-4 text-right font-semibold">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {spese.map((spesa) => (
                  <TableRow key={spesa.id}>
                    <TableCell className="whitespace-normal pl-4">{spesa.oggetto}</TableCell>
                    <TableCell className="whitespace-nowrap">{spesa.data_acquisto}</TableCell>
                    <TableCell className="tabular-nums">
                      {spesa.prezzo ? `${spesa.prezzo.toFixed(2)} €` : '-'}
                    </TableCell>
                    <TableCell className="whitespace-normal">
                      {spesa.scontrino_url ? (
                        <a
                          href={spesa.scontrino_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline underline-offset-2"
                        >
                          <FileIcon className="size-4" />
                          Visualizza
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => handleEdit(spesa)}
                          title="Modifica"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => setDeleteTargetId(spesa.id)}
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

      {spese.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold text-primary">
                {totaleSpese.toFixed(2)} €
              </p>
              <p className="text-xs text-muted-foreground">Totale spese</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="font-heading text-2xl font-bold">{spese.length}</p>
              <p className="text-xs text-muted-foreground">Spese totali</p>
            </CardContent>
          </Card>
        </div>
      )}

      <ConfirmActionDialog
        open={deleteTargetId != null}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null)
        }}
        title="Eliminare questa spesa?"
        description="L’operazione non può essere annullata."
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        onConfirm={async () => {
          if (deleteTargetId == null) return false
          const result = await deleteSpesa(deleteTargetId)
          if (result.error) {
            toastError("Errore durante l'eliminazione: " + result.error.message)
            return false
          }
          toastSuccess('Spesa eliminata')
          return true
        }}
      />
    </PageContainer>
  )
}

export default SpeseCondominiali
