import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import { FullScreenLoader } from './components/full-screen-loader'
import { AuthShell } from '@/components/auth-shell'
import Login from './components/Login'
import { Register } from './components/Register'
import Dashboard from './components/Dashboard'
import WorkLog from './components/WorkLog'
import Calendar from './components/Calendar'
import WeatherStats from './components/WeatherStats'
import Invoice from './components/Invoice'
import SpeseCondominiali from './components/SpeseCondominiali'
import MioConto from './components/MioConto'
import { AdminApprovals } from './components/AdminApprovals'
import ConfigError from './components/ConfigError'
import {
  ProfileMissing,
  PendingApproval,
  AccessRejected,
} from './components/ProfileGateScreens'
import { useAuth } from './hooks/useSupabase'
import { useProfile } from './hooks/useProfile'
import { Button } from '@/components/ui/button'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [authView, setAuthView] = useState('login')
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, famiglia, loading: profileLoading, error: profileError } = useProfile(user)

  useEffect(() => {
    if (!user) {
      setAuthView('login')
      setCurrentPage('dashboard')
    }
  }, [user])

  const handleLogout = async () => {
    await signOut()
    setCurrentPage('dashboard')
  }

  if (authLoading) {
    return <FullScreenLoader message="Caricamento..." />
  }

  if (!user) {
    if (authView === 'register') {
      return <Register onBack={() => setAuthView('login')} />
    }
    return <Login onRegister={() => setAuthView('register')} />
  }

  if (profileLoading) {
    return <FullScreenLoader message="Caricamento profilo..." />
  }

  if (profileError) {
    return (
      <AuthShell>
        <div className="w-full max-w-md space-y-4 rounded-xl border border-border/80 bg-card/95 p-5 shadow-lg backdrop-blur-sm sm:p-6">
          <p className="text-balance text-center text-sm leading-relaxed text-destructive">
            Errore nel caricamento del profilo: {profileError}
          </p>
          <Button className="h-11 w-full sm:h-10" variant="outline" onClick={() => signOut()}>
            Esci
          </Button>
        </div>
      </AuthShell>
    )
  }

  if (!profile) {
    return <ProfileMissing onLogout={handleLogout} />
  }

  if (profile.approval_status === 'pending') {
    return <PendingApproval onLogout={handleLogout} />
  }

  if (profile.approval_status === 'rejected') {
    return <AccessRejected onLogout={handleLogout} />
  }

  const isApprovedAdmin = profile.role === 'admin'

  const userData = {
    id: user.id,
    email: user.email,
    username:
      profile.display_name?.trim() ||
      user.user_metadata?.username ||
      user.email?.split('@')[0] ||
      'Utente',
  }

  if (isApprovedAdmin) {
    const renderAdminPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <Dashboard />
        case 'lavori':
          return <WorkLog />
        case 'calendario':
          return <Calendar />
        case 'spese':
          return <SpeseCondominiali />
        case 'fattura':
          return <Invoice />
        case 'meteo':
          return <WeatherStats />
        case 'approvazioni':
          return <AdminApprovals />
        default:
          return <Dashboard />
      }
    }

    return (
      <>
        <ConfigError />
        <Layout
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          user={userData}
          onLogout={handleLogout}
          sidebarVariant="admin"
        >
          {renderAdminPage()}
        </Layout>
      </>
    )
  }

  return (
    <>
      <ConfigError />
      <Layout
        currentPage="mio-conto"
        onPageChange={setCurrentPage}
        user={userData}
        onLogout={handleLogout}
        sidebarVariant="condomino"
      >
        <MioConto highlightFamigliaNome={famiglia?.nome ?? null} />
      </Layout>
    </>
  )
}

export default App
