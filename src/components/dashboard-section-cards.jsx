import {
  BanknoteIcon,
  BriefcaseIcon,
  ClockIcon,
  TrendingUpIcon,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardSectionCards({
  totalEarnings,
  totalWorks,
  totalHours,
  loading,
}) {
  const avgHoursPerWork = totalWorks > 0 ? totalHours / totalWorks : 0

  const cards = [
    {
      key: 'earnings',
      label: 'Guadagno totale',
      value: `${totalEarnings.toFixed(2)} €`,
      icon: BanknoteIcon,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    },
    {
      key: 'works',
      label: 'Lavori registrati',
      value: String(totalWorks),
      icon: BriefcaseIcon,
      accent: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 dark:bg-sky-500/15',
    },
    {
      key: 'hours',
      label: 'Ore totali',
      value: totalHours.toFixed(1),
      icon: ClockIcon,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 dark:bg-amber-500/15',
    },
    {
      key: 'avg',
      label: 'Media ore / lavoro',
      value: `${avgHoursPerWork.toFixed(1)}h`,
      icon: TrendingUpIcon,
      accent: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10 dark:bg-violet-500/15',
    },
  ]

  return (
    <div className="grid w-full min-w-0 grid-cols-2 gap-3 sm:gap-4 @xl/main:grid-cols-2 @3xl/main:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card
            key={c.key}
            className="relative overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
              <div className={`flex size-9 items-center justify-center rounded-lg ${c.bg} sm:size-10`}>
                <Icon className={`size-[1.125rem] sm:size-5 ${c.accent}`} strokeWidth={1.75} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-muted-foreground sm:text-[0.8125rem]">
                  {c.label}
                </p>
                {loading ? (
                  <Skeleton className="mt-1 h-7 w-20 sm:h-8 sm:w-24" />
                ) : (
                  <p className="font-heading text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
                    {c.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
