import { useState, useEffect } from 'react'
import Icon from './Icons'
import './History.css'

const History = () => {
  const [works, setWorks] = useState([])
  const [filterType, setFilterType] = useState('tutti')
  const [sortBy, setSortBy] = useState('data-desc')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const savedWorks = localStorage.getItem('gardenos-lavori')
    if (savedWorks) {
      setWorks(JSON.parse(savedWorks))
    }
  }, [])

  // Estrae tutti i tipi unici
  const allTipi = works.flatMap(w => {
    if (Array.isArray(w.tipi)) return w.tipi
    if (w.tipo) return [w.tipo]
    return []
  })
  const workTypes = ['tutti', ...new Set(allTipi.filter(Boolean))]

  // Filtra e ordina i lavori
  const filteredAndSortedWorks = works
    .filter(work => {
      // Filtro per tipo
      const typeMatch = filterType === 'tutti' || 
        (Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).includes(filterType)
      
      // Filtro per ricerca
      const searchMatch = !searchTerm || 
        work.descrizione.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (work.note && work.note.toLowerCase().includes(searchTerm.toLowerCase()))
      
      return typeMatch && searchMatch
    })
    .sort((a, b) => {
      const dateA = new Date(a.data.split('/').reverse().join('-'))
      const dateB = new Date(b.data.split('/').reverse().join('-'))
      
      switch (sortBy) {
        case 'data-desc':
          return dateB - dateA
        case 'data-asc':
          return dateA - dateB
        case 'importo-desc':
          return (b.importo || 0) - (a.importo || 0)
        case 'importo-asc':
          return (a.importo || 0) - (b.importo || 0)
        case 'durata-desc':
          return (parseFloat(b.durata) || 0) - (parseFloat(a.durata) || 0)
        case 'durata-asc':
          return (parseFloat(a.durata) || 0) - (parseFloat(b.durata) || 0)
        default:
          return dateB - dateA
      }
    })

  const exportToCSV = () => {
    const headers = ['Data', 'Tipi', 'Descrizione', 'Ore Lavoro', 'Importo (€)', 'Note']
    const rows = filteredAndSortedWorks.map(w => {
      const tipi = Array.isArray(w.tipi) ? w.tipi.join(' + ') : (w.tipo || '')
      return [
        w.data,
        tipi,
        w.descrizione,
        w.durata || '0',
        w.importo ? `${w.importo.toFixed(2)}` : '0',
        w.note || ''
      ]
    })
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `gardenos-storico-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const totaleImporto = filteredAndSortedWorks.reduce((sum, w) => sum + (w.importo || 0), 0)
  const totaleOre = filteredAndSortedWorks.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0)

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>
          <Icon name="file-text" size={28} className="icon-inline" />
          Storico Completo
        </h1>
        <div className="header-actions">
          {filteredAndSortedWorks.length > 0 && (
            <button className="btn-secondary" onClick={exportToCSV}>
              <Icon name="download" size={16} />
              Esporta CSV
            </button>
          )}
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Filtra per tipo:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            {workTypes.map(type => (
              <option key={type} value={type}>
                {type === 'tutti' ? 'Tutti i lavori' : type}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Ordina per:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="data-desc">Data (più recenti)</option>
            <option value="data-asc">Data (più vecchi)</option>
            <option value="importo-desc">Importo (decrescente)</option>
            <option value="importo-asc">Importo (crescente)</option>
            <option value="durata-desc">Durata (decrescente)</option>
            <option value="durata-asc">Durata (crescente)</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Cerca:</label>
          <input
            type="text"
            placeholder="Cerca per descrizione o note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Statistiche Filtri */}
      {filteredAndSortedWorks.length > 0 && (
        <div className="filter-stats">
          <span>{filteredAndSortedWorks.length} lavori trovati</span>
          <span>•</span>
          <span>{totaleOre.toFixed(1)} ore totali</span>
          <span>•</span>
          <span>{totaleImporto.toFixed(2)} € totali</span>
        </div>
      )}

      {/* Tabella Storico */}
      <div className="history-table-container">
        {filteredAndSortedWorks.length === 0 ? (
          <div className="empty-state">
            <Icon name="file-text" size={48} className="icon-empty-state" />
            <p>Nessun lavoro trovato</p>
            <p>Prova a modificare i filtri di ricerca</p>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipi</th>
                <th>Descrizione</th>
                <th>Ore</th>
                <th>Importo</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedWorks.map(work => (
                <tr key={work.id}>
                  <td className="date-cell">{work.data}</td>
                  <td>
                    <div className="work-tipi-badges">
                      {(Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).map((tipo, idx) => (
                        <span key={idx} className="work-type-badge">{tipo}</span>
                      ))}
                    </div>
                  </td>
                  <td className="desc-cell">{work.descrizione}</td>
                  <td className="hours-cell">{work.durata || '0'}</td>
                  <td className="importo-cell">
                    {work.importo ? `${work.importo.toFixed(2)} €` : '-'}
                  </td>
                  <td className="notes-cell">{work.note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default History

