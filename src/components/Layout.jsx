import { useState, useEffect } from 'react'
import Icon from './Icons'
import './Layout.css'

const Layout = ({ children, currentPage, onPageChange, user, onLogout }) => {
  // Su mobile, la sidebar parte chiusa
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 768
    }
    return true
  })

  // Gestisce il resize della finestra
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // Su desktop, mantieni aperta
        setSidebarOpen(true)
      } else {
        // Su mobile, chiudi
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    { id: 'dashboard', icon: 'gauge', label: 'Dashboard' },
    { id: 'lavori', icon: 'clipboard', label: 'Nuovo Lavoro' },
    { id: 'calendario', icon: 'calendar', label: 'Calendario' },
    { id: 'spese', icon: 'shopping-cart', label: 'Spese Condominiali' },
    { id: 'fattura', icon: 'receipt', label: 'Fattura' },
    { id: 'meteo', icon: 'cloud', label: 'Statistiche Meteo' }
  ]

  const handlePageChange = (pageId) => {
    onPageChange(pageId)
    // Chiudi sidebar su mobile dopo la selezione
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <div className="layout">
      {/* Overlay per mobile quando sidebar è aperta */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>
            <Icon name="leaf" size={24} className="icon-inline" />
            GardenOS
          </h2>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <Icon name="chevron-left" size={16} /> : <Icon name="chevron-right" size={16} />}
          </button>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
              onClick={() => handlePageChange(item.id)}
            >
              <span className="nav-icon">
                <Icon name={item.icon} size={20} />
              </span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {user && (
          <div className={`sidebar-footer ${!sidebarOpen ? 'closed' : ''}`}>
            {sidebarOpen && (
              <>
                <div className="user-info">
                  <Icon name="user" size={16} />
                  <span className="user-name">{user.username}</span>
                </div>
                <button
                  className="btn-logout"
                  onClick={onLogout}
                  title="Logout"
                >
                  <Icon name="log-out" size={18} />
                  <span>Logout</span>
                </button>
              </>
            )}
            {!sidebarOpen && (
              <button
                className="btn-logout-icon"
                onClick={onLogout}
                title="Logout"
              >
                <Icon name="log-out" size={20} />
              </button>
            )}
          </div>
        )}
        
        <div className={`sidebar-powered-by ${!sidebarOpen ? 'closed' : ''}`}>
          {sidebarOpen && (
            <p>Powered by <strong>Riccardo Zozzolotto</strong></p>
          )}
        </div>
      </aside>
      <main className="main-content">
        {/* Hamburger button per mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={() => setSidebarOpen(true)}
          aria-label="Apri menu"
        >
          <Icon name="menu" size={24} />
        </button>
        {children}
      </main>
    </div>
  )
}

export default Layout

