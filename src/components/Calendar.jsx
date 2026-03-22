import { useState, useMemo } from 'react'
import {
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useSupabase'
import { useLavori } from '../hooks/useSupabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageContainer, PageHeader, PageToolbar } from '@/components/page-layout'

const Calendar = () => {
  const { user } = useAuth()
  const { lavori } = useLavori(user?.id)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const predictions = useMemo(() => {
    const worksData = lavori
    if (!worksData || worksData.length === 0) {
      return []
    }

    const predictionsMap = {}
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const worksByType = {}
    worksData.forEach((work) => {
      const tipi = Array.isArray(work.tipi) ? work.tipi : work.tipo ? [work.tipo] : []
      tipi.forEach((tipo) => {
        if (!worksByType[tipo]) {
          worksByType[tipo] = []
        }
        const workDate = new Date(work.data.split('/').reverse().join('-'))
        worksByType[tipo].push(workDate)
      })
    })

    Object.entries(worksByType).forEach(([tipo, dates]) => {
      if (dates.length < 2) return

      dates.sort((a, b) => a - b)

      const intervals = []
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
        if (diff > 0) {
          intervals.push(diff)
        }
      }

      if (intervals.length === 0) return

      const avgInterval = Math.round(
        intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      )

      const lastDate = new Date(Math.max(...dates.map((d) => d.getTime())))
      lastDate.setHours(0, 0, 0, 0)

      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + avgInterval)

      if (nextDate >= now) {
        const key = nextDate.toISOString().split('T')[0]
        if (!predictionsMap[key]) {
          predictionsMap[key] = []
        }
        predictionsMap[key].push({
          tipo,
          avgInterval,
          lastDate: lastDate.toLocaleDateString('it-IT'),
        })
      }
    })

    return Object.entries(predictionsMap)
      .map(([date, tipi]) => ({
        date: new Date(date),
        tipi,
      }))
      .sort((a, b) => a.date - b.date)
  }, [lavori])

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const getWorksForDate = (date) => {
    if (!date || !lavori) return []
    const dateStr = date.toLocaleDateString('it-IT')
    return lavori.filter((work) => work.data === dateStr)
  }

  const getPredictionsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    const prediction = predictions.find((p) => {
      const predDateStr = p.date.toISOString().split('T')[0]
      return predDateStr === dateStr
    })
    return prediction ? prediction.tipi : []
  }

  const isToday = (date) => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date) => {
    if (!date) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const days = getDaysInMonth()
  const monthNames = [
    'Gennaio',
    'Febbraio',
    'Marzo',
    'Aprile',
    'Maggio',
    'Giugno',
    'Luglio',
    'Agosto',
    'Settembre',
    'Ottobre',
    'Novembre',
    'Dicembre',
  ]

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <PageContainer>
      <PageToolbar>
        <PageHeader
          title="Calendario lavori"
          description="Lavori completati e date previste"
          icon={<CalendarIcon className="size-7 text-primary" />}
        />
        <Button className="shrink-0" variant="outline" onClick={goToToday}>
          Oggi
        </Button>
      </PageToolbar>

      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-5 sm:p-6">
          <Button variant="outline" size="icon" onClick={prevMonth} aria-label="Mese precedente">
            <ChevronLeftIcon />
          </Button>
          <h2 className="font-sans text-lg font-semibold sm:text-xl">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <Button variant="outline" size="icon" onClick={nextMonth} aria-label="Mese successivo">
            <ChevronRightIcon />
          </Button>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm bg-secondary" aria-hidden />
          <span className="text-foreground">Lavoro completato</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm bg-chart-4/85" aria-hidden />
          <span className="text-foreground">Data prevista</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-sm border-2 border-primary" aria-hidden />
          <span className="text-foreground">Oggi</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground sm:text-sm">
            {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map((day) => (
              <div key={day} className="py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, index) => {
              const dayWorks = getWorksForDate(date)
              const dayPredictions = getPredictionsForDate(date)
              const isTodayDate = isToday(date)
              const isPastDate = isPast(date)

              return (
                <div
                  key={index}
                  className={cn(
                    'min-h-[72px] rounded-lg border border-transparent p-1 sm:min-h-[100px] sm:p-2',
                    !date && 'pointer-events-none opacity-0',
                    isTodayDate && 'border-primary bg-primary/5',
                    date && isPastDate && !isTodayDate && 'bg-muted/30'
                  )}
                >
                  {date && (
                    <>
                      <div className="text-xs font-semibold sm:text-sm">{date.getDate()}</div>
                      <div className="mt-1 space-y-0.5">
                        {dayWorks.map((work, idx) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="h-auto w-full max-w-full justify-start gap-0.5 truncate rounded-md px-1.5 py-0.5 text-[10px] font-normal sm:text-xs"
                            title={work.descrizione}
                          >
                            <CheckIcon className="size-3 shrink-0" />
                            <span className="truncate">
                              {(Array.isArray(work.tipi)
                                ? work.tipi
                                : work.tipo
                                  ? [work.tipo]
                                  : []
                              ).join(', ')}
                            </span>
                          </Badge>
                        ))}
                        {dayPredictions.map((pred, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="h-auto w-full max-w-full justify-start gap-0.5 truncate border-chart-4/50 bg-chart-4/20 px-1.5 py-0.5 text-[10px] font-normal sm:text-xs"
                            title={`Previsto: ${pred.tipo} (ultimo: ${pred.lastDate})`}
                          >
                            <ClockIcon className="size-3 shrink-0" />
                            <span className="truncate">{pred.tipo}</span>
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClockIcon className="size-5 text-primary" />
              Prossime date previste
            </CardTitle>
            <CardDescription>Basate sulla media degli intervalli tra i lavori</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {predictions.slice(0, 10).map((prediction, idx) => (
              <div
                key={idx}
                className="rounded-lg border border-border bg-muted/40 p-3"
              >
                <div className="font-medium">
                  {prediction.date.toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {prediction.tipi.map((pred, pIdx) => (
                    <Badge key={pIdx} variant="secondary">
                      {pred.tipo}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {prediction.tipi.map((pred, pIdx) => (
                    <div key={pIdx}>
                      Ultimo: {pred.lastDate} · Media: {pred.avgInterval} giorni
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageContainer>
  )
}

export default Calendar
