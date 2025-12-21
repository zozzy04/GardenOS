import { useState } from 'react'
import Icon from './Icons'
import { useAuth } from '../hooks/useSupabase'
import './Login.css'

const Login = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        // Login con Supabase - usa EMAIL (non username)
        if (!formData.email || !formData.password) {
          setError('Compila tutti i campi obbligatori')
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

        // Login riuscito - useAuth gestirà automaticamente la sessione
      } else {
        // Registrazione con Supabase
        if (!formData.username || !formData.password || !formData.email) {
          setError('Compila tutti i campi obbligatori')
          setLoading(false)
          return
        }

        if (formData.password.length < 6) {
          setError('La password deve essere di almeno 6 caratteri')
          setLoading(false)
          return
        }

        if (formData.password !== formData.confirmPassword) {
          setError('Le password non corrispondono')
          setLoading(false)
          return
        }

        const { data, error: signUpError } = await signUp(formData.email, formData.password, {
          username: formData.username
        })

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Email già registrata')
          } else {
            setError(signUpError.message || 'Errore durante la registrazione')
          }
          setLoading(false)
          return
        }

        // Registrazione riuscita
        setError('')
        setError('Registrazione completata! Puoi ora accedere.')
        setIsLogin(true)
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          email: formData.email // Mantieni l'email per facilitare il login
        })
      }
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
          <p className="login-subtitle">
            {isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}
          </p>
        </div>

        {error && (
          <div className="login-error">
            <Icon name="alert-circle" size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>
                <Icon name="user" size={16} />
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Inserisci il tuo username"
                required
                autoComplete="username"
              />
            </div>
          )}

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
              placeholder={isLogin ? "Inserisci la password" : "Minimo 6 caratteri"}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={isLogin ? undefined : 6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>
                <Icon name="lock" size={16} />
                Conferma Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Ripeti la password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

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
                <Icon name={isLogin ? "log-in" : "user-plus"} size={18} />
                {isLogin ? 'Accedi' : 'Registrati'}
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <button
            type="button"
            className="btn-switch"
            onClick={() => {
              setIsLogin(!isLogin)
              setError('')
              setFormData({
                username: '',
                password: '',
                confirmPassword: '',
                email: ''
              })
            }}
          >
            {isLogin ? (
              <>
                Non hai un account? <strong>Registrati</strong>
              </>
            ) : (
              <>
                Hai già un account? <strong>Accedi</strong>
              </>
            )}
          </button>
        </div>
        
        <div className="login-powered-by">
          <p>Powered by <strong>Riccardo Zozzolotto</strong></p>
        </div>
      </div>
    </div>
  )
}

export default Login

