import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import WorkLog from './components/WorkLog'
import History from './components/History'
import Calendar from './components/Calendar'
import WeatherStats from './components/WeatherStats'
import Invoice from './components/Invoice'
import ConfigError from './components/ConfigError'
import { useAuth } from './hooks/useSupabase'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const { user, loading, signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    setCurrentPage('dashboard')
  }

  // Mostra loading durante il check della sessione
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'var(--font-outfit)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--color-gray-200)',
            borderTopColor: 'var(--color-brand-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p>Caricamento...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'lavori':
        return <WorkLog />
      case 'storico':
        return <History />
      case 'calendario':
        return <Calendar />
      case 'fattura':
        return <Invoice />
      case 'meteo':
        return <WeatherStats />
      default:
        return <Dashboard />
    }
  }

  if (!user) {
    return <Login />
  }

  // Prepara userData per Layout (compatibilità)
  const userData = {
    id: user.id,
    email: user.email,
    username: user.user_metadata?.username || user.email?.split('@')[0] || 'Utente',
    ...user.user_metadata
  }

  return (
    <>
      <ConfigError />
      <Layout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        user={userData}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    </>
  )
}

export default App
