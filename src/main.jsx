import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import './index.css'
import App from './App.jsx'
import { Toaster } from '@/components/ui/sonner'
import { ascoltaInstallPrompt } from '@/hooks/use-install-prompt'
import { TooltipProvider } from '@/components/ui/tooltip'

// Prima del render: l'evento di installabilità arriva presto e una volta sola
ascoltaInstallPrompt()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider delayDuration={0}>
        <App />
        <Toaster position="top-center" richColors closeButton />
      </TooltipProvider>
    </ThemeProvider>
  </StrictMode>,
)
