import { CheckCircle2Icon, DownloadIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatEuro } from '@/lib/format'
import { cn } from '@/lib/utils'

/**
 * La domanda per cui un condòmino apre l'app è «quanto devo?».
 * Questo blocco risponde prima di tutto il resto; lo storico viene dopo.
 *
 * @param {object} props
 * @param {number} props.daPagare — somma delle quote non ancora saldate
 * @param {number} props.quoteAperte — quante fatture restano da saldare
 * @param {number} props.totaleVersato
 * @param {number} props.fattureTotali
 * @param {string | null} [props.ultimoPeriodo] — già formattato
 * @param {() => void} [props.onScaricaUltima]
 */
export function AccountBalanceHero({
  daPagare,
  quoteAperte,
  totaleVersato,
  fattureTotali,
  ultimoPeriodo = null,
  onScaricaUltima,
}) {
  const inPari = quoteAperte === 0

  return (
    <Card
      className={cn(
        'overflow-hidden border-2',
        inPari ? 'border-success/35 bg-success/5' : 'border-warning/45 bg-warning/5'
      )}
    >
      <CardContent className="p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {inPari ? (
              <>
                <p className="flex items-center gap-2 text-sm font-medium text-success">
                  <CheckCircle2Icon className="size-4" aria-hidden />
                  Sei in pari
                </p>
                <p className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                  Nessuna quota da saldare
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-muted-foreground">Da pagare</p>
                <p className="mt-2 font-heading text-5xl font-bold tracking-tight tabular-nums sm:text-6xl">
                  {formatEuro(daPagare)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {quoteAperte} {quoteAperte === 1 ? 'fattura' : 'fatture'} da saldare
                  {ultimoPeriodo ? ` · ultima al ${ultimoPeriodo}` : ''}
                </p>
              </>
            )}
          </div>

          {onScaricaUltima && fattureTotali > 0 && (
            <Button
              variant={inPari ? 'outline' : 'default'}
              onClick={onScaricaUltima}
              className="shrink-0"
            >
              <DownloadIcon />
              Ultima fattura
            </Button>
          )}
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-5 sm:gap-6">
          <div>
            <dt className="text-xs text-muted-foreground">Totale versato</dt>
            <dd className="mt-1 font-sans text-xl font-semibold tabular-nums">
              {formatEuro(totaleVersato)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Fatture ricevute</dt>
            <dd className="mt-1 font-sans text-xl font-semibold tabular-nums">
              {fattureTotali}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
