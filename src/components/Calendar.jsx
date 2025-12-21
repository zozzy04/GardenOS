import { useState, useEffect } from 'react'
import Icon from './Icons'
import './Calendar.css'

const Calendar = () => {
  const [works, setWorks] = useState([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [predictions, setPredictions] = useState([])

  useEffect(() => {
    const savedWorks = localStorage.getItem('gardenos-lavori')
    if (savedWorks) {
      const loadedWorks = JSON.parse(savedWorks)
      setWorks(loadedWorks)
      calculatePredictions(loadedWorks)
    }
  }, [])

  // Calcola le previsioni future basate sui lavori precedenti
  const calculatePredictions = (worksData) => {
    if (!worksData || worksData.length === 0) {
      setPredictions([])
      return
    }

    const predictionsMap = {}
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    // Raggruppa i lavori per tipo
    const worksByType = {}
    worksData.forEach(work => {
      const tipi = Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])
      tipi.forEach(tipo => {
        if (!worksByType[tipo]) {
          worksByType[tipo] = []
        }
        const workDate = new Date(work.data.split('/').reverse().join('-'))
        worksByType[tipo].push(workDate)
      })
    })

    // Calcola la media dei giorni tra i lavori per ogni tipo
    Object.entries(worksByType).forEach(([tipo, dates]) => {
      if (dates.length < 2) return

      // Ordina le date
      dates.sort((a, b) => a - b)

      // Calcola gli intervalli tra lavori consecutivi
      const intervals = []
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
        if (diff > 0) {
          intervals.push(diff)
        }
      }

      if (intervals.length === 0) return

      // Calcola la media degli intervalli
      const avgInterval = Math.round(
        intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      )

      // Trova l'ultima data per questo tipo
      const lastDate = new Date(Math.max(...dates.map(d => d.getTime())))
      lastDate.setHours(0, 0, 0, 0)

      // Calcola la prossima data prevista
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + avgInterval)

      // Aggiungi solo se la data prevista è nel futuro
      if (nextDate >= now) {
        if (!predictionsMap[nextDate.toISOString().split('T')[0]]) {
          predictionsMap[nextDate.toISOString().split('T')[0]] = []
        }
        predictionsMap[nextDate.toISOString().split('T')[0]].push({
          tipo,
          avgInterval,
          lastDate: lastDate.toLocaleDateString('it-IT')
        })
      }
    })

    // Converti in array e ordina per data
    const predictionsArray = Object.entries(predictionsMap)
      .map(([date, tipi]) => ({
        date: new Date(date),
        tipi
      }))
      .sort((a, b) => a.date - b.date)

    setPredictions(predictionsArray)
  }

  // Genera i giorni del mese
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    
    // Aggiungi giorni vuoti all'inizio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Aggiungi i giorni del mese
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Verifica se una data ha lavori
  const getWorksForDate = (date) => {
    if (!date) return []
    const dateStr = date.toLocaleDateString('it-IT')
    return works.filter(work => work.data === dateStr)
  }

  // Verifica se una data ha previsioni
  const getPredictionsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    const prediction = predictions.find(p => {
      const predDateStr = p.date.toISOString().split('T')[0]
      return predDateStr === dateStr
    })
    return prediction ? prediction.tipi : []
  }

  // Verifica se una data è oggi
  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Verifica se una data è passata
  const isPast = (date) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const days = getDaysInMonth()
  const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <h1>
          <Icon name="clipboard" size={28} className="icon-inline" />
          Calendario Lavori
        </h1>
        <div className="header-actions">
          <button className="btn-secondary" onClick={goToToday}>
            Oggi
          </button>
        </div>
      </div>

      {/* Navigazione Mese */}
      <div className="calendar-nav">
        <button className="nav-month-btn" onClick={prevMonth}>
          <Icon name="chevron-left" size={20} />
        </button>
        <h2 className="current-month">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h2>
        <button className="nav-month-btn" onClick={nextMonth}>
          <Icon name="chevron-right" size={20} />
        </button>
      </div>

      {/* Legenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <div className="legend-color past"></div>
          <span>Lavoro completato</span>
        </div>
        <div className="legend-item">
          <div className="legend-color prediction"></div>
          <span>Data prevista</span>
        </div>
        <div className="legend-item">
          <div className="legend-color today"></div>
          <span>Oggi</span>
        </div>
      </div>

      {/* Calendario */}
      <div className="calendar-container">
        <div className="calendar-weekdays">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        <div className="calendar-grid">
          {days.map((date, index) => {
            const dayWorks = getWorksForDate(date)
            const dayPredictions = getPredictionsForDate(date)
            const isTodayDate = isToday(date)
            const isPastDate = isPast(date)

            return (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isTodayDate ? 'today' : ''} ${isPastDate ? 'past' : ''}`}
              >
                {date && (
                  <>
                    <div className="day-number">{date.getDate()}</div>
                    <div className="day-events">
                      {dayWorks.map((work, idx) => (
                        <div key={idx} className="event-item completed" title={work.descrizione}>
                          <Icon name="check" size={12} />
                          <span>{(Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).join(', ')}</span>
                        </div>
                      ))}
                      {dayPredictions.map((pred, idx) => (
                        <div key={idx} className="event-item prediction" title={`Previsto: ${pred.tipo} (ultimo: ${pred.lastDate})`}>
                          <Icon name="clock" size={12} />
                          <span>{pred.tipo}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Lista Previsioni Future */}
      {predictions.length > 0 && (
        <div className="predictions-section">
          <h2>
            <Icon name="clock" size={20} className="icon-inline" />
            Prossime Date Previste
          </h2>
          <div className="predictions-list">
            {predictions.slice(0, 10).map((prediction, idx) => (
              <div key={idx} className="prediction-item">
                <div className="prediction-date">
                  {prediction.date.toLocaleDateString('it-IT', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                <div className="prediction-types">
                  {prediction.tipi.map((pred, pIdx) => (
                    <span key={pIdx} className="prediction-badge">
                      {pred.tipo}
                    </span>
                  ))}
                </div>
                <div className="prediction-info">
                  {prediction.tipi.map((pred, pIdx) => (
                    <span key={pIdx} className="prediction-detail">
                      Ultimo: {pred.lastDate} • Media: {pred.avgInterval} giorni
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar

