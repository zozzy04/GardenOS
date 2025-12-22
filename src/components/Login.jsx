import { useState } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import './Login.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

  // Email e password ammesse (opzionali): se le imposti, solo queste potranno accedere
  const allowedEmail = import.meta.env.VITE_ADMIN_EMAIL || null
  const allowedPassword = import.meta.env.VITE_ADMIN_PASSWORD || null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.email || !formData.password) {
        setError('Compila tutti i campi obbligatori')
        setLoading(false)
        return
      }

      // Se è configurata una email ammessa, blocca tutte le altre
      if (allowedEmail && formData.email.trim().toLowerCase() !== allowedEmail.trim().toLowerCase()) {
        setError('Accesso non autorizzato per questa email')
        setLoading(false)
        return
      }

      // Se è configurata una password ammessa, blocca tutte le altre
      if (allowedPassword && formData.password !== allowedPassword) {
        setError('Password non corretta')
        setLoading(false)
        return
      }

      const { data, error: signInError } = await signIn(formData.email, formData.password)
      
      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Email o password non corretti')
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Verifica la tua email prima di accedere')
        } else {
          setError(signInError.message || 'Errore durante il login')
        }
        setLoading(false)
        return
      }
      // Login riuscito - useAuth gestisce la sessione
    } catch (err) {
      console.error('Errore:', err)
      setError('Si è verificato un errore. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <Icon name="leaf" size={48} className="login-logo" />
          <h1>GardenOS</h1>
          <p className="login-subtitle">Accedi al tuo account</p>
        </div>

        {error && (
          <div className="login-error">
            <Icon name="alert-circle" size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>
              <Icon name="mail" size={16} />
              Email *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Inserisci la tua email"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>
              <Icon name="lock" size={16} />
              Password *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Inserisci la password"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Caricamento...
              </>
            ) : (
              <>
                <Icon name="log-in" size={18} />
                Accedi
              </>
            )}
          </button>
        </form>

        <div className="login-powered-by">
          <p>Powered by <strong>Riccardo Zozzolotto</strong></p>
        </div>
      </div>
    </div>
  )
}

export default Login

