import * as React from 'react'
import {
  CheckCircle2Icon,
  DownloadIcon,
  ShareIcon,
  SmartphoneIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PageContainer, PageHeader } from '@/components/page-layout'
import { toastError, toastSuccess } from '@/lib/notify'
import { isIOS, useInstallPrompt } from '@/hooks/use-install-prompt'

const IOS_STEPS = [
  {
    n: 1,
    title: 'Apri Safari',
    text: 'Assicurati di usare Safari (non Chrome o altri browser). Vai all\'indirizzo dell\'app.',
  },
  {
    n: 2,
    title: 'Tocca il pulsante Condividi',
    text: 'In basso al centro dello schermo trovi l\'icona con la freccia verso l\'alto (□↑). Toccala.',
  },
  {
    n: 3,
    title: 'Scorri e tocca "Aggiungi a schermata Home"',
    text: 'Nel menu che si apre, scorri verso il basso finché non vedi l\'opzione "Aggiungi a schermata Home" con l\'icona di un quadrato con il simbolo +.',
  },
  {
    n: 4,
    title: 'Conferma il nome e tocca "Aggiungi"',
    text: 'Puoi modificare il nome dell\'app (es. "GardenOS"). Poi tocca "Aggiungi" in alto a destra.',
  },
  {
    n: 5,
    title: 'Apri l\'app dalla schermata Home',
    text: 'Troverai l\'icona GardenOS nella schermata principale. Si aprirà a schermo intero come un\'app nativa.',
  },
]

const ANDROID_STEPS = [
  {
    n: 1,
    title: 'Usa il pulsante «Installa» qui sopra',
    text: 'Se compare, è la strada più breve: un tocco e l\'app viene installata. Gli altri passaggi servono solo se il pulsante non c\'è.',
  },
  {
    n: 2,
    title: 'Altrimenti apri il menu di Chrome (⋮)',
    text: 'Tre puntini verticali in alto a destra.',
  },
  {
    n: 3,
    title: 'Tocca «Installa app»',
    text: 'In alcune versioni si chiama «Aggiungi a schermata Home».',
  },
  {
    n: 4,
    title: 'Conferma',
    text: 'Puoi cambiare il nome prima di confermare.',
  },
]

async function generatePdf() {
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    let y = 20

    // Header
    doc.setFillColor(22, 163, 74)
    doc.rect(margin, 10, pageWidth - margin * 2, 28, 'F')
    doc.setFillColor(21, 128, 61)
    doc.rect(margin, 10, pageWidth - margin * 2, 2.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('GardenOS — Guida installazione', pageWidth / 2, 24, { align: 'center' })
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Come installare l\'app sul tuo dispositivo', pageWidth / 2, 33, { align: 'center' })
    doc.setTextColor(0, 0, 0)
    y = 52

    const renderSteps = (steps, title, color) => {
      if (y > 220) { doc.addPage(); y = 20 }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...color)
      doc.text(title, margin, y)
      doc.setDrawColor(...color)
      doc.setLineWidth(0.5)
      doc.line(margin, y + 2, margin + 55, y + 2)
      doc.setTextColor(0, 0, 0)
      y += 12

      steps.forEach((step) => {
        if (y > 255) { doc.addPage(); y = 20 }

        doc.setFillColor(249, 250, 251)
        doc.rect(margin, y - 4, pageWidth - margin * 2, 22, 'F')
        doc.setFillColor(...color)
        doc.rect(margin, y - 4, 2, 22, 'F')

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...color)
        doc.text(`${step.n}.`, margin + 5, y + 4)
        doc.setTextColor(0, 0, 0)
        doc.text(step.title, margin + 14, y + 4)

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(75, 85, 99)
        const lines = doc.splitTextToSize(step.text, pageWidth - margin * 2 - 18)
        doc.text(lines, margin + 14, y + 11)
        doc.setTextColor(0, 0, 0)

        y += 26
      })

      y += 6
    }

    renderSteps(IOS_STEPS, 'iPhone — Safari / iOS', [21, 128, 61])
    renderSteps(ANDROID_STEPS, 'Android — Google Chrome', [22, 163, 74])

    // Note finali
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFillColor(240, 253, 244)
    doc.rect(margin, y - 2, pageWidth - margin * 2, 18, 'F')
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(22, 163, 74)
    doc.text('Dopo l\'installazione:', margin + 4, y + 5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    doc.text('L\'app si apre a schermo intero come un\'applicazione nativa. Nessun download dallo store.', margin + 4, y + 12)
    y += 26

    // Footer su ogni pagina
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.setFont('helvetica', 'italic')
      doc.text(
        `Pagina ${i} di ${totalPages}  —  Powered by Riccardo Zozzolotto — riccardozozzolotto.com`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' }
      )
    }

    doc.save('gardenos-guida-installazione.pdf')
    toastSuccess('Guida scaricata')
  } catch {
    toastError('Errore nella generazione del PDF')
  }
}

function StepCard({ step }) {
  return (
    <div className="flex gap-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
        {step.n}
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold">{step.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{step.text}</p>
      </div>
    </div>
  )
}

const SCHEDE = {
  ios: { titolo: 'iPhone — Safari', sottotitolo: 'iOS 14 o superiore', passi: IOS_STEPS },
  android: { titolo: 'Android — Chrome', sottotitolo: 'Android 8 o superiore', passi: ANDROID_STEPS },
}

const PwaGuide = () => {
  const { puoInstallare, installata, installa } = useInstallPrompt()
  const suIOS = React.useMemo(() => isIOS(), [])

  const handleInstalla = async () => {
    const esito = await installa()
    if (esito === 'accepted') toastSuccess('GardenOS installata')
  }

  // Prima la piattaforma su cui si trova chi legge
  const ordine = suIOS ? ['ios', 'android'] : ['android', 'ios']

  return (
    <PageContainer className="max-w-3xl">
      <PageHeader
        title="Installa l'app"
        description="Aggiungi GardenOS alla schermata Home per aprirla come un'app, a schermo intero."
        icon={<SmartphoneIcon className="size-7 text-primary" />}
      />

      {installata && (
        <Card className="border-success/40 bg-success/5">
          <CardContent className="flex items-start gap-3 py-5">
            <CheckCircle2Icon className="mt-0.5 size-6 shrink-0 text-success" />
            <div>
              <p className="font-medium">GardenOS è già installata</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                La stai usando come app. I passaggi qui sotto servono per aggiungerla
                su un altro dispositivo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!installata && puoInstallare && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-medium">Il tuo browser può installarla da qui</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Un tocco e GardenOS finisce fra le tue app. Niente store, niente download.
              </p>
            </div>
            <Button size="lg" onClick={handleInstalla} className="shrink-0">
              <SmartphoneIcon />
              Installa GardenOS
            </Button>
          </CardContent>
        </Card>
      )}

      {!installata && !puoInstallare && suIOS && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 py-4 text-sm">
            <ShareIcon className="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
              Su iPhone l&apos;installazione passa dal menu Condividi di Safari: Apple non
              consente ai siti di installarsi da soli. Bastano i passaggi qui sotto.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {ordine.map((chiave) => {
          const scheda = SCHEDE[chiave]
          return (
            <Card key={chiave}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{scheda.titolo}</CardTitle>
                <CardDescription>{scheda.sottotitolo}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scheda.passi.map((step) => (
                  <StepCard key={step.n} step={step} />
                ))}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4 text-sm text-foreground">
          <strong>Dopo l&apos;installazione:</strong> l&apos;app si apre a schermo intero senza
          la barra del browser e continua a funzionare anche senza rete, mostrando gli ultimi
          dati scaricati. Gli aggiornamenti arrivano da soli alla riapertura.
        </CardContent>
      </Card>

      <Button onClick={generatePdf} size="lg" variant="outline" className="w-full sm:w-auto">
        <DownloadIcon />
        Scarica guida PDF
      </Button>
    </PageContainer>
  )
}

export default PwaGuide
