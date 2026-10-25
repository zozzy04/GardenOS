import { CheckCircle2Icon, ClockIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Stato di pagamento di una quota.
 * Usa i token --success / --warning invece di colori Tailwind fissi, così
 * segue il tema anche in dark mode.
 *
 * @param {{ saldataIl?: string | null, className?: string }} props
 */
export function PaymentStatusBadge({ saldataIl = null, className }) {
  const base =
    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'

  if (saldataIl) {
    const data = new Date(saldataIl).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
    return (
      <span className={cn(base, 'bg-success text-success-foreground', className)}>
        <CheckCircle2Icon className="size-3.5" aria-hidden />
        Saldata il {data}
      </span>
    )
  }

  return (
    <span className={cn(base, 'bg-warning text-warning-foreground', className)}>
      <ClockIcon className="size-3.5" aria-hidden />
      Da pagare
    </span>
  )
}
