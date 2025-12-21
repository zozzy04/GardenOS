# 🌱 GardenOS

Sistema operativo per la gestione completa del tuo giardino. Dashboard moderna e interattiva per tracciare i lavori, generare fatture e monitorare le condizioni meteo in tempo reale.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.89-green.svg)](https://supabase.com/)

## 📋 Indice

- [Funzionalità](#-funzionalità-principali)
- [Screenshot](#-screenshot)
- [Installazione](#-installazione)
- [Configurazione](#-configurazione)
- [Deploy](#-deploy)
- [Tecnologie](#-tecnologie-utilizzate)
- [Licenza](#-licenza)

## ✨ Funzionalità Principali

### 📝 Registro Lavori Giardino
- **Tabella completa** per registrare tutti i lavori svolti
- **Form di inserimento** con:
  - Data del lavoro
  - Tipo di lavoro (Potatura, Semina, Trapianto, Irrigazione, Concimazione, Diserbo, Raccolta, Pulizia, Altro)
  - Descrizione dettagliata
  - Durata in minuti
  - Note aggiuntive
- **Filtri** per tipo di lavoro
- **Modifica ed eliminazione** dei lavori registrati
- **Esportazione CSV** per backup e analisi
- **Statistiche** (lavori totali, minuti totali, giorni lavorati)
- **Persistenza dati** con localStorage (accessibile da qualsiasi dispositivo)

### 🌤️ Statistiche Meteo
- **Dati meteo in tempo reale** per la posizione del tuo giardino
- **Geolocalizzazione automatica** o inserimento manuale coordinate
- **Informazioni complete**:
  - Temperatura attuale e percepita
  - Umidità, vento, pressione
  - Nuvolosità e visibilità
  - Orari alba e tramonto
- **Previsioni 5 giorni** con temperature min/max
- **Aggiornamento automatico** ogni 10 minuti
- **Posizione salvata** per accesso rapido

## 🚀 Installazione

### Prerequisiti

- Node.js 18+ e npm
- Un account Supabase (gratuito)

### Setup Locale

1. **Clona il repository**
   ```bash
   git clone https://github.com/TUO_USERNAME/gardenos.git
   cd gardenos
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```
   
   Poi modifica `.env` e inserisci le tue credenziali Supabase:
   - `VITE_SUPABASE_URL`: URL del tuo progetto Supabase
   - `VITE_SUPABASE_ANON_KEY`: Anon key del tuo progetto Supabase

4. **Configura Supabase**
   - Crea un progetto su [Supabase](https://supabase.com)
   - Esegui lo script SQL in `supabase-schema.sql` nel SQL Editor
   - Configura l'autenticazione (vedi `SUPABASE_SETUP.md`)

5. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

## 🛠️ Sviluppo

Avvia il server di sviluppo:

```bash
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:5173`

## 📦 Build per Produzione

Per creare una build di produzione ottimizzata:

```bash
npm run build
```

I file saranno generati nella cartella `dist/`

## 🌐 Deploy e Accesso da Qualsiasi Dispositivo

### Opzioni di Deploy

1. **Vercel** (Consigliato - Gratuito)
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Netlify**
   - Collega il repository GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **GitHub Pages**
   - Aggiungi `base: '/gardenos'` in `vite.config.js`
   - Usa il plugin `vite-plugin-gh-pages`

4. **Server Proprio**
   - Carica la cartella `dist` su un server web
   - Configura HTTPS per geolocalizzazione

### Accesso Mobile

L'app è completamente responsive e funziona su:
- 📱 Smartphone (iOS/Android)
- 📱 Tablet
- 💻 Desktop
- 🌐 Browser moderni

## ⚙️ Configurazione API Meteo

Per usare dati meteo reali invece dei dati mock:

1. Registrati su [OpenWeatherMap](https://openweathermap.org/api) (gratuito)
2. Ottieni la tua API key
3. Modifica `src/config/weather.js` e inserisci la tua API key
4. In `src/components/WeatherStats.jsx`, decommenta il codice per l'API reale

```javascript
// In WeatherStats.jsx, sostituisci la sezione mock con:
const API_KEY = 'YOUR_API_KEY' // Da weather.js
const response = await fetch(
  `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${API_KEY}&units=metric&lang=it`
)
const data = await response.json()
```

## 💾 Persistenza Dati

I dati sono salvati su **Supabase** (PostgreSQL):
- ✅ Sincronizzazione multi-dispositivo in tempo reale
- ✅ Dati persistenti nel cloud
- ✅ Accessibile da qualsiasi dispositivo
- ✅ Row Level Security (RLS) per la sicurezza dei dati
- ✅ Backup automatico

**Nota**: Per la configurazione completa di Supabase, vedi `SUPABASE_SETUP.md`

## 🎨 Caratteristiche UI

- **Design Professionale**: Interfaccia ispirata a TailAdmin con design system completo
- **Icone SVG**: Icone professionali e scalabili
- **Responsive**: Ottimizzato per tutti i dispositivi
- **Sidebar Collassabile**: Navigazione laterale adattiva
- **Animazioni Fluide**: Transizioni e hover effects
- **Accessibilità**: Interfaccia intuitiva e facile da usare

## 📁 Struttura Progetto

```
src/
├── components/
│   ├── Layout.jsx          # Layout principale con sidebar
│   ├── WorkLog.jsx         # Registro lavori giardino
│   ├── WeatherStats.jsx    # Statistiche meteo
│   ├── SensorCard.jsx      # Card sensori (legacy)
│   ├── IrrigationControl.jsx # Controllo irrigazione (legacy)
│   └── StatsChart.jsx      # Grafici statistiche (legacy)
├── config/
│   └── weather.js          # Configurazione API meteo
├── App.jsx                  # Componente principale con routing
└── main.jsx                 # Entry point
```

## 🔮 Prossimi Sviluppi

- [ ] Integrazione API meteo reale (OpenWeatherMap)
- [ ] Sincronizzazione cloud per multi-dispositivo
- [ ] Notifiche push per eventi meteo importanti
- [ ] Calendario attività e promemoria
- [ ] Foto associate ai lavori
- [ ] Grafici statistiche lavori nel tempo
- [ ] Export PDF dei report
- [ ] Modalità offline avanzata (PWA)

## 🛠️ Tecnologie Utilizzate

- **React 19** - Libreria UI moderna
- **Vite** - Build tool veloce
- **CSS3** - Styling moderno con CSS puro
- **localStorage** - Persistenza dati client-side
- **Geolocation API** - Rilevamento posizione

## 📝 Licenza

Questo progetto è rilasciato sotto licenza MIT. Vedi il file [LICENSE](LICENSE) per i dettagli.

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Committa le tue modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Pusha sul branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📧 Supporto

Per problemi, domande o suggerimenti:
- Apri una [issue](https://github.com/TUO_USERNAME/gardenos/issues) su GitHub
- Controlla la [documentazione](https://github.com/TUO_USERNAME/gardenos/wiki)

## 👤 Autore

**Riccardo Zozzolotto**

- Website: [riccardozozzolotto.com](https://riccardozozzolotto.com)
- GitHub: [@tuo-username](https://github.com/tuo-username)

## 🙏 Ringraziamenti

- [Supabase](https://supabase.com) per il backend gratuito
- [React](https://reactjs.org) per il framework UI
- [Vite](https://vitejs.dev) per il build tool
- [TailAdmin](https://tailadmin.com) per l'ispirazione del design
