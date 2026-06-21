import * as React from 'react'
import { Leaf, Loader2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AuthShell } from '@/components/auth-shell'
import { describeSignUpError } from '@/lib/auth-errors'
import { useAuth } from '../hooks/useSupabase'
import { supabase } from '../config/supabase'

type FamigliaRow = { id: string; nome: string; millesimi: number; ordine: number }

export function Register({
  onBack,
  className,
}: {
  onBack: () => void
  className?: string
}) {
  const { signUp } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [displayName, setDisplayName] = React.useState('')
  const [famigliaId, setFamigliaId] = React.useState('')
  const [famiglie, setFamiglie] = React.useState<FamigliaRow[]>([])
  const [error, setError] = React.useState('')
  const [info, setInfo] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [loadingFamiglie, setLoadingFamiglie] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingFamiglie(true)
      const { data, error: e } = await supabase
        .from('famiglie')
        .select('id, nome, millesimi, ordine')
        .order('ordine', { ascending: true })
      if (cancelled) return
      if (e) {
        setError('Impossibile caricare le famiglie. Verifica Supabase e lo script SQL.')
      } else if (data?.length) {
        setFamiglie(data as FamigliaRow[])
      }
      setLoadingFamiglie(false)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      if (!email.trim() || !password) {
        setError('Email e password sono obbligatorie')
        setLoading(false)
        return
      }
      if (!famigliaId) {
        setError('Seleziona la tua famiglia / unità millesimale')
        setLoading(false)
        return
      }

      const { data, error: signUpError } = await signUp(email.trim(), password, {})

      if (signUpError) {
        setError(describeSignUpError(signUpError))
        setLoading(false)
        return
      }

      const uid = data?.user?.id
      const display = displayName.trim() || null

      if (uid && data.session) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ famiglia_id: famigliaId, display_name: display })
          .eq('user_id', uid)

        if (profileError) {
          try {
            localStorage.setItem(
              'gardenos_pending_profile',
              JSON.stringify({
                user_id: uid,
                email: email.trim().toLowerCase(),
                famiglia_id: famigliaId,
                display_name: display,
              })
            )
          } catch {
            /* ignore */
          }
          setError(
            profileError.code === '42501' ||
              String(profileError.message || '').toLowerCase().includes('policy')
              ? 'Account creato, ma non è permesso salvare famiglia/nome. Esegui in Supabase lo script `supabase-policy-profiles-pending-update.sql`, poi ricarica l\'app.'
              : profileError.message || 'Errore nel salvataggio della famiglia sul profilo.'
          )
          setLoading(false)
          return
        }
      } else if (uid) {
        try {
          localStorage.setItem(
            'gardenos_pending_profile',
            JSON.stringify({
              user_id: uid,
              email: email.trim().toLowerCase(),
              famiglia_id: famigliaId,
              display_name: display,
            })
          )
        } catch {
          /* ignore quota */
        }
      }

      if (data?.user && !data.session) {
        setInfo(
          "Registrazione completata. Controlla la casella email per confermare l'indirizzo; al primo accesso verranno salvati famiglia e nome."
        )
      } else {
        setInfo(
          'Account creato. La tua richiesta è in attesa di approvazione da parte del gestore.'
        )
      }
    } catch (err) {
      console.error(err)
      setError('Si è verificato un errore. Riprova.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell className={cn('gap-6', className)}>
      <div className="w-full max-w-[min(100%,420px)] sm:max-w-[400px]">
        <div className="flex flex-col gap-5 sm:gap-6">
          <Card className="border-border/50 shadow-xl shadow-primary/5 dark:border-border/40 dark:shadow-none">
            <CardHeader className="space-y-4 pb-2">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <Leaf className="size-7" strokeWidth={2.25} />
                </div>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-center font-heading text-2xl font-semibold tracking-tight">
                  Registrati
                </CardTitle>
                <CardDescription className="text-balance text-center text-[0.8125rem] leading-relaxed">
                  Richiesta accesso condominio a GardenOS
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {error ? <FieldError>{error}</FieldError> : null}
                  {info ? (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm text-foreground">
                      {info}
                    </div>
                  ) : null}
                  <Field>
                    <FieldLabel htmlFor="reg-email">Email</FieldLabel>
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      placeholder="nome@esempio.it"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="h-11 sm:h-10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                    <Input
                      id="reg-password"
                      name="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                      minLength={6}
                      className="h-11 sm:h-10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reg-name">Nome (opzionale)</FieldLabel>
                    <Input
                      id="reg-name"
                      name="displayName"
                      type="text"
                      placeholder="Es. Mario Rossi"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      className="h-11 sm:h-10"
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Famiglia</FieldLabel>
                    <Select
                      value={famigliaId}
                      onValueChange={setFamigliaId}
                      disabled={loading || loadingFamiglie || famiglie.length === 0}
                      required
                    >
                      <SelectTrigger className="h-11 w-full sm:h-10">
                        <SelectValue placeholder="Seleziona la tua famiglia" />
                      </SelectTrigger>
                      <SelectContent>
                        {famiglie.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Deve coincidere con l&apos;elenco millesimi del condominio.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      className="mt-1 h-11 w-full text-[0.9375rem] font-medium sm:h-10 sm:text-sm"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2Icon className="animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        'Invia richiesta'
                      )}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground">
            <button
              type="button"
              className="font-medium text-primary underline-offset-2 hover:underline"
              onClick={onBack}
            >
              Torna al login
            </button>
          </p>

          <FieldDescription className="text-balance text-center text-[0.6875rem] tracking-wide text-muted-foreground/60">
            Powered by{' '}
            <a
              href="https://riccardozozzolotto.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
            >
              Riccardo Zozzolotto
            </a>
          </FieldDescription>
        </div>
      </div>
    </AuthShell>
  )
}
