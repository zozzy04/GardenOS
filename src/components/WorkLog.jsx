import { useState, useEffect } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import './WorkLog.css'

// Tariffe orarie per categoria
const TARIFFE = {
  'Taglio erba': 15,
  'Taglio siepe': 20,
  'Raccolta foglie': 15
}

const WorkLog = () => {
  const { user } = useAuth()
  const { lavori, loading, error, createLavoro, updateLavoro, deleteLavoro } = useLavori(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    tipi: [], // Array di categorie selezionate
    descrizione: '',
    durata: '0.5',
    note: '',
    prezzoPersonalizzato: '',
    usaPrezzoPersonalizzato: false
  })
  const [filterType, setFilterType] = useState('tutti')
  const [submitting, setSubmitting] = useState(false)

  // Converti lavori da Supabase al formato dell'app
  const works = lavori || []

  // Calcola l'importo in base ai tipi (media delle tariffe) e alle ore, o usa prezzo personalizzato
  const calculateImporto = (tipi, durata, prezzoPersonalizzato = '', usaPrezzoPersonalizzato = false) => {
    // Se è attivo il prezzo personalizzato e c'è un valore, usalo
    if (usaPrezzoPersonalizzato && prezzoPersonalizzato) {
      return parseFloat(prezzoPersonalizzato).toFixed(2)
    }
    // Altrimenti calcola automaticamente
    if (!tipi || tipi.length === 0 || !durata) return 0
    const tariffe = tipi.map(tipo => TARIFFE[tipo] || 0).filter(t => t > 0)
    if (tariffe.length === 0) return 0
    const tariffaMedia = tariffe.reduce((sum, t) => sum + t, 0) / tariffe.length
    return (parseFloat(durata) * tariffaMedia).toFixed(2)
  }

  // Gestisce la selezione/deselezione delle categorie
  const handleTipoToggle = (tipo) => {
    const currentTipi = formData.tipi || []
    if (currentTipi.includes(tipo)) {
      setFormData({ ...formData, tipi: currentTipi.filter(t => t !== tipo) })
    } else {
      setFormData({ ...formData, tipi: [...currentTipi, tipo] })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.usaPrezzoPersonalizzato && (!formData.tipi || formData.tipi.length === 0)) {
      alert('Seleziona almeno una categoria di lavoro oppure usa un prezzo personalizzato')
      return
    }
    if (formData.usaPrezzoPersonalizzato && (!formData.prezzoPersonalizzato || parseFloat(formData.prezzoPersonalizzato) <= 0)) {
      alert('Inserisci un prezzo personalizzato valido')
      return
    }
    if (!formData.durata || parseFloat(formData.durata) <= 0) {
      alert('Inserisci un numero di ore valido')
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
      prezzoPersonalizzato: formData.usaPrezzoPersonalizzato ? formData.prezzoPersonalizzato : ''
    }

    try {
      if (editingId) {
        // Modifica lavoro esistente
        const result = await updateLavoro(editingId, workData)
        if (result.error) {
          alert('Errore durante l\'aggiornamento: ' + result.error.message)
          setSubmitting(false)
          return
        }
      } else {
        // Crea nuovo lavoro
        const result = await createLavoro(workData)
        if (result.error) {
          alert('Errore durante la creazione: ' + result.error.message)
          setSubmitting(false)
          return
        }
      }
      
      // Reset form
      setFormData({
        data: new Date().toISOString().split('T')[0],
        tipi: [],
        descrizione: '',
        durata: '0.5',
        note: '',
        prezzoPersonalizzato: '',
        usaPrezzoPersonalizzato: false
      })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Errore:', err)
      alert('Si è verificato un errore. Riprova.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questo lavoro?')) {
      const result = await deleteLavoro(id)
      if (result.error) {
        alert('Errore durante l\'eliminazione: ' + result.error.message)
      }
    }
  }

  const handleEdit = (work) => {
    // Gestisce compatibilità con vecchi dati (tipo come stringa)
    const tipi = Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])
    // Converte data da formato italiano (DD/MM/YYYY) a formato input date (YYYY-MM-DD)
    const dataParts = work.data.split('/')
    const dataISO = dataParts.length === 3 ? `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}` : new Date().toISOString().split('T')[0]
    
    setFormData({
      data: dataISO,
      tipi: tipi,
      descrizione: work.descrizione,
      durata: work.durata || '0.5',
      note: work.note || '',
      prezzoPersonalizzato: work.prezzoPersonalizzato || '',
      usaPrezzoPersonalizzato: work.usaPrezzoPersonalizzato || false
    })
    setEditingId(work.id)
    setShowForm(true)
    // Scrolla al form
    setTimeout(() => {
      document.querySelector('.work-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const filteredWorks = filterType === 'tutti' 
    ? works 
    : works.filter(work => {
        // Gestisce sia array di tipi che tipo singolo (compatibilità)
        const workTipi = Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])
        return workTipi.includes(filterType)
      })

  // Estrae tutti i tipi unici dai lavori (gestisce compatibilità)
  const allTipi = works.flatMap(w => {
    if (Array.isArray(w.tipi)) return w.tipi
    if (w.tipo) return [w.tipo]
    return []
  })
  const workTypes = ['tutti', ...new Set(allTipi.filter(Boolean))]

  const exportToCSV = () => {
    const headers = ['Data', 'Tipi', 'Descrizione', 'Ore Lavoro', 'Importo (€)', 'Note']
    const rows = works.map(w => {
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
    link.download = `gardenos-lavori-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Calcola importo totale
  const totaleImporto = works.reduce((sum, w) => sum + (w.importo || 0), 0)
  const totaleOre = works.reduce((sum, w) => sum + (parseFloat(w.durata) || 0), 0)

  return (
    <div className="work-log">
      <div className="work-log-header">
        <h1>
          <Icon name="clipboard" size={28} className="icon-inline" />
          Registro Lavori Giardino
        </h1>
        <div className="header-actions">
          <button 
            className="btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <Icon name="x" size={16} />
                Chiudi
              </>
            ) : (
              <>
                <Icon name="plus" size={16} />
                Nuovo Lavoro
              </>
            )}
          </button>
          {works.length > 0 && (
            <button 
              className="btn-secondary"
              onClick={exportToCSV}
            >
              <Icon name="download" size={16} />
              Esporta CSV
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <form className="work-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Modifica Lavoro' : 'Nuovo Lavoro'}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Data *</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Categorie di Lavoro * (puoi selezionarne più di una)</label>
              <div className="categorie-checkboxes">
                {Object.keys(TARIFFE).map(tipo => (
                  <label key={tipo} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={(formData.tipi || []).includes(tipo)}
                      onChange={() => handleTipoToggle(tipo)}
                    />
                    <span className="checkbox-text">
                      {tipo} ({TARIFFE[tipo]}€/ora)
                    </span>
                  </label>
                ))}
              </div>
              {(formData.tipi || []).length > 0 && (
                <div className="selected-tipi-info">
                  <span>Tariffa media: </span>
                  <strong>
                    {((formData.tipi || []).reduce((sum, t) => sum + (TARIFFE[t] || 0), 0) / (formData.tipi || []).length).toFixed(2)}€/ora
                  </strong>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Descrizione *</label>
              <input
                type="text"
                value={formData.descrizione}
                onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                placeholder="Es: Potatura rosmarino, semina pomodori..."
                required
              />
            </div>
            <div className="form-group">
              <label>Ore Lavoro *</label>
              <div className="duration-control">
                <select
                  value={formData.durata}
                  onChange={(e) => setFormData({ ...formData, durata: e.target.value })}
                  className="duration-select"
                  required
                >
                  {Array.from({ length: 20 }, (_, i) => {
                    const value = (i + 1) * 0.5
                    return (
                      <option key={value} value={value.toString()}>
                        {value} {value === 1 ? 'ora' : 'ore'}
                      </option>
                    )
                  })}
                </select>
                <div className="duration-display">
                  {!formData.usaPrezzoPersonalizzato && (formData.tipi || []).length > 0 && (
                    <span className="importo-preview">
                      Totale: {calculateImporto(formData.tipi, formData.durata)} €
                    </span>
                  )}
                  {formData.usaPrezzoPersonalizzato && formData.prezzoPersonalizzato && (
                    <span className="importo-preview">
                      Totale: {parseFloat(formData.prezzoPersonalizzato).toFixed(2)} €
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.usaPrezzoPersonalizzato}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    usaPrezzoPersonalizzato: e.target.checked,
                    prezzoPersonalizzato: e.target.checked ? formData.prezzoPersonalizzato : ''
                  })}
                />
                <span className="checkbox-text">Usa prezzo personalizzato</span>
              </label>
              {formData.usaPrezzoPersonalizzato && (
                <div className="prezzo-personalizzato-group" style={{ marginTop: '12px' }}>
                  <label>Prezzo Personalizzato (€) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.prezzoPersonalizzato}
                    onChange={(e) => setFormData({ ...formData, prezzoPersonalizzato: e.target.value })}
                    placeholder="0.00"
                    required={formData.usaPrezzoPersonalizzato}
                    style={{ marginTop: '8px' }}
                  />
                  <p className="help-text" style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Il prezzo personalizzato sovrascrive il calcolo automatico
                  </p>
                </div>
              )}
            </div>
            <div className="form-group full-width">
              <label>Note</label>
              <textarea
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Note aggiuntive..."
                rows="3"
              />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <div className="spinner-small"></div>
                  Caricamento...
                </>
              ) : (
                editingId ? 'Salva Modifiche' : 'Aggiungi Lavoro'
              )}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
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
                  usaPrezzoPersonalizzato: false
                })
              }}
            >
              Annulla
            </button>
          </div>
        </form>
      )}

      {works.length > 0 && (
        <div className="filter-section">
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
      )}

      {error && (
        <div style={{
          background: 'var(--color-error-50)',
          color: 'var(--color-error-600)',
          padding: '12px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid var(--color-error-100)',
          fontFamily: 'var(--font-outfit)'
        }}>
          <Icon name="alert-circle" size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          Errore: {error}
        </div>
      )}

      {loading && works.length === 0 && (
        <div className="empty-state">
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--color-gray-200)',
            borderTopColor: 'var(--color-brand-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Caricamento lavori...</p>
        </div>
      )}

      <div className="works-table-container">
        {!loading && filteredWorks.length === 0 ? (
          <div className="empty-state">
            <p>
              <Icon name="file-text" size={48} className="icon-empty-state" />
            </p>
            <p>Nessun lavoro registrato</p>
            <p>Inizia aggiungendo il tuo primo lavoro!</p>
          </div>
        ) : (
          <table className="works-table">
            <thead>
              <tr>
                <th>Descrizione</th>
                <th>Data</th>
                <th>Ore Lavoro</th>
                <th>Importo</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {filteredWorks.map(work => (
                <tr key={work.id}>
                  <td>
                    <div className="work-description">
                      <div className="work-tipi-badges">
                        {(Array.isArray(work.tipi) ? work.tipi : (work.tipo ? [work.tipo] : [])).map((tipo, idx) => (
                          <span key={idx} className="work-type-badge">
                            {tipo}
                          </span>
                        ))}
                      </div>
                      <span className="work-desc-text">{work.descrizione}</span>
                    </div>
                  </td>
                  <td>{work.data}</td>
                  <td>{work.durata || '0'}</td>
                  <td className="importo-cell">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {work.importo ? `${work.importo.toFixed(2)} €` : '-'}
                      {work.usaPrezzoPersonalizzato && (
                        <span 
                          title="Prezzo personalizzato"
                          style={{ 
                            fontSize: '10px', 
                            background: 'var(--color-warning-500)', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: '600',
                            fontFamily: 'var(--font-outfit)'
                          }}
                        >
                          ⭐
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(work)}
                        title="Modifica"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(work.id)}
                        title="Elimina"
                      >
                        <Icon name="trash" size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {works.length > 0 && (
        <div className="stats-summary">
          <div className="stat-card">
            <span className="stat-value">{works.length}</span>
            <span className="stat-label">Lavori totali</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {totaleOre.toFixed(1)}
            </span>
            <span className="stat-label">Ore totali</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {new Set(works.map(w => w.data)).size}
            </span>
            <span className="stat-label">Giorni lavorati</span>
          </div>
          <div className="stat-card highlight">
            <span className="stat-value">
              {totaleImporto.toFixed(2)} €
            </span>
            <span className="stat-label">Importo totale</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkLog

