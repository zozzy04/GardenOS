import { useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/lavori': 'Registro lavori',
  '/calendario': 'Calendario',
  '/spese': 'Spese condominiali',
  '/fattura': 'Fattura',
  '/meteo': 'Statistiche meteo',
  '/approvazioni': 'Approvazioni',
  '/pwa-guida': "Installa l'app",
}

const Layout = ({
  children,
  user,
  onLogout,
  sidebarVariant = 'admin',
}) => {
  const location = useLocation()
  const condominoTitles = { '/': 'Il mio conto', '/pwa-guida': "Installa l'app" }
  const title = sidebarVariant === 'condomino'
    ? (condominoTitles[location.pathname] || 'Il mio conto')
    : (PAGE_TITLES[location.pathname] || 'GardenOS')

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 64)',
        '--header-height': 'calc(var(--spacing) * 14)',
      }}
    >
      <AppSidebar
        user={user}
        onLogout={onLogout}
        navVariant={sidebarVariant}
      />
      <SidebarInset className="flex min-h-svh flex-col overflow-hidden">
        <SiteHeader title={title} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="@container/main mx-auto w-full min-w-0 max-w-[1440px] flex-1 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pt-6 md:px-8 md:pt-8 lg:px-10 lg:pt-8">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
