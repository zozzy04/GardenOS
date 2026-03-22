import { toastError, toastSuccess } from '@/lib/notify'

export function formatInvoiceDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * @param {object} params
 * @param {object} params.invoiceData — output di buildInvoiceData
 * @param {object[]} params.filteredWorks
 * @param {object[]} params.filteredSpese
 * @param {string | null} [params.highlightFamigliaNome]
 * @param {string} [params.docTitle]
 * @param {string} [params.fileNamePrefix]
 */
export async function exportInvoiceToPdf({
  invoiceData,
  filteredWorks,
  filteredSpese,
  highlightFamigliaNome = null,
  docTitle = 'FATTURA LAVORI GIARDINO',
  fileNamePrefix = 'fattura-giardino',
}) {
  try {
    if (!invoiceData || (filteredWorks.length === 0 && filteredSpese.length === 0)) {
      toastError('Genera prima la fattura')
      return
    }

    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    let yPosition = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20

    doc.setFillColor(37, 99, 235)
    doc.rect(margin, 10, pageWidth - margin * 2, 30, 'F')

    doc.setFillColor(29, 78, 216)
    doc.rect(margin, 10, pageWidth - margin * 2, 3, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(docTitle, pageWidth / 2, 26, { align: 'center' })

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(255, 255, 255, 0.9)
    doc.text(
      `Periodo: ${formatInvoiceDate(invoiceData.dateRange.start)} - ${formatInvoiceDate(invoiceData.dateRange.end)}`,
      pageWidth / 2,
      33,
      { align: 'center' }
    )

    doc.setTextColor(0, 0, 0)
    yPosition = 50

    doc.setFillColor(249, 250, 251)
    doc.rect(margin, yPosition, pageWidth - margin * 2, 30, 'F')

    doc.setFillColor(37, 99, 235)
    doc.rect(margin, yPosition, pageWidth - margin * 2, 2, 'F')

    yPosition += 10
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text('Riepilogo', margin + 5, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Numero lavori: ${invoiceData.numeroLavori}`, margin + 5, yPosition)
    doc.text(`Ore totali: ${invoiceData.totaleOre.toFixed(1)}h`, margin + 60, yPosition)
    yPosition += 6
    if (invoiceData.numeroSpese > 0) {
      doc.text(
        `Spese condominiali: ${invoiceData.numeroSpese} (${invoiceData.totaleSpese.toFixed(2)} €)`,
        margin + 5,
        yPosition
      )
      yPosition += 6
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(37, 99, 235)
    doc.text(`Totale fattura: ${invoiceData.totale.toFixed(2)} €`, margin + 5, yPosition)
    doc.setTextColor(0, 0, 0)
    yPosition += 25

    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text('Dettaglio Lavori', margin, yPosition)
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition + 2, margin + 60, yPosition + 2)
    yPosition += 12

    doc.setFont('helvetica', 'normal')
    filteredWorks.forEach((work, index) => {
      try {
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = 20
        }

        const hasNotes = work.note && typeof work.note === 'string' && work.note.trim()
        const boxHeight = hasNotes ? 30 : 24

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'F')
          doc.setFillColor(37, 99, 235)
          doc.rect(margin, yPosition - 2, 2, boxHeight, 'F')
        } else {
          doc.setFillColor(255, 255, 255)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'F')
          doc.setFillColor(59, 130, 246)
          doc.rect(margin, yPosition - 2, 2, boxHeight, 'F')
          doc.setDrawColor(229, 231, 235)
          doc.setLineWidth(0.3)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'S')
        }

        let currentY = yPosition

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text('Data:', margin + 5, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(String(work.data || ''), margin + 20, currentY)

        const tipi = Array.isArray(work.tipi) ? work.tipi.join(', ') : work.tipo || '-'
        const tipiText = tipi.length > 50 ? tipi.substring(0, 47) + '...' : tipi
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text('Tipi:', margin + 60, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(tipiText, margin + 75, currentY)

        if (work.usaPrezzoPersonalizzato) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(245, 158, 11)
          doc.text('⭐ Prezzo personalizzato', pageWidth - margin - 3, currentY, { align: 'right' })
          doc.setTextColor(0, 0, 0)
        }

        currentY += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text('Descrizione:', margin + 5, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const descrizione = String(work.descrizione || '')
        const descrizioneText =
          descrizione.length > 80 ? descrizione.substring(0, 77) + '...' : descrizione
        doc.text(descrizioneText, margin + 32, currentY)
        currentY += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text('Ore:', margin + 5, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(String(work.durata || '0'), margin + 20, currentY)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(37, 99, 235)
        doc.text('Importo:', margin + 40, currentY)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(34, 197, 94)
        const importo = parseFloat(work.importo || 0)
        doc.text(`${importo.toFixed(2)} €`, margin + 60, currentY)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')

        if (hasNotes) {
          currentY += 6
          doc.setFontSize(8)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(107, 114, 128)
          const noteText =
            work.note.length > 100 ? work.note.substring(0, 97) + '...' : work.note
          doc.text(`💬 Note: ${noteText}`, margin + 5, currentY)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
        }

        yPosition = currentY + 8
      } catch (error) {
        console.error('Errore nel rendering del lavoro:', error, work)
        yPosition += 20
      }
    })

    yPosition += 10

    if (filteredSpese && filteredSpese.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(15)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(37, 99, 235)
      doc.text('Spese Condominiali', margin, yPosition)
      doc.setTextColor(0, 0, 0)
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition + 2, margin + 60, yPosition + 2)
      yPosition += 12

      doc.setFont('helvetica', 'normal')
      for (let index = 0; index < filteredSpese.length; index++) {
        const spesa = filteredSpese[index]
        if (yPosition > pageHeight - 80) {
          doc.addPage()
          yPosition = 20
        }

        const hasScontrino =
          spesa.scontrino_url && spesa.scontrino_url.match(/\.(jpg|jpeg|png|webp)$/i)
        const boxHeight = hasScontrino ? 50 : 22

        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'F')
          doc.setFillColor(168, 85, 247)
          doc.rect(margin, yPosition - 2, 2, boxHeight, 'F')
        } else {
          doc.setFillColor(255, 255, 255)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'F')
          doc.setFillColor(192, 132, 252)
          doc.rect(margin, yPosition - 2, 2, boxHeight, 'F')
          doc.setDrawColor(229, 231, 235)
          doc.setLineWidth(0.3)
          doc.rect(margin, yPosition - 2, pageWidth - margin * 2, boxHeight, 'S')
        }

        let currentY = yPosition

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(168, 85, 247)
        doc.text('Data:', margin + 5, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        doc.text(String(spesa.data_acquisto || ''), margin + 20, currentY)

        doc.setFont('helvetica', 'bold')
        doc.setTextColor(168, 85, 247)
        doc.text('Oggetto:', margin + 60, currentY)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(0, 0, 0)
        const oggetto = String(spesa.oggetto || '')
        const oggettoText = oggetto.length > 50 ? oggetto.substring(0, 47) + '...' : oggetto
        doc.text(oggettoText, margin + 85, currentY)
        currentY += 6

        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(168, 85, 247)
        doc.text('Prezzo:', margin + 5, currentY)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(34, 197, 94)
        const prezzo = parseFloat(spesa.prezzo || 0)
        doc.text(`${prezzo.toFixed(2)} €`, margin + 25, currentY)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')

        if (hasScontrino) {
          try {
            currentY += 8
            doc.setFontSize(8)
            doc.setFont('helvetica', 'italic')
            doc.setTextColor(107, 114, 128)
            doc.text('📄 Scontrino:', margin + 5, currentY)
            doc.setTextColor(0, 0, 0)
            doc.setFont('helvetica', 'normal')

            const img = new Image()
            img.crossOrigin = 'anonymous'

            await new Promise((resolve) => {
              img.onload = () => {
                try {
                  const maxWidth = 80
                  const maxHeight = 30
                  let imgWidth = img.width * 0.264583
                  let imgHeight = img.height * 0.264583

                  const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1)
                  imgWidth *= ratio
                  imgHeight *= ratio

                  currentY += 5
                  doc.addImage(img, 'JPEG', margin + 3, currentY, imgWidth, imgHeight)
                  currentY += imgHeight + 3
                  resolve()
                } catch (err) {
                  console.warn('Errore inserimento immagine:', err)
                  doc.setFontSize(7)
                  doc.setTextColor(150, 150, 150)
                  doc.text('(Immagine non disponibile)', margin + 3, currentY + 5)
                  doc.setTextColor(0, 0, 0)
                  resolve()
                }
              }
              img.onerror = () => {
                doc.setFontSize(7)
                doc.setTextColor(150, 150, 150)
                doc.text('(Immagine non disponibile)', margin + 3, currentY + 5)
                doc.setTextColor(0, 0, 0)
                resolve()
              }
              img.src = spesa.scontrino_url
            })
          } catch (err) {
            console.warn('Errore caricamento scontrino:', err)
          }
        }

        yPosition = currentY + 6
      }

      yPosition += 10
    }

    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(15)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(37, 99, 235)
    doc.text('Divisione per Millesimi', margin, yPosition)
    doc.setTextColor(0, 0, 0)
    doc.setDrawColor(37, 99, 235)
    doc.setLineWidth(0.5)
    doc.line(margin, yPosition + 2, margin + 60, yPosition + 2)
    yPosition += 12

    doc.setFillColor(37, 99, 235)
    doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 8, 'F')

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(255, 255, 255)
    const millesimiHeaders = ['Famiglia', 'Millesimi', 'Importo']
    const millesimiColWidths = [100, 40, 40]
    let xPosition = margin + 2

    millesimiHeaders.forEach((header, index) => {
      doc.text(header, xPosition, yPosition)
      xPosition += millesimiColWidths[index]
    })
    doc.setTextColor(0, 0, 0)
    yPosition += 10

    doc.setFont('helvetica', 'normal')
    let rowIndex = 0
    Object.entries(invoiceData.divisioneMillesimi).forEach(([famiglia, data]) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        yPosition = 20
        doc.setFillColor(37, 99, 235)
        doc.rect(margin, yPosition - 5, pageWidth - margin * 2, 8, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        xPosition = margin + 2
        millesimiHeaders.forEach((header, idx) => {
          doc.text(header, xPosition, yPosition)
          xPosition += millesimiColWidths[idx]
        })
        doc.setTextColor(0, 0, 0)
        yPosition += 10
        doc.setFont('helvetica', 'normal')
        rowIndex = 0
      }

      const isHighlight = highlightFamigliaNome && famiglia === highlightFamigliaNome
      if (isHighlight) {
        doc.setFillColor(254, 243, 199)
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'F')
        doc.setDrawColor(245, 158, 11)
        doc.setLineWidth(0.4)
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'S')
      } else if (rowIndex % 2 === 0) {
        doc.setFillColor(249, 250, 251)
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'F')
      } else {
        doc.setDrawColor(229, 231, 235)
        doc.setLineWidth(0.2)
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 7, 'S')
      }

      xPosition = margin + 2
      const famigliaText = famiglia.length > 45 ? famiglia.substring(0, 42) + '...' : famiglia

      doc.text(famigliaText, xPosition, yPosition)
      xPosition += millesimiColWidths[0]

      doc.setTextColor(107, 114, 128)
      doc.text(data.millesimi.toFixed(3).replace('.', ','), xPosition, yPosition)
      xPosition += millesimiColWidths[1]
      doc.setTextColor(0, 0, 0)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(34, 197, 94)
      doc.text(`${data.importo.toFixed(0)} €`, xPosition, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0, 0, 0)

      yPosition += 7
      rowIndex++
    })

    yPosition += 3
    const totaleRectY = yPosition - 4
    const totaleRectHeight = 10

    doc.setFillColor(37, 99, 235)
    doc.rect(margin, totaleRectY, pageWidth - margin * 2, totaleRectHeight, 'F')

    doc.setFillColor(29, 78, 216)
    doc.rect(margin, totaleRectY, pageWidth - margin * 2, 2, 'F')

    const textY = totaleRectY + totaleRectHeight / 2 + 2

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    xPosition = margin + 2
    doc.text('Totale', xPosition, textY)
    xPosition += millesimiColWidths[0]
    doc.text('1000,000', xPosition, textY)
    xPosition += millesimiColWidths[1]
    doc.setFontSize(12)
    doc.text(`${Math.round(invoiceData.totale).toFixed(0)} €`, xPosition, textY)

    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')

      doc.text(`Pagina ${i} di ${totalPages}`, pageWidth / 2, pageHeight - 15, {
        align: 'center',
      })

      doc.text(`Generato il ${new Date().toLocaleDateString('it-IT')}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      })

      doc.setFontSize(7)
      doc.setTextColor(156, 163, 175)
      doc.setFont('helvetica', 'italic')
      doc.text('Powered by Riccardo Zozzolotto with GardenOS', pageWidth / 2, pageHeight - 5, {
        align: 'center',
      })
    }

    const fileName = `${fileNamePrefix}-${formatInvoiceDate(invoiceData.dateRange.start).replace(/\//g, '-')}-${formatInvoiceDate(invoiceData.dateRange.end).replace(/\//g, '-')}.pdf`
    doc.save(fileName)
    toastSuccess('PDF scaricato')
  } catch (error) {
    console.error('Errore durante la generazione del PDF:', error)
    toastError('Errore durante la generazione del PDF. Controlla la console per i dettagli.')
  }
}
