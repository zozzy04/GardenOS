import { useState, useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import { FullScreenLoader } from './components/full-screen-loader'
import { AuthShell } from '@/components/auth-shell'
import Login from './components/Login'
import { Register } from './components/Register'
import ConfigError from './components/ConfigError'
import {
  ProfileMissing,
  PendingApproval,
  AccessRejected,
} from './components/ProfileGateScreens'
import { useAuth } from './hooks/useSupabase'
import { useProfile } from './hooks/useProfile'
import { Button } from '@/components/ui/button'

const Dashboard = lazy(() => import('./components/Dashboard'))
const WorkLog = lazy(() => import('./components/WorkLog'))
const Calendar = lazy(() => import('./components/Calendar'))
const SpeseCondominiali = lazy(() => import('./components/SpeseCondominiali'))
const Invoice = lazy(() => import('./components/Invoice'))
const WeatherStats = lazy(() => import('./components/WeatherStats'))
const AdminApprovals = lazy(() => import('./components/AdminApprovals').then(m => ({ default: m.AdminApprovals })))
const MioConto = lazy(() => import('./components/MioConto'))
const PwaGuide = lazy(() => import('./components/PwaGuide'))

function PageLoader() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
    </div>
  )
}

function App() {
  const [authView, setAuthView] = useState('login')
  const { user, loading: authLoading, signOut } = useAuth()
  const { profile, famiglia, loading: profileLoading, error: profileError } = useProfile(user)

  useEffect(() => {
    if (!user) {
      setAuthView('login')
    }
  }, [user])

  const handleLogout = async () => {
    await signOut()
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

  return (
    <BrowserRouter>
      <ConfigError />
      <Layout
        user={userData}
        onLogout={handleLogout}
        sidebarVariant={isApprovedAdmin ? 'admin' : 'condomino'}
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {isApprovedAdmin ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lavori" element={<WorkLog />} />
                <Route path="/calendario" element={<Calendar />} />
                <Route path="/spese" element={<SpeseCondominiali />} />
                <Route path="/fattura" element={<Invoice />} />
                <Route path="/meteo" element={<WeatherStats />} />
                <Route path="/approvazioni" element={<AdminApprovals />} />
                <Route path="/pwa-guida" element={<PwaGuide />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<MioConto highlightFamigliaNome={famiglia?.nome ?? null} />} />
                <Route path="/pwa-guida" element={<PwaGuide />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}

export default App
