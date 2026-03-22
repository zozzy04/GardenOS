import { useState } from 'react'
import { useAuth } from '../hooks/useSupabase'
import { LoginForm } from '@/components/login-form'

const Login = ({ onRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()

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

      const { error: signInError } = await signIn(formData.email, formData.password)

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
    } catch (err) {
      console.error('Errore:', err)
      setError('Si è verificato un errore. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <LoginForm
      email={formData.email}
      password={formData.password}
      onEmailChange={(value) => {
        setFormData((prev) => ({ ...prev, email: value }))
        setError('')
      }}
      onPasswordChange={(value) => {
        setFormData((prev) => ({ ...prev, password: value }))
        setError('')
      }}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      onGoRegister={onRegister}
    />
  )
}

export default Login
