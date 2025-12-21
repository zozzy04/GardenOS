import './ConfigError.css'

const ConfigError = () => {
  const configError = window.__SUPABASE_CONFIG_ERROR__

  if (!configError) return null

  return (
    <div className="config-error-overlay">
      <div className="config-error-box">
        <div className="config-error-header">
          <h2>⚠️ Configurazione Mancante</h2>
        </div>
        <div className="config-error-content">
          <p>
            Le variabili d'ambiente Supabase non sono configurate correttamente.
          </p>
          <p>
            L'applicazione non può connettersi a Supabase senza queste configurazioni.
          </p>
          
          <div className="config-error-steps">
            <h3>Passi da seguire:</h3>
            <ol>
              <li>
                Vai su <strong>Vercel Dashboard</strong> → <strong>Settings</strong> → <strong>Environment Variables</strong>
              </li>
              <li>
                Aggiungi la variabile <code>VITE_SUPABASE_URL</code> con valore:
                <br />
                <code>https://eifsqttgepbrcbdijrhx.supabase.co</code>
              </li>
              <li>
                Aggiungi la variabile <code>VITE_SUPABASE_ANON_KEY</code> con la tua anon key
                <br />
                (La trovi su: <a href="https://supabase.com/dashboard/project/eifsqttgepbrcbdijrhx/settings/api" target="_blank" rel="noopener noreferrer">Supabase Dashboard</a>)
              </li>
              <li>
                Seleziona <strong>tutti gli ambienti</strong> (Production, Preview, Development)
              </li>
              <li>
                Fai un <strong>Redeploy</strong> del progetto
              </li>
            </ol>
          </div>

          <div className="config-error-details">
            <details>
              <summary>Dettagli tecnici</summary>
              <pre>
                {JSON.stringify(configError, null, 2)}
              </pre>
            </details>
          </div>

          <div className="config-error-links">
            <a 
              href="https://github.com/zozzy04/GardenOS/blob/main/VERCEL_ENV_SETUP.md" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              📖 Guida Completa
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigError

