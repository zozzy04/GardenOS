import { useState, useEffect } from 'react'
import Icon from './Icons'
import { WEATHER_CONFIG } from '../config/weather'
import './WeatherStats.css'

const WeatherStats = () => {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('gardenos-location')
    return saved ? JSON.parse(saved) : { lat: null, lon: null, name: '' }
  })

  // Carica posizione salvata o richiedi geolocalizzazione
  useEffect(() => {
    if (location.lat && location.lon) {
      fetchWeather()
    } else {
      requestLocation()
    }
  }, [location.lat, location.lon])

  // Aggiorna meteo ogni 10 minuti
  useEffect(() => {
    if (location.lat && location.lon) {
      const interval = setInterval(fetchWeather, 600000) // 10 minuti
      return () => clearInterval(interval)
    }
  }, [location.lat, location.lon])

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            name: 'La tua posizione'
          }
          setLocation(newLocation)
          localStorage.setItem('gardenos-location', JSON.stringify(newLocation))
        },
        (err) => {
          setError('Impossibile ottenere la posizione. Inserisci manualmente le coordinate.')
          setLoading(false)
        }
      )
    } else {
      setError('Geolocalizzazione non supportata. Inserisci manualmente le coordinate.')
      setLoading(false)
    }
  }

  const fetchWeather = async () => {
    if (!location.lat || !location.lon) return

    setLoading(true)
    setError(null)

    try {
      // Chiamata API per dati meteo attuali
      const weatherResponse = await fetch(
        `${WEATHER_CONFIG.BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANG}`
      )

      if (!weatherResponse.ok) {
        throw new Error(`Errore API: ${weatherResponse.status}`)
      }

      const weatherData = await weatherResponse.json()

      // Chiamata API per previsioni a 5 giorni
      const forecastResponse = await fetch(
        `${WEATHER_CONFIG.BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANG}`
      )

      if (!forecastResponse.ok) {
        throw new Error(`Errore API Forecast: ${forecastResponse.status}`)
      }

      const forecastData = await forecastResponse.json()

      // Processa dati meteo attuali
      const processedWeather = {
        temp: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        wind_speed: Math.round(weatherData.wind.speed * 3.6), // Converti m/s in km/h
        wind_deg: weatherData.wind.deg || 0,
        clouds: weatherData.clouds.all,
        visibility: weatherData.visibility ? (weatherData.visibility / 1000) : null,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
      }

      // Processa previsioni a 5 giorni (raggruppa per giorno e prendi min/max)
      const dailyForecasts = {}
      forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000)
        const dayKey = date.toLocaleDateString('it-IT', { weekday: 'long' })
        const dateKey = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
        
        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = {
            day: dayKey === new Date().toLocaleDateString('it-IT', { weekday: 'long' }) ? 'Oggi' : 
                  dateKey === new Date(Date.now() + 86400000).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) ? 'Domani' : dateKey,
            temp_max: item.main.temp_max,
            temp_min: item.main.temp_min,
            icon: item.weather[0].icon,
            description: item.weather[0].description
          }
        } else {
          dailyForecasts[dateKey].temp_max = Math.max(dailyForecasts[dateKey].temp_max, item.main.temp_max)
          dailyForecasts[dateKey].temp_min = Math.min(dailyForecasts[dateKey].temp_min, item.main.temp_min)
        }
      })

      const processedForecast = Object.values(dailyForecasts).slice(0, 5).map(day => ({
        ...day,
        temp_max: Math.round(day.temp_max),
        temp_min: Math.round(day.temp_min)
      }))

      setWeather(processedWeather)
      setForecast(processedForecast)
      setLoading(false)
    } catch (err) {
      console.error('Errore fetch meteo:', err)
      setError(`Errore nel caricamento dei dati meteo: ${err.message}`)
      setLoading(false)
    }
  }

  const handleLocationSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const lat = parseFloat(formData.get('lat'))
    const lon = parseFloat(formData.get('lon'))
    const name = formData.get('name') || 'Posizione personalizzata'

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const newLocation = { lat, lon, name }
      setLocation(newLocation)
      localStorage.setItem('giardino-location', JSON.stringify(newLocation))
      fetchWeather()
    } else {
      alert('Coordinate non valide. Lat: -90 a 90, Lon: -180 a 180')
    }
  }

  if (loading && !weather) {
    return (
      <div className="weather-stats">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Caricamento dati meteo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="weather-stats">
      <div className="weather-header">
        <h1>
          <Icon name="cloud" size={28} className="icon-inline" />
          Statistiche Meteo
        </h1>
        <button 
          className="btn-refresh"
          onClick={fetchWeather}
          disabled={loading}
        >
          <Icon name="refresh" size={16} />
          Aggiorna
        </button>
      </div>

      {error && (
        <div className="error-message">
          <Icon name="alert-circle" size={18} className="icon-inline" />
          {error}
        </div>
      )}

      <div className="location-section">
        <h2>
          <Icon name="map-pin" size={20} className="icon-inline" />
          Posizione Giardino
        </h2>
        {location.lat && location.lon ? (
          <div className="location-info">
            <p><strong>{location.name}</strong></p>
            <p>Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}</p>
            <button 
              className="btn-change-location"
              onClick={() => setLocation({ lat: null, lon: null, name: '' })}
            >
              Cambia Posizione
            </button>
          </div>
        ) : (
          <form className="location-form" onSubmit={handleLocationSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nome Posizione</label>
                <input type="text" name="name" placeholder="Es: Casa, Orto..." />
              </div>
              <div className="form-group">
                <label>Latitudine</label>
                <input type="number" name="lat" step="any" placeholder="45.4642" required />
              </div>
              <div className="form-group">
                <label>Longitudine</label>
                <input type="number" name="lon" step="any" placeholder="9.1900" required />
              </div>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={requestLocation}>
                <Icon name="map-pin" size={16} />
                Usa Posizione Attuale
              </button>
              <button type="submit" className="btn-primary">Salva Posizione</button>
            </div>
          </form>
        )}
      </div>

      {weather && (
        <>
          <div className="current-weather">
            <div className="weather-main">
              <div className="weather-icon">
                <img 
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  style={{ width: '80px', height: '80px' }}
                />
              </div>
              <div className="weather-temp">
                <span className="temp-value">{weather.temp}°</span>
                <span className="temp-feels">Percepita: {weather.feels_like}°</span>
                <span className="weather-desc">{weather.description}</span>
              </div>
            </div>

            <div className="weather-details-grid">
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="droplet" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.humidity}%</span>
                  <span className="detail-label">Umidità</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="wind" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.wind_speed} km/h</span>
                  <span className="detail-label">Vento</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="gauge" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.pressure} hPa</span>
                  <span className="detail-label">Pressione</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="cloudy" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.clouds}%</span>
                  <span className="detail-label">Nuvolosità</span>
                </div>
              </div>
              {weather.visibility && (
                <div className="weather-detail-card">
                  <span className="detail-icon">
                    <Icon name="eye" size={24} />
                  </span>
                  <div>
                    <span className="detail-value">{weather.visibility} km</span>
                    <span className="detail-label">Visibilità</span>
                  </div>
                </div>
              )}
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="sunrise" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.sunrise}</span>
                  <span className="detail-label">Alba</span>
                </div>
              </div>
              <div className="weather-detail-card">
                <span className="detail-icon">
                  <Icon name="sunset" size={24} />
                </span>
                <div>
                  <span className="detail-value">{weather.sunset}</span>
                  <span className="detail-label">Tramonto</span>
                </div>
              </div>
            </div>
          </div>

          <div className="forecast-section">
            <h2>Previsioni 5 Giorni</h2>
            <div className="forecast-grid">
              {forecast.map((day, index) => (
                <div key={index} className="forecast-card">
                  <div className="forecast-day">{day.day}</div>
                  <div className="forecast-icon">
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.description}
                      style={{ width: '50px', height: '50px' }}
                    />
                  </div>
                  <div className="forecast-temps">
                    <span className="temp-max">{day.temp_max}°</span>
                    <span className="temp-min">{day.temp_min}°</span>
                  </div>
                  <div className="forecast-desc">{day.description}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default WeatherStats

