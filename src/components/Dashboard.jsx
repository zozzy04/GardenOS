import { useState, useEffect } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import './Dashboard.css'

const Dashboard = () => {
  const { user } = useAuth()
  const { lavori, loading } = useLavori(user?.id)
  const [stats, setStats] = useState({
    totalWorks: 0,
    totalHours: 0,
    totalEarnings: 0,
    recentWorks: [],
    worksByType: {},
    monthlyStats: []
  })

  useEffect(() => {
    if (lavori) {
      calculateStats(lavori)
    }
  }, [lavori])

  const calculateStats = (worksData) => {
    if (!worksData || worksData.length === 0) return

    // Lavori recenti (ultimi 7 giorni)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const recentWorks = worksData
      .filter(work => {
        const workDate = new Date(work.data.split('/').reverse().join('-'))
        return workDate >= sevenDaysAgo
      })
      .sort((a, b) => {
        const dateA = new Date(a.data.split('/').reverse().join('-'))
        const dateB = new Date(b.data.split('/').reverse().join('-'))
        return dateB - dateA
      })
      .slice(0, 5)

    // Statistiche per tipo
    const worksByType = {}
    worksData.forEach(work => {
      const tipi = Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])
      tipi.forEach(tipo => {
        if (!worksByType[tipo]) {
          worksByType[tipo] = { count: 0, hours: 0, earnings: 0 }
        }
        worksByType[tipo].count++
        worksByType[tipo].hours += parseFloat(work.durata) || 0
        worksByType[tipo].earnings += work.importo || 0
      })
    })

    // Statistiche mensili (ultimi 6 mesi)
    const monthlyStats = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
      
      const monthWorks = worksData.filter(work => {
        const workDate = new Date(work.data.split('/').reverse().join('-'))
        return workDate.getFullYear() === monthDate.getFullYear() && 
               workDate.getMonth() === monthDate.getMonth()
      })

      monthlyStats.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        count: monthWorks.length,
        hours: monthWorks.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0),
        earnings: monthWorks.reduce((sum, w) => sum + (w.importo || 0), 0)
      })
    }

    setStats({
      totalWorks: worksData.length,
      totalHours: worksData.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0),
      totalEarnings: worksData.reduce((sum, w) => sum + (w.importo || 0), 0),
      recentWorks,
      worksByType,
      monthlyStats
    })
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>
          <Icon name="leaf" size={28} className="icon-inline" />
          Dashboard
        </h1>
        <p className="dashboard-subtitle">Panoramica completa delle attività del giardino</p>
      </div>

      {/* Statistiche Principali */}
      <div className="stats-grid">
        <div className="stat-card-large">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(70, 130, 180, 0.1)' }}>
            <Icon name="clipboard" size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Lavori Totali</span>
            <span className="stat-value-large">{stats.totalWorks}</span>
          </div>
        </div>

        <div className="stat-card-large">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(18, 183, 106, 0.1)' }}>
            <Icon name="gauge" size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Ore Totali</span>
            <span className="stat-value-large">{stats.totalHours.toFixed(1)}</span>
          </div>
        </div>

        <div className="stat-card-large highlight">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 255, 255, 0.2)' }}>
            <Icon name="gauge" size={32} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Guadagno Totale</span>
            <span className="stat-value-large">{stats.totalEarnings.toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Lavori Recenti */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>
              <Icon name="clipboard" size={20} className="icon-inline" />
              Lavori Recenti
            </h2>
          </div>
          <div className="recent-works-list">
            {stats.recentWorks.length === 0 ? (
              <div className="empty-state-small">
                <p>Nessun lavoro negli ultimi 7 giorni</p>
              </div>
            ) : (
              stats.recentWorks.map(work => (
                <div key={work.id} className="recent-work-item">
                  <div className="recent-work-info">
                    <div className="recent-work-types">
                      {(Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).map((tipo, idx) => (
                        <span key={idx} className="work-type-badge-small">{tipo}</span>
                      ))}
                    </div>
                    <span className="recent-work-desc">{work.descrizione}</span>
                    <span className="recent-work-date">{work.data}</span>
                  </div>
                  <div className="recent-work-stats">
                    <span className="recent-work-hours">{work.durata || '0'}h</span>
                    <span className="recent-work-earnings">{work.importo ? `${work.importo.toFixed(2)}€` : '-'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Statistiche per Tipo */}
        <div className="dashboard-card">
          <div className="card-header">
            <h2>
              <Icon name="gauge" size={20} className="icon-inline" />
              Statistiche per Tipo
            </h2>
          </div>
          <div className="type-stats-list">
            {Object.keys(stats.worksByType).length === 0 ? (
              <div className="empty-state-small">
                <p>Nessuna statistica disponibile</p>
              </div>
            ) : (
              Object.entries(stats.worksByType).map(([tipo, data]) => (
                <div key={tipo} className="type-stat-item">
                  <div className="type-stat-header">
                    <span className="type-stat-name">{tipo}</span>
                    <span className="type-stat-count">{data.count} lavori</span>
                  </div>
                  <div className="type-stat-details">
                    <span>{data.hours.toFixed(1)}h</span>
                    <span>{data.earnings.toFixed(2)}€</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Grafico Mensile */}
      {stats.monthlyStats.length > 0 && (
        <div className="dashboard-card">
          <div className="card-header">
            <h2>
              <Icon name="gauge" size={20} className="icon-inline" />
              Andamento Mensile (Ultimi 6 Mesi)
            </h2>
          </div>
          <div className="monthly-chart">
            {stats.monthlyStats.map((month, index) => (
              <div key={index} className="month-bar-container">
                <div className="month-bar-wrapper">
                  <div
                    className="month-bar"
                    style={{
                      height: `${(month.count / Math.max(...stats.monthlyStats.map(m => m.count), 1)) * 100}%`
                    }}
                  />
                </div>
                <span className="month-label">{month.month}</span>
                <span className="month-value">{month.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard

