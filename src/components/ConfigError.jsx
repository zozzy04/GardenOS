import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const ConfigError = () => {
  const configError = window.__SUPABASE_CONFIG_ERROR__

  if (!configError) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/80 p-4 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="config-error-title"
    >
      <Card className="max-h-[min(90dvh,720px)] w-full max-w-lg overflow-y-auto border-destructive/20 shadow-xl">
        <CardHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" aria-hidden />
            <CardTitle id="config-error-title" className="text-lg font-sans">
              Configurazione mancante
            </CardTitle>
          </div>
          <CardDescription>
            Le variabili d&apos;ambiente Supabase non sono configurate. Senza URL e chiave pubblica
            l&apos;app non può connettersi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>Passi rapidi</AlertTitle>
            <AlertDescription>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-foreground">
                <li>
                  Crea <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> o{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code> nella root
                  del progetto.
                </li>
                <li>
                  Imposta{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> o{' '}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
                  .
                </li>
                <li>
                  Imposta la chiave pubblica (
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    VITE_SUPABASE_ANON_KEY
                  </code>{' '}
                  o equivalente publishable).
                </li>
                <li>
                  Riavvia <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run dev</code>.
                </li>
              </ol>
            </AlertDescription>
          </Alert>

          <details className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <summary className="cursor-pointer font-medium">Dettagli tecnici</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-muted p-2 text-xs">
              {JSON.stringify(configError, null, 2)}
            </pre>
          </details>

          <Button variant="outline" className="w-full" asChild>
            <a
              href="https://supabase.com/dashboard/project/_/settings/api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Apri Supabase API settings
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default ConfigError
