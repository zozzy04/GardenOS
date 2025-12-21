// Configurazione connessione diretta PostgreSQL (opzionale)
// Usa questa solo per migrazioni o script server-side
// Per l'app React, usa sempre il client Supabase da supabase.js

// Connection string PostgreSQL
// Formato: postgresql://postgres:[PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
// IMPORTANTE: Non esporre mai questa stringa nel codice frontend!
// Usa solo in ambiente server-side o per migrazioni

export const DATABASE_CONFIG = {
  connectionString: import.meta.env.DATABASE_URL || 
    'postgresql://postgres:[YOUR-PASSWORD]@db.YOUR_PROJECT_ID.supabase.co:5432/postgres',
  host: 'db.YOUR_PROJECT_ID.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  // Password: inserisci la password del database
  // La trovi su: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/database
}

// NOTA: Per l'applicazione React, usa sempre il client Supabase (supabase.js)
// Questa configurazione è solo per riferimento o per script di migrazione

