// Configurazione API Meteo (OpenWeatherMap)
// La chiave sta in .env come VITE_OPENWEATHER_API_KEY — mai nel codice sorgente.
// Chiave gratuita: https://openweathermap.org/api
//
// NOTA: essendo una SPA, la chiave finisce comunque nel bundle servito al browser.
// Limita il suo utilizzo dal pannello OpenWeatherMap (rate limit / referrer).

export const WEATHER_CONFIG = {
  API_KEY: (import.meta.env.VITE_OPENWEATHER_API_KEY || '').trim(),
  BASE_URL: 'https://api.openweathermap.org/data/2.5',
  UNITS: 'metric', // metric, imperial, kelvin
  LANG: 'it', // Lingua per le descrizioni
}

export const isWeatherConfigured = WEATHER_CONFIG.API_KEY.length > 0
