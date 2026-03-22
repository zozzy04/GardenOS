import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'

const PAGE_TITLES = {
  dashboard: 'Dashboard',
  lavori: 'Registro lavori',
  calendario: 'Calendario',
  spese: 'Spese condominiali',
  fattura: 'Fattura',
  meteo: 'Statistiche meteo',
  approvazioni: 'Approvazioni condomini',
  'mio-conto': 'Il mio conto',
}

const Layout = ({
  children,
  currentPage,
  onPageChange,
  user,
  onLogout,
  sidebarVariant = 'admin',
}) => {
  const title = PAGE_TITLES[currentPage] || 'GardenOS'

  return (
    <SidebarProvider
      style={{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 11)',
      }}
    >
      <AppSidebar
        currentPage={currentPage}
        onPageChange={onPageChange}
        user={user}
        onLogout={onLogout}
        navVariant={sidebarVariant}
      />
      <SidebarInset className="flex min-h-svh flex-col gap-2 overflow-hidden md:gap-3">
        <SiteHeader title={title} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
          <div className="@container/main mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 pt-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5 sm:pt-8 sm:pb-[max(1.5rem,env(safe-area-inset-bottom))] md:pt-10 md:pb-[max(1.75rem,env(safe-area-inset-bottom))] lg:px-8 lg:pt-10 lg:pb-[max(2.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default Layout
