import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
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
      description: 'Guadagno totale',
      value: `${totalEarnings.toFixed(2)} €`,
    },
    {
      key: 'works',
      description: 'Lavori registrati',
      value: String(totalWorks),
    },
    {
      key: 'hours',
      description: 'Ore totali',
      value: totalHours.toFixed(1),
    },
    {
      key: 'avg',
      description: 'Media ore / lavoro',
      value: `${avgHoursPerWork.toFixed(1)}h`,
    },
  ]

  return (
    <div className="grid w-full min-w-0 grid-cols-1 gap-5 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((c) => (
        <Card
          key={c.key}
          className="@container/card flex h-full min-w-0 flex-col py-5 shadow-sm"
        >
          <CardHeader className="shrink-0 gap-1.5">
            <CardDescription>{c.description}</CardDescription>
            {loading ? (
              <Skeleton className="mt-1 h-9 w-28 @[250px]/card:h-10 @[250px]/card:w-32" />
            ) : (
              <CardTitle className="font-sans text-2xl font-semibold tabular-nums tracking-tight @[250px]/card:text-3xl">
                {c.value}
              </CardTitle>
            )}
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
