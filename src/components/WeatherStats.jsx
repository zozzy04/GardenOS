import { useState, useEffect } from 'react'
import {
  AlertCircleIcon,
  CloudIcon,
  DropletIcon,
  EyeIcon,
  GaugeIcon,
  MapPinIcon,
  RefreshCwIcon,
  Sunrise,
  Sunset,
  WindIcon,
} from 'lucide-react'
import { WEATHER_CONFIG } from '../config/weather'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2Icon } from 'lucide-react'
import { PageContainer, PageHeader, PageToolbar } from '@/components/page-layout'
import { toastError } from '@/lib/notify'

const WeatherStats = () => {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem('gardenos-location')
    return saved ? JSON.parse(saved) : { lat: null, lon: null, name: '' }
  })

  useEffect(() => {
    if (location.lat && location.lon) {
      fetchWeather()
    } else {
      requestLocation()
    }
  }, [location.lat, location.lon])

  useEffect(() => {
    if (location.lat && location.lon) {
      const interval = setInterval(fetchWeather, 600000)
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
            name: 'La tua posizione',
          }
          setLocation(newLocation)
          localStorage.setItem('gardenos-location', JSON.stringify(newLocation))
        },
        () => {
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
      const weatherResponse = await fetch(
        `${WEATHER_CONFIG.BASE_URL}/weather?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANG}`
      )

      if (!weatherResponse.ok) {
        throw new Error(`Errore API: ${weatherResponse.status}`)
      }

      const weatherData = await weatherResponse.json()

      const forecastResponse = await fetch(
        `${WEATHER_CONFIG.BASE_URL}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${WEATHER_CONFIG.API_KEY}&units=${WEATHER_CONFIG.UNITS}&lang=${WEATHER_CONFIG.LANG}`
      )

      if (!forecastResponse.ok) {
        throw new Error(`Errore API Forecast: ${forecastResponse.status}`)
      }

      const forecastData = await forecastResponse.json()

      const processedWeather = {
        temp: Math.round(weatherData.main.temp),
        feels_like: Math.round(weatherData.main.feels_like),
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        wind_speed: Math.round(weatherData.wind.speed * 3.6),
        wind_deg: weatherData.wind.deg || 0,
        clouds: weatherData.clouds.all,
        visibility: weatherData.visibility ? weatherData.visibility / 1000 : null,
        description: weatherData.weather[0].description,
        icon: weatherData.weather[0].icon,
        sunrise: new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        sunset: new Date(weatherData.sys.sunset * 1000).toLocaleTimeString('it-IT', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }

      const dailyForecasts = {}
      forecastData.list.forEach((item) => {
        const date = new Date(item.dt * 1000)
        const dayKey = date.toLocaleDateString('it-IT', { weekday: 'long' })
        const dateKey = date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })

        if (!dailyForecasts[dateKey]) {
          dailyForecasts[dateKey] = {
            day:
              dayKey === new Date().toLocaleDateString('it-IT', { weekday: 'long' })
                ? 'Oggi'
                : dateKey ===
                    new Date(Date.now() + 86400000).toLocaleDateString('it-IT', {
                      day: 'numeric',
                      month: 'short',
                    })
                  ? 'Domani'
                  : dateKey,
            temp_max: item.main.temp_max,
            temp_min: item.main.temp_min,
            icon: item.weather[0].icon,
            description: item.weather[0].description,
          }
        } else {
          dailyForecasts[dateKey].temp_max = Math.max(
            dailyForecasts[dateKey].temp_max,
            item.main.temp_max
          )
          dailyForecasts[dateKey].temp_min = Math.min(
            dailyForecasts[dateKey].temp_min,
            item.main.temp_min
          )
        }
      })

      const processedForecast = Object.values(dailyForecasts)
        .slice(0, 5)
        .map((day) => ({
          ...day,
          temp_max: Math.round(day.temp_max),
          temp_min: Math.round(day.temp_min),
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
    const fd = new FormData(e.target)
    const lat = parseFloat(fd.get('lat'))
    const lon = parseFloat(fd.get('lon'))
    const name = fd.get('name') || 'Posizione personalizzata'

    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const newLocation = { lat, lon, name }
      setLocation(newLocation)
      localStorage.setItem('gardenos-location', JSON.stringify(newLocation))
      fetchWeather()
    } else {
      toastError('Coordinate non valide. Lat: -90 a 90, Lon: -180 a 180')
    }
  }

  if (loading && !weather) {
    return (
      <PageContainer className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
        <Loader2Icon className="size-10 animate-spin text-primary" />
        <p>Caricamento dati meteo...</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageToolbar>
        <PageHeader
          title="Statistiche meteo"
          description="OpenWeather per il tuo giardino"
          icon={<CloudIcon className="size-6 text-primary" />}
        />
        <Button className="shrink-0" variant="outline" onClick={fetchWeather} disabled={loading}>
          <RefreshCwIcon />
          Aggiorna
        </Button>
      </PageToolbar>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <MapPinIcon className="size-5 text-primary" />
            Posizione giardino
          </CardTitle>
          <CardDescription>Coordinate usate per le API meteo</CardDescription>
        </CardHeader>
        <CardContent>
          {location.lat && location.lon ? (
            <div className="space-y-3">
              <p className="font-semibold">{location.name}</p>
              <p className="text-sm text-muted-foreground">
                Lat: {location.lat.toFixed(4)}, Lon: {location.lon.toFixed(4)}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setLocation({ lat: null, lon: null, name: '' })
                  localStorage.removeItem('gardenos-location')
                }}
              >
                Cambia posizione
              </Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleLocationSubmit}>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2 sm:col-span-3">
                  <Label htmlFor="loc-name">Nome posizione</Label>
                  <Input id="loc-name" type="text" name="name" placeholder="Es: Casa, Orto..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-lat">Latitudine</Label>
                  <Input
                    id="loc-lat"
                    type="number"
                    name="lat"
                    step="any"
                    placeholder="45.4642"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-lon">Longitudine</Label>
                  <Input
                    id="loc-lon"
                    type="number"
                    name="lon"
                    step="any"
                    placeholder="9.1900"
                    required
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={requestLocation}>
                  <MapPinIcon className="size-4" />
                  Usa posizione attuale
                </Button>
                <Button type="submit">Salva posizione</Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {weather && (
        <>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width={80}
                  height={80}
                  className="size-20"
                />
                <div className="text-center sm:text-left">
                  <p className="font-sans text-5xl font-bold tabular-nums">{weather.temp}°</p>
                  <p className="text-sm text-muted-foreground">
                    Percepita: {weather.feels_like}°
                  </p>
                  <p className="mt-1 capitalize text-muted-foreground">{weather.description}</p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {[
                  {
                    icon: <DropletIcon className="size-[22px]" />,
                    value: `${weather.humidity}%`,
                    label: 'Umidità',
                  },
                  {
                    icon: <WindIcon className="size-[22px]" />,
                    value: `${weather.wind_speed} km/h`,
                    label: 'Vento',
                  },
                  {
                    icon: <GaugeIcon className="size-[22px]" />,
                    value: `${weather.pressure} hPa`,
                    label: 'Pressione',
                  },
                  {
                    icon: <CloudIcon className="size-[22px]" />,
                    value: `${weather.clouds}%`,
                    label: 'Nuvolosità',
                  },
                  ...(weather.visibility
                    ? [
                        {
                          icon: <EyeIcon className="size-[22px]" />,
                          value: `${weather.visibility} km`,
                          label: 'Visibilità',
                        },
                      ]
                    : []),
                  { icon: <Sunrise className="size-[22px]" />, value: weather.sunrise, label: 'Alba' },
                  { icon: <Sunset className="size-[22px]" />, value: weather.sunset, label: 'Tramonto' },
                ].map((d) => (
                  <div
                    key={d.label}
                    className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3"
                  >
                    <span className="text-primary">
                      {d.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold tabular-nums">{d.value}</p>
                      <p className="text-xs text-muted-foreground">{d.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="font-sans mb-3 text-lg font-semibold">Previsioni 5 giorni</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {forecast.map((day, index) => (
                <Card key={index}>
                  <CardContent className="flex flex-col items-center gap-2 p-4 text-center">
                    <p className="font-medium">{day.day}</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.icon}@2x.png`}
                      alt={day.description}
                      width={50}
                      height={50}
                    />
                    <p className="text-sm tabular-nums">
                      <span className="font-semibold">{day.temp_max}°</span>
                      <span className="text-muted-foreground"> / {day.temp_min}°</span>
                    </p>
                    <p className="text-xs capitalize text-muted-foreground">{day.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </PageContainer>
  )
}

export default WeatherStats
