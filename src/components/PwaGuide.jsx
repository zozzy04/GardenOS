import { DownloadIcon, SmartphoneIcon } from 'lucide-react'
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
    title: 'Apri Chrome',
    text: 'Assicurati di usare Google Chrome. Vai all\'indirizzo dell\'app.',
  },
  {
    n: 2,
    title: 'Tocca il menu (⋮)',
    text: 'In alto a destra trovi tre puntini verticali. Toccali per aprire il menu.',
  },
  {
    n: 3,
    title: 'Tocca "Aggiungi a schermata Home"',
    text: 'Nel menu trovi l\'opzione "Aggiungi a schermata Home" oppure "Installa app". Toccala.',
  },
  {
    n: 4,
    title: 'Conferma il nome e tocca "Aggiungi"',
    text: 'Puoi modificare il nome (es. "GardenOS"). Poi tocca "Aggiungi" o "Installa" per confermare.',
  },
  {
    n: 5,
    title: 'Apri l\'app dalla schermata Home',
    text: 'Troverai l\'icona nella schermata Home o nel cassetto delle app. Si apre a schermo intero.',
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
    doc.setFillColor(37, 99, 235)
    doc.rect(margin, 10, pageWidth - margin * 2, 28, 'F')
    doc.setFillColor(29, 78, 216)
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

    renderSteps(IOS_STEPS, 'iPhone — Safari / iOS', [37, 99, 235])
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

const PwaGuide = () => (
  <PageContainer className="max-w-3xl">
    <PageHeader
      title="Installa l'app"
      description="Aggiungi GardenOS alla schermata Home del tuo dispositivo per aprirla come un'app nativa."
      icon={<SmartphoneIcon className="size-7 text-primary" />}
    />

    <div className="grid gap-5 sm:grid-cols-2">
      {/* iPhone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">iPhone — Safari</CardTitle>
          <CardDescription>iOS 14 o superiore</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {IOS_STEPS.map((step) => (
            <StepCard key={step.n} step={step} />
          ))}
        </CardContent>
      </Card>

      {/* Android */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Android — Chrome</CardTitle>
          <CardDescription>Android 8 o superiore</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ANDROID_STEPS.map((step) => (
            <StepCard key={step.n} step={step} />
          ))}
        </CardContent>
      </Card>
    </div>

    <Card className="border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/40">
      <CardContent className="py-4 text-sm text-emerald-900 dark:text-emerald-100">
        <strong>Dopo l&apos;installazione:</strong> l&apos;app si apre a schermo intero senza la
        barra del browser, come qualsiasi altra app. Non richiede download dallo store.
      </CardContent>
    </Card>

    <Button onClick={generatePdf} size="lg" variant="outline" className="w-full sm:w-auto">
      <DownloadIcon />
      Scarica guida PDF
    </Button>
  </PageContainer>
)

export default PwaGuide
