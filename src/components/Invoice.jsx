import { useState, useEffect } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import { useSpese } from '../hooks/useSupabase'
import './Invoice.css'

// Millesimi per le 4 famiglie
const MILLESIMI = {
  'Artico Eros - Salotto Desirè': 201.055,
  'Zozzolotto Gianni - Pasquali Paola': 304.419,
  'Uvai Chiara': 290.081,
  'Pavan Stefano - Tumiotto Eleonora': 204.445
}

const Invoice = () => {
  const { user } = useAuth()
  const { lavori } = useLavori(user?.id)
  const { spese } = useSpese(user?.id)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filteredWorks, setFilteredWorks] = useState([])
  const [filteredSpese, setFilteredSpese] = useState([])
  const [invoiceData, setInvoiceData] = useState(null)

  useEffect(() => {
    if (startDate && endDate && lavori && spese) {
      filterWorksByDate()
    }
  }, [startDate, endDate, lavori, spese])

  const filterWorksByDate = () => {
    if (!startDate || !endDate || !lavori || !spese) return

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const filtered = lavori.filter(work => {
      const workDate = new Date(work.data.split('/').reverse().join('-'))
      return workDate >= start && workDate <= end
    }).sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'))
      const dateB = new Date(b.data.split('/').reverse().join('-'))
      return dateA - dateB
    })

    const filteredSpeseList = spese.filter(spesa => {
      const spesaDate = new Date(spesa.data_acquisto.split('/').reverse().join('-'))
      return spesaDate >= start && spesaDate <= end
    }).sort((a, b) => {
      const dateA = new Date(a.data_acquisto.split('/').reverse().join('-'))
      const dateB = new Date(b.data_acquisto.split('/').reverse().join('-'))
      return dateA - dateB
    })

    setFilteredWorks(filtered)
    setFilteredSpese(filteredSpeseList)
    calculateInvoice(filtered, filteredSpeseList)
  }

  const calculateInvoice = (worksList, speseList = []) => {
    if ((!worksList || worksList.length === 0) && (!speseList || speseList.length === 0)) {
      setInvoiceData(null)
      return
    }

    const totaleLavori = worksList ? worksList.reduce((sum, w) => sum + (w.importo || 0), 0) : 0
    const totaleSpese = speseList ? speseList.reduce((sum, s) => sum + (s.prezzo || 0), 0) : 0
    const totale = totaleLavori + totaleSpese
    const totaleOre = worksList ? worksList.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0) : 0

    // Calcola la divisione per millesimi con arrotondamento all'euro
    const divisioneMillesimi = {}
    const totaleMillesimi = Object.values(MILLESIMI).reduce((sum, m) => sum + m, 0)
    
    // Calcola importi per ogni famiglia
    const importiCalcolati = []
    Object.entries(MILLESIMI).forEach(([famiglia, millesimi]) => {
      const percentuale = millesimi / totaleMillesimi
      const importoCalcolato = totale * percentuale
      importiCalcolati.push({ famiglia, millesimi, importoCalcolato })
    })

    // Arrotonda gli importi all'euro: >= 0.5 per eccesso, < 0.5 per difetto (Math.round)
    const importiArrotondati = importiCalcolati.map(item => ({
      ...item,
      importo: Math.round(item.importoCalcolato) // Arrotonda all'euro
    }))

    // Calcola la differenza tra totale e somma degli importi arrotondati
    const sommaArrotondata = importiArrotondati.reduce((sum, item) => sum + item.importo, 0)
    const differenza = Math.round(totale) - sommaArrotondata

    // Aggiusta la differenza alla famiglia con l'importo più grande
    if (Math.abs(differenza) > 0) {
      const famigliaMax = importiArrotondati.reduce((max, item) => 
        item.importo > max.importo ? item : max
      )
      famigliaMax.importo = Math.round(famigliaMax.importo + differenza)
    }

    // Crea l'oggetto finale (senza percentuale)
    importiArrotondati.forEach(item => {
      divisioneMillesimi[item.famiglia] = {
        millesimi: item.millesimi,
        importo: item.importo
      }
    })

    setInvoiceData({
      totale,
      totaleLavori,
      totaleSpese,
      totaleOre,
      numeroLavori: worksList ? worksList.length : 0,
      numeroSpese: speseList ? speseList.length : 0,
      divisioneMillesimi,
      dateRange: { start: startDate, end: endDate }
    })
  }

  const handleGenerateInvoice = () => {
    if (!startDate || !endDate) {
      alert('Seleziona un periodo di tempo')
      return
    }
    filterWorksByDate()
  }

  const exportToPDF = async () => {
    try {
      if (!invoiceData || (filteredWorks.length === 0 && filteredSpese.length === 0)) {
        alert('Genera prima la fattura')
        return
      }

      // Import dinamico di jsPDF per compatibilità con Vite
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      let yPosition = 20
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)

      // Header con rettangolo
      doc.setFillColor(36, 51, 105) // Blu notte (#243369)
      doc.rect(margin, 10, pageWidth - (margin * 2), 25, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.text('FATTURA LAVORI GIARDINO', pageWidth / 2, 22, { align: 'center' })
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Periodo: ${formatDate(invoiceData.dateRange.start)} - ${formatDate(invoiceData.dateRange.end)}`, pageWidth / 2, 28, { align: 'center' })
      
      doc.setTextColor(0, 0, 0)
      yPosition = 45

      // Riepilogo in box
      doc.setFillColor(242, 244, 247) // Gray-100
      doc.rect(margin, yPosition, pageWidth - (margin * 2), 25, 'F')
      
      yPosition += 8
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Riepilogo', margin + 5, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Numero lavori: ${invoiceData.numeroLavori}`, margin + 5, yPosition)
      doc.text(`Ore totali: ${invoiceData.totaleOre.toFixed(1)}h`, margin + 60, yPosition)
      yPosition += 6
      if (invoiceData.numeroSpese > 0) {
        doc.text(`Spese condominiali: ${invoiceData.numeroSpese} (${invoiceData.totaleSpese.toFixed(2)} €)`, margin + 5, yPosition)
        yPosition += 6
      }
      doc.setFont('helvetica', 'bold')
      doc.text(`Totale fattura: ${invoiceData.totale.toFixed(2)} €`, margin + 5, yPosition)
      yPosition += 20

      // Dettaglio Lavori
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Dettaglio Lavori', margin, yPosition)
      yPosition += 8

      // Righe lavori con dettagli estesi
      doc.setFont('helvetica', 'normal')
      filteredWorks.forEach((work, index) => {
      try {
        // Controlla se serve una nuova pagina
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = 20
        }

        // Box per ogni lavoro con sfondo alternato
        const hasNotes = work.note && typeof work.note === 'string' && work.note.trim()
        const boxHeight = hasNotes ? 28 : 22
        
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251) // Gray-50
          doc.rect(margin, yPosition - 2, pageWidth - (margin * 2), boxHeight, 'F')
        } else {
          doc.setDrawColor(242, 244, 247)
          doc.setLineWidth(0.5)
          doc.rect(margin, yPosition - 2, pageWidth - (margin * 2), boxHeight, 'S')
        }

        let currentY = yPosition

        // Prima riga: Data e Tipi
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Data:', margin + 3, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(work.data || ''), margin + 18, currentY)
        
        const tipi = Array.isArray(work.tipi) ? work.tipi.join(', ') : (work.tipo || '-')
        const tipiText = tipi.length > 50 ? tipi.substring(0, 47) + '...' : tipi
        doc.setFont('helvetica', 'bold')
        doc.text('Tipi:', margin + 60, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(tipiText, margin + 75, currentY)
        
        // Indicatore prezzo personalizzato
        if (work.usaPrezzoPersonalizzato) {
          doc.setFontSize(7)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(70, 130, 180) // Blu acciaio (#4682b4)
          doc.text('* Prezzo personalizzato', pageWidth - margin - 3, currentY, { align: 'right' })
          doc.setTextColor(0, 0, 0)
        }
        
        currentY += 5

        // Seconda riga: Descrizione
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Descrizione:', margin + 3, currentY)
        doc.setFont('helvetica', 'normal')
        const descrizione = String(work.descrizione || '')
        const descrizioneText = descrizione.length > 80 ? descrizione.substring(0, 77) + '...' : descrizione
        doc.text(descrizioneText, margin + 30, currentY)
        currentY += 5

        // Terza riga: Ore, Importo e Note (se presenti)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text('Ore:', margin + 3, currentY)
        doc.setFont('helvetica', 'normal')
        doc.text(String(work.durata || '0'), margin + 18, currentY)
        
        doc.setFont('helvetica', 'bold')
        doc.text('Importo:', margin + 40, currentY)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(70, 130, 180) // Blu acciaio (#4682b4)
        const importo = parseFloat(work.importo || 0)
        doc.text(`${importo.toFixed(2)} €`, margin + 58, currentY)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')

        // Note se presenti
        if (hasNotes) {
          currentY += 5
          doc.setFontSize(8)
          doc.setFont('helvetica', 'italic')
          doc.setTextColor(100, 100, 100)
          const noteText = work.note.length > 100 ? work.note.substring(0, 97) + '...' : work.note
          doc.text(`Note: ${noteText}`, margin + 3, currentY)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
        }

        yPosition = currentY + 6
      } catch (error) {
        console.error('Errore nel rendering del lavoro:', error, work)
        // Continua con il prossimo lavoro anche in caso di errore
        yPosition += 20
      }
      })

      yPosition += 10

      // Sezione Spese Condominiali
      if (filteredSpese && filteredSpese.length > 0) {
        if (yPosition > pageHeight - 60) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Spese Condominiali', margin, yPosition)
        yPosition += 8

        doc.setFont('helvetica', 'normal')
        for (let index = 0; index < filteredSpese.length; index++) {
          const spesa = filteredSpese[index]
          // Controlla se serve una nuova pagina
          if (yPosition > pageHeight - 80) {
            doc.addPage()
            yPosition = 20
          }

          const hasScontrino = spesa.scontrino_url && spesa.scontrino_url.match(/\.(jpg|jpeg|png|webp)$/i)
          const boxHeight = hasScontrino ? 50 : 22
          
          // Box per ogni spesa
          if (index % 2 === 0) {
            doc.setFillColor(249, 250, 251)
            doc.rect(margin, yPosition - 2, pageWidth - (margin * 2), boxHeight, 'F')
          } else {
            doc.setDrawColor(242, 244, 247)
            doc.setLineWidth(0.5)
            doc.rect(margin, yPosition - 2, pageWidth - (margin * 2), boxHeight, 'S')
          }

          let currentY = yPosition

          // Prima riga: Data e Oggetto
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('Data:', margin + 3, currentY)
          doc.setFont('helvetica', 'normal')
          doc.text(String(spesa.data_acquisto || ''), margin + 18, currentY)
          
          doc.setFont('helvetica', 'bold')
          doc.text('Oggetto:', margin + 60, currentY)
          doc.setFont('helvetica', 'normal')
          const oggetto = String(spesa.oggetto || '')
          const oggettoText = oggetto.length > 50 ? oggetto.substring(0, 47) + '...' : oggetto
          doc.text(oggettoText, margin + 85, currentY)
          currentY += 5

          // Seconda riga: Prezzo
          doc.setFontSize(9)
          doc.setFont('helvetica', 'bold')
          doc.text('Prezzo:', margin + 3, currentY)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(70, 130, 180)
          const prezzo = parseFloat(spesa.prezzo || 0)
          doc.text(`${prezzo.toFixed(2)} €`, margin + 25, currentY)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')

          // Immagine scontrino se presente
          if (hasScontrino) {
            try {
              currentY += 8
              doc.setFontSize(8)
              doc.setFont('helvetica', 'italic')
              doc.setTextColor(100, 100, 100)
              doc.text('Scontrino:', margin + 3, currentY)
              doc.setTextColor(0, 0, 0)
              doc.setFont('helvetica', 'normal')
              
              // Carica e inserisci immagine
              const img = new Image()
              img.crossOrigin = 'anonymous'
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  try {
                    // Calcola dimensioni mantenendo proporzioni (max width 80mm)
                    const maxWidth = 80
                    const maxHeight = 30
                    let imgWidth = img.width * 0.264583 // Converti px a mm
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

      // Divisione Millesimi
      if (yPosition > pageHeight - 60) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Divisione per Millesimi', margin, yPosition)
      yPosition += 8

      // Tabella millesimi con sfondo header
      doc.setFillColor(242, 244, 247)
      doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F')
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      const millesimiHeaders = ['Famiglia', 'Millesimi', 'Importo']
      const millesimiColWidths = [100, 40, 40]
      let xPosition = margin + 2

      // Header
      millesimiHeaders.forEach((header, index) => {
        doc.text(header, xPosition, yPosition)
        xPosition += millesimiColWidths[index]
      })
      yPosition += 8

      // Righe millesimi
      doc.setFont('helvetica', 'normal')
      let rowIndex = 0
      Object.entries(invoiceData.divisioneMillesimi).forEach(([famiglia, data]) => {
        if (yPosition > pageHeight - 30) {
          doc.addPage()
          yPosition = 20
          // Re-disegna header
          doc.setFillColor(242, 244, 247)
          doc.rect(margin, yPosition - 5, pageWidth - (margin * 2), 7, 'F')
          doc.setFont('helvetica', 'bold')
          xPosition = margin + 2
          millesimiHeaders.forEach((header, idx) => {
            doc.text(header, xPosition, yPosition)
            xPosition += millesimiColWidths[idx]
          })
          yPosition += 8
          doc.setFont('helvetica', 'normal')
          rowIndex = 0
        }

        // Sfondo alternato
        if (rowIndex % 2 === 0) {
          doc.setFillColor(249, 250, 251)
          doc.rect(margin, yPosition - 4, pageWidth - (margin * 2), 6, 'F')
        }

        xPosition = margin + 2
        const famigliaText = famiglia.length > 45 ? famiglia.substring(0, 42) + '...' : famiglia

        doc.text(famigliaText, xPosition, yPosition)
        xPosition += millesimiColWidths[0]

        doc.text(data.millesimi.toFixed(3).replace('.', ','), xPosition, yPosition)
        xPosition += millesimiColWidths[1]

        doc.setFont('helvetica', 'bold')
        doc.text(`${data.importo.toFixed(0)} €`, xPosition, yPosition)
        doc.setFont('helvetica', 'normal')

        yPosition += 6
        rowIndex++
      })

      // Totale con sfondo
      yPosition += 2
      const totaleRectY = yPosition - 4
      const totaleRectHeight = 8
      doc.setFillColor(36, 51, 105) // Blu notte (#243369)
      doc.rect(margin, totaleRectY, pageWidth - (margin * 2), totaleRectHeight, 'F')
      
      // Centra verticalmente il testo nel rettangolo (il testo ha base a yPosition, quindi aggiustiamo)
      const textY = totaleRectY + (totaleRectHeight / 2) + 2 // +2 per centrare meglio rispetto alla base del testo

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      xPosition = margin + 2
      doc.text('Totale', xPosition, textY)
      xPosition += millesimiColWidths[0]
      doc.text('1000,000', xPosition, textY)
      xPosition += millesimiColWidths[1]
      doc.text(`${Math.round(invoiceData.totale).toFixed(0)} €`, xPosition, textY)

      // Footer su tutte le pagine
      const totalPages = doc.internal.pages.length - 1
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setTextColor(0, 0, 0)
        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        
        // Pagina X di Y
        doc.text(
          `Pagina ${i} di ${totalPages}`,
          pageWidth / 2,
          pageHeight - 15,
          { align: 'center' }
        )
        
        // Data di creazione
        doc.text(
          `Generato il ${new Date().toLocaleDateString('it-IT')}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        )
        
        // Powered by
        doc.setFontSize(7)
        doc.setTextColor(100, 100, 100)
        doc.text(
          'Powered by Riccardo Zozzolotto with GardenOS',
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        )
      }

      // Salva PDF
      const fileName = `fattura-giardino-${formatDate(invoiceData.dateRange.start).replace(/\//g, '-')}-${formatDate(invoiceData.dateRange.end).replace(/\//g, '-')}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error('Errore durante la generazione del PDF:', error)
      alert('Errore durante la generazione del PDF. Controlla la console per i dettagli.')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('it-IT', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  return (
    <div className="invoice-page">
      <div className="invoice-header">
        <h1>
          <Icon name="file-text" size={28} className="icon-inline" />
          Genera Fattura
        </h1>
      </div>

      <div className="invoice-filters">
        <div className="date-range-selector">
          <div className="form-group">
            <label>Data Inizio *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="form-group">
            <label>Data Fine *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="date-input"
            />
          </div>
          <div className="form-group">
            <button 
              className="btn-primary"
              onClick={handleGenerateInvoice}
              disabled={!startDate || !endDate}
            >
              <Icon name="gauge" size={16} />
              Genera Fattura
            </button>
          </div>
        </div>
      </div>

      {invoiceData && (
        <>
          <div className="invoice-summary">
            <div className="summary-card">
              <div className="summary-label">Periodo</div>
              <div className="summary-value">
                {formatDate(invoiceData.dateRange.start)} - {formatDate(invoiceData.dateRange.end)}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Lavori</div>
              <div className="summary-value">{invoiceData.numeroLavori}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Ore Totali</div>
              <div className="summary-value">{invoiceData.totaleOre.toFixed(1)}h</div>
            </div>
            {invoiceData.numeroSpese > 0 && (
              <div className="summary-card">
                <div className="summary-label">Spese Condominiali</div>
                <div className="summary-value">{invoiceData.numeroSpese} ({invoiceData.totaleSpese.toFixed(2)} €)</div>
              </div>
            )}
            <div className="summary-card highlight">
              <div className="summary-label">Totale Fattura</div>
              <div className="summary-value">{invoiceData.totale.toFixed(2)} €</div>
            </div>
          </div>

          {filteredWorks.length > 0 && (
            <div className="invoice-works">
              <h2>Dettaglio Lavori</h2>
              <div className="works-list">
                {filteredWorks.map(work => (
                <div key={work.id} className="work-item">
                  <div className="work-item-header">
                    <span className="work-date">{work.data}</span>
                    {work.usaPrezzoPersonalizzato && (
                      <span className="custom-price-badge">⭐ Prezzo personalizzato</span>
                    )}
                  </div>
                  <div className="work-item-body">
                    <div className="work-types">
                      {(Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).map((tipo, idx) => (
                        <span key={idx} className="work-type-tag">{tipo}</span>
                      ))}
                    </div>
                    <div className="work-description">{work.descrizione}</div>
                    <div className="work-details">
                      <span>Ore: {work.durata || '0'}</span>
                      <span className="work-amount">{work.importo ? `${work.importo.toFixed(2)} €` : '-'}</span>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          )}

          {filteredSpese.length > 0 && (
            <div className="invoice-works">
              <h2>Spese Condominiali</h2>
              <div className="works-list">
                {filteredSpese.map(spesa => (
                  <div key={spesa.id} className="work-item">
                    <div className="work-item-header">
                      <span className="work-date">{spesa.data_acquisto}</span>
                    </div>
                    <div className="work-item-body">
                      <div className="work-description">{spesa.oggetto}</div>
                      <div className="work-details">
                        <span className="work-amount">{spesa.prezzo ? `${spesa.prezzo.toFixed(2)} €` : '-'}</span>
                      </div>
                      {spesa.scontrino_url && (
                        <div className="work-details" style={{ marginTop: '8px' }}>
                          <a 
                            href={spesa.scontrino_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="scontrino-link-inline"
                          >
                            <Icon name="file" size={16} />
                            Visualizza scontrino
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="invoice-division">
            <h2>Divisione per Millesimi</h2>
            <div className="millesimi-table">
              <div className="millesimi-header">
                <div className="millesimi-col-famiglia">Famiglia</div>
                <div className="millesimi-col-millesimi">Millesimi</div>
                <div className="millesimi-col-importo">Importo</div>
              </div>
              {Object.entries(invoiceData.divisioneMillesimi).map(([famiglia, data]) => (
                <div key={famiglia} className="millesimi-row">
                  <div className="millesimi-col-famiglia">{famiglia}</div>
                  <div className="millesimi-col-millesimi">{data.millesimi.toFixed(3).replace('.', ',')}</div>
                  <div className="millesimi-col-importo">{data.importo.toFixed(0)} €</div>
                </div>
              ))}
              <div className="millesimi-footer">
                <div className="millesimi-col-famiglia"><strong>Totale</strong></div>
                <div className="millesimi-col-millesimi"><strong>1000,000</strong></div>
                <div className="millesimi-col-importo"><strong>{Math.round(invoiceData.totale).toFixed(0)} €</strong></div>
              </div>
            </div>
          </div>

          <div className="invoice-actions">
            <button className="btn-primary" onClick={exportToPDF}>
              <Icon name="download" size={16} />
              Scarica PDF
            </button>
          </div>
        </>
      )}

      {!invoiceData && startDate && endDate && filteredWorks.length === 0 && filteredSpese.length === 0 && (
        <div className="empty-state">
          <Icon name="file-text" size={48} className="icon-empty-state" />
          <p>Nessun lavoro o spesa trovati nel periodo selezionato</p>
        </div>
      )}
    </div>
  )
}

export default Invoice

