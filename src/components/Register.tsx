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
import { PasswordInput } from '@/components/ui/password-input'
import { AuthShell } from '@/components/auth-shell'
import { AuthFooter } from '@/components/auth-footer'
import { describeSignUpError } from '@/lib/auth-errors'
import { useAuth } from '../hooks/useSupabase'

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
  const [error, setError] = React.useState('')
  const [info, setInfo] = React.useState('')
  const [loading, setLoading] = React.useState(false)

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
      // Il nome viaggia nei metadati di signUp: lo scrive il trigger
      // handle_new_user_profile. Il client non tocca mai `profiles`.
      const { data, error: signUpError } = await signUp(email.trim(), password, {
        display_name: displayName.trim(),
      })

      if (signUpError) {
        setError(describeSignUpError(signUpError))
        setLoading(false)
        return
      }

      if (data?.user && !data.session) {
        setInfo(
          "Registrazione completata. Conferma l'indirizzo dalla mail che hai ricevuto, poi attendi l'approvazione del gestore."
        )
      } else {
        setInfo(
          'Account creato. Il gestore riceverà la richiesta e ti assegnerà alla tua famiglia.'
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
                <CardDescription className="text-balance text-center text-xs leading-relaxed">
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
                    <PasswordInput
                      id="reg-password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                      minLength={8}
                      className="h-11 sm:h-10"
                    />
                    <FieldDescription>Almeno 8 caratteri.</FieldDescription>
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
                    <FieldDescription>
                      Sarà il gestore ad abbinare il tuo account all&apos;unità
                      millesimale corretta al momento dell&apos;approvazione.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      className="mt-1 h-11 w-full text-md font-medium sm:h-10 sm:text-sm"
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

          <AuthFooter />
        </div>
      </div>
    </AuthShell>
  )
}
