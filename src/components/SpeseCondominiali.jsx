import { useState } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import { useSpese } from '../hooks/useSupabase'
import './SpeseCondominiali.css'

const SpeseCondominiali = () => {
  const { user } = useAuth()
  const { spese, loading, error, createSpesa, updateSpesa, deleteSpesa, uploadScontrino } = useSpese(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    oggetto: '',
    data_acquisto: new Date().toISOString().split('T')[0],
    prezzo: '',
    scontrino_file: null,
    scontrino_url: null,
    scontrino_preview: null
  })
  const [submitting, setSubmitting] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Verifica tipo file (immagine o PDF)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      alert('Formato file non supportato. Usa JPG, PNG, WEBP o PDF.')
      return
    }

    // Verifica dimensione (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File troppo grande. Dimensione massima: 10MB.')
      return
    }

    setFormData({
      ...formData,
      scontrino_file: file,
      scontrino_preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.oggetto.trim()) {
      alert('Inserisci l\'oggetto della spesa')
      return
    }
    if (!formData.prezzo || parseFloat(formData.prezzo) <= 0) {
      alert('Inserisci un prezzo valido')
      return
    }

    setSubmitting(true)
    let scontrinoUrl = formData.scontrino_url

    try {
      // Upload file se presente
      if (formData.scontrino_file) {
        setUploadingFile(true)
        const uploadResult = await uploadScontrino(formData.scontrino_file)
        if (uploadResult.error) {
          alert('Errore durante l\'upload dello scontrino: ' + uploadResult.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
        scontrinoUrl = uploadResult.url
      }

      const spesaData = {
        oggetto: formData.oggetto,
        data_acquisto: new Date(formData.data_acquisto).toLocaleDateString('it-IT'),
        prezzo: formData.prezzo,
        scontrino_url: scontrinoUrl
      }

      if (editingId) {
        const result = await updateSpesa(editingId, spesaData)
        if (result.error) {
          alert('Errore durante l\'aggiornamento: ' + result.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
      } else {
        const result = await createSpesa(spesaData)
        if (result.error) {
          alert('Errore durante la creazione: ' + result.error.message)
          setSubmitting(false)
          setUploadingFile(false)
          return
        }
      }

      // Reset form
      setFormData({
        oggetto: '',
        data_acquisto: new Date().toISOString().split('T')[0],
        prezzo: '',
        scontrino_file: null,
        scontrino_url: null,
        scontrino_preview: null
      })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      console.error('Errore:', err)
      alert('Si è verificato un errore. Riprova.')
    } finally {
      setSubmitting(false)
      setUploadingFile(false)
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Sei sicuro di voler eliminare questa spesa?')) {
      const result = await deleteSpesa(id)
      if (result.error) {
        alert('Errore durante l\'eliminazione: ' + result.error.message)
      }
    }
  }

  const handleEdit = (spesa) => {
    // Converte data da formato italiano (DD/MM/YYYY) a formato input date (YYYY-MM-DD)
    const dataParts = spesa.data_acquisto.split('/')
    const dataISO = dataParts.length === 3 ? `${dataParts[2]}-${dataParts[1]}-${dataParts[0]}` : new Date().toISOString().split('T')[0]
    
    setFormData({
      oggetto: spesa.oggetto,
      data_acquisto: dataISO,
      prezzo: spesa.prezzo.toString(),
      scontrino_file: null,
      scontrino_url: spesa.scontrino_url,
      scontrino_preview: spesa.scontrino_url && spesa.scontrino_url.match(/\.(jpg|jpeg|png|webp)$/i) ? spesa.scontrino_url : null
    })
    setEditingId(spesa.id)
    setShowForm(true)
    setTimeout(() => {
      document.querySelector('.spese-form')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const removeFile = () => {
    setFormData({
      ...formData,
      scontrino_file: null,
      scontrino_url: null,
      scontrino_preview: null
    })
  }

  // Calcola totale spese
  const totaleSpese = spese.reduce((sum, s) => sum + (s.prezzo || 0), 0)

  return (
    <div className="spese-condominiali">
      <div className="spese-header">
        <h1>
          <Icon name="shopping-cart" size={28} className="icon-inline" />
          Spese Condominiali
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
                Nuova Spesa
              </>
            )}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="spese-form" onSubmit={handleSubmit}>
          <h2>{editingId ? 'Modifica Spesa' : 'Nuova Spesa'}</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Oggetto *</label>
              <input
                type="text"
                value={formData.oggetto}
                onChange={(e) => setFormData({ ...formData, oggetto: e.target.value })}
                placeholder="Es: Gomma dell'acqua, concime, attrezzi..."
                required
              />
            </div>
            <div className="form-group">
              <label>Data Acquisto *</label>
              <input
                type="date"
                value={formData.data_acquisto}
                onChange={(e) => setFormData({ ...formData, data_acquisto: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Prezzo (€) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.prezzo}
                onChange={(e) => setFormData({ ...formData, prezzo: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Scontrino (Foto o PDF)</label>
              {formData.scontrino_preview && (
                <div className="scontrino-preview">
                  <img src={formData.scontrino_preview} alt="Anteprima scontrino" />
                  <button type="button" className="btn-remove-file" onClick={removeFile}>
                    <Icon name="x" size={16} />
                    Rimuovi
                  </button>
                </div>
              )}
              {formData.scontrino_url && !formData.scontrino_preview && (
                <div className="scontrino-existing">
                  <a href={formData.scontrino_url} target="_blank" rel="noopener noreferrer" className="scontrino-link">
                    <Icon name="file" size={16} />
                    Visualizza scontrino esistente
                  </a>
                  <button type="button" className="btn-remove-file" onClick={removeFile}>
                    <Icon name="x" size={16} />
                    Rimuovi
                  </button>
                </div>
              )}
              {!formData.scontrino_preview && !formData.scontrino_url && (
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="scontrino-upload"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="scontrino-upload" className="file-upload-label">
                    <Icon name="upload" size={20} />
                    <span>Clicca per caricare foto o PDF dello scontrino</span>
                    <span className="file-upload-hint">Formati supportati: JPG, PNG, WEBP, PDF (max 10MB)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting || uploadingFile}>
              {submitting || uploadingFile ? (
                <>
                  <div className="spinner-small"></div>
                  {uploadingFile ? 'Caricamento file...' : 'Salvataggio...'}
                </>
              ) : (
                editingId ? 'Salva Modifiche' : 'Aggiungi Spesa'
              )}
            </button>
            <button 
              type="button" 
              className="btn-secondary"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
                setFormData({
                  oggetto: '',
                  data_acquisto: new Date().toISOString().split('T')[0],
                  prezzo: '',
                  scontrino_file: null,
                  scontrino_url: null,
                  scontrino_preview: null
                })
              }}
            >
              Annulla
            </button>
          </div>
        </form>
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

      {loading && spese.length === 0 && (
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
          <p>Caricamento spese...</p>
        </div>
      )}

      <div className="spese-table-container">
        {!loading && spese.length === 0 ? (
          <div className="empty-state">
            <p>
              <Icon name="shopping-cart" size={48} className="icon-empty-state" />
            </p>
            <p>Nessuna spesa registrata</p>
            <p>Inizia aggiungendo la tua prima spesa!</p>
          </div>
        ) : (
          <table className="spese-table">
            <thead>
              <tr>
                <th>Oggetto</th>
                <th>Data Acquisto</th>
                <th>Prezzo</th>
                <th>Scontrino</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {spese.map(spesa => (
                <tr key={spesa.id}>
                  <td>{spesa.oggetto}</td>
                  <td>{spesa.data_acquisto}</td>
                  <td className="prezzo-cell">
                    {spesa.prezzo ? `${spesa.prezzo.toFixed(2)} €` : '-'}
                  </td>
                  <td>
                    {spesa.scontrino_url ? (
                      <a 
                        href={spesa.scontrino_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="scontrino-link-inline"
                      >
                        <Icon name="file" size={16} />
                        Visualizza
                      </a>
                    ) : (
                      <span className="no-scontrino">-</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEdit(spesa)}
                        title="Modifica"
                      >
                        <Icon name="edit" size={18} />
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDelete(spesa.id)}
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

      {spese.length > 0 && (
        <div className="stats-summary">
          <div className="stat-card highlight">
            <span className="stat-value">
              {totaleSpese.toFixed(2)} €
            </span>
            <span className="stat-label">Totale Spese</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{spese.length}</span>
            <span className="stat-label">Spese totali</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default SpeseCondominiali

