// Configurazione API Meteo
// Per usare l'API reale di OpenWeatherMap:
// 1. Registrati su https://openweathermap.org/api
// 2. Ottieni la tua API key gratuita
// 3. Sostituisci 'YOUR_API_KEY' con la tua chiave
// 4. Decommenta il codice in WeatherStats.jsx e usa questa configurazione

export const WEATHER_CONFIG = {
  API_KEY: '2078913ab8c4e1195f528c0702a7c98c',
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  UNITS: 'metric', // metric, imperial, kelvin
  LANG: 'it' // Lingua per le descrizioni
}

// Esempio di chiamata API:
// const response = await fetch(
//   `${WEATHER_CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANG}`
// )

