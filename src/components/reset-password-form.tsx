import * as React from "react"
import { KeyRoundIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { PasswordInput } from "@/components/ui/password-input"
import { AuthShell } from "@/components/auth-shell"
import { AuthFooter } from "@/components/auth-footer"
import { toastSuccess } from "@/lib/notify"
import { useAuth } from "../hooks/useSupabase"

const LUNGHEZZA_MINIMA = 8

/** Mostrata quando si rientra dal link di recupero: finché non si sceglie una
 *  nuova password l'app non va avanti, altrimenti il link non servirebbe. */
export function ResetPasswordForm() {
  const { updatePassword, signOut } = useAuth()
  const [password, setPassword] = React.useState("")
  const [conferma, setConferma] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < LUNGHEZZA_MINIMA) {
      setError(`La password deve avere almeno ${LUNGHEZZA_MINIMA} caratteri.`)
      return
    }
    if (password !== conferma) {
      setError("Le due password non coincidono.")
      return
    }

    setLoading(true)
    const { error: updateError } = await updatePassword(password)
    setLoading(false)

    if (updateError) {
      setError(updateError.message || "Non è stato possibile aggiornare la password.")
      return
    }
    toastSuccess("Password aggiornata")
  }

  return (
    <AuthShell className="gap-6">
      <div className="w-full max-w-[min(100%,400px)] sm:max-w-sm">
        <div className="flex flex-col gap-5 sm:gap-6">
          <Card className="border-border/50 shadow-xl shadow-primary/5 dark:border-border/40 dark:shadow-none">
            <CardHeader className="space-y-4 pb-2">
              <div className="flex justify-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <KeyRoundIcon className="size-7" strokeWidth={2.25} />
                </div>
              </div>
              <div className="space-y-1.5">
                <CardTitle className="text-center font-heading text-2xl font-semibold tracking-tight">
                  Nuova password
                </CardTitle>
                <CardDescription className="text-balance text-center text-md">
                  Scegline una e torni subito operativo.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit}>
                <FieldGroup>
                  {error ? <FieldError>{error}</FieldError> : null}
                  <Field>
                    <FieldLabel htmlFor="reset-password">Nuova password</FieldLabel>
                    <PasswordInput
                      id="reset-password"
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 sm:h-10"
                    />
                    <FieldDescription>Almeno {LUNGHEZZA_MINIMA} caratteri.</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="reset-conferma">Conferma</FieldLabel>
                    <PasswordInput
                      id="reset-conferma"
                      name="conferma"
                      value={conferma}
                      onChange={(e) => setConferma(e.target.value)}
                      required
                      autoComplete="new-password"
                      disabled={loading}
                      className="h-11 sm:h-10"
                    />
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
                          Aggiornamento...
                        </>
                      ) : (
                        "Salva la password"
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
              onClick={() => signOut()}
            >
              Annulla ed esci
            </button>
          </p>

          <AuthFooter />
        </div>
      </div>
    </AuthShell>
  )
}
